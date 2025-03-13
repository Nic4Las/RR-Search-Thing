<script lang="ts">
    import { onMount } from "svelte";
    import * as ort from "onnxruntime-web/wasm";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import { novelDB, type Novel } from "../../db/novels";
    import vectorDB from "../../db/embeddings";
    import onnxModelUrl from "../../assets/vector_search.onnx?url";
    import BookCard from "$lib/components/BookCard.svelte";

    // Similar book data
    let { similarNovel }: { similarNovel: Novel | null } = $props();

    // onnx runtime session and embeddings tensor
    let session: ort.InferenceSession | null = null;
    let embeddings: ort.TypedTensor<"int8"> | null = null;

    // Pagination state
    let currentPage = $state(1);
    const booksPerPage = 10;
    let totalBooks = $state(0);

    // Book data
    let books: Novel[] = $state([]);

    // Function to load books for the current page
    async function loadBooks(pageNr: number, novelsPerPage: number, similarNovel: Novel | null = null) {
        if (similarNovel && embeddings && session) {
            const embeddingDim = embeddings.dims[1];
            let similarBookIndex = similarNovel.embeddingsIndex;
            let rawEmbeddingsArray = await embeddings.getData();
            let similarBookEmbedding = rawEmbeddingsArray.slice(similarBookIndex * embeddingDim, (similarBookIndex + 1) * embeddingDim);
            let inputTensor = new ort.Tensor("int8", similarBookEmbedding, [1, embeddingDim]);

            let output = await session.run({
                query: inputTensor,
                corpus: embeddings,
                top_k: new ort.Tensor("int64", [100], [1]),
            });

            let similarBookIndices = output.index.data as BigInt64Array;
            let similarBooksOrNull = (await novelDB.novels.bulkGet(Array.from(similarBookIndices).map((index) => Number(index)))).slice((pageNr - 1) * novelsPerPage, pageNr * novelsPerPage);

            if (similarBooksOrNull) {
                books = similarBooksOrNull.filter((book) => book !== null) as Novel[];
            } else {
                books = await novelDB.novels
                    .orderBy("views")
                    .reverse()
                    .distinct()
                    .offset((pageNr - 1) * novelsPerPage)
                    .limit(novelsPerPage)
                    .toArray();
            }
        } else {
            // Load books for current page
            books = await novelDB.novels
                .orderBy("views")
                .reverse()
                .distinct()
                .offset((pageNr - 1) * novelsPerPage)
                .limit(novelsPerPage)
                .toArray();
        }
    }

    onMount(async () => {
        await loadBooks(1, booksPerPage);
        totalBooks = await novelDB.novels.count();

        let embeddingsArray = (await vectorDB.embeddings.toArray())[0];
        embeddings = new ort.Tensor("int8", embeddingsArray.vectors.data as Int8Array, embeddingsArray.vectors.shape);

        // Load the ONNX model
        session = await ort.InferenceSession.create(onnxModelUrl);
    });

    // Update books when page changes
    $effect(() => {
        loadBooks(currentPage, booksPerPage, similarNovel);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-semibold mb-4">Recommended Books</h2>
    <div class="space-y-4">
        {#each books as book (book.embeddingsIndex)}
            <BookCard {book} />
        {/each}
    </div>

    <!-- Pagination -->
    <div class="mt-8">
        <Pagination.Root count={Math.ceil(totalBooks / booksPerPage)} perPage={booksPerPage} bind:page={currentPage}>
            {#snippet children({ pages, currentPage })}
                <Pagination.Content>
                    <Pagination.Item>
                        <Pagination.PrevButton />
                    </Pagination.Item>
                    {#each pages as page (page.key)}
                        {#if page.type === "ellipsis"}
                            <Pagination.Item>
                                <Pagination.Ellipsis />
                            </Pagination.Item>
                        {:else}
                            <Pagination.Item>
                                <Pagination.Link {page} isActive={currentPage === page.value}>
                                    {page.value}
                                </Pagination.Link>
                            </Pagination.Item>
                        {/if}
                    {/each}
                    <Pagination.Item>
                        <Pagination.NextButton />
                    </Pagination.Item>
                </Pagination.Content>
            {/snippet}
        </Pagination.Root>
    </div>
</div>

<style>
    /* Tailwind utility for landscape mode */
    @media (orientation: landscape) {
        .landscape\:block {
            display: block;
        }
        .landscape\:hidden {
            display: none;
        }
        .landscape\:px-6 {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }
        .landscape\:py-2 {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
        }
    }
</style>
