<script lang="ts">
    import { Book, Eye, Heart, Star, ChevronDown, ChevronUp, BookOpen } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent } from "$lib/components/ui/card";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import { novelDB, type Novel } from "../../db/novels";
    import { onMount } from "svelte";
    import * as ort from "onnxruntime-web/wasm";
    import vectorDB from "../../db/embeddings";
    import onnxModelUrl from "../../assets/vector_search.onnx?url";
    import { on } from "svelte/events";

    // Similar book data
    let { similarNovel }: { similarNovel: Novel | null } = $props();

    // onnx runtime session and embeddings tensor
    let session: ort.InferenceSession | null = null;
    let embeddings: ort.TypedTensor<"int8"> | null = null;

    // Pagination state
    let currentPage = $state(1);
    const booksPerPage = 10;
    let totalBooks = $state(0);

    // Sample book data
    let books: Novel[] = $state([]);
    let expandedBooks = $state<number[]>([]);
    let expandedTags = $state<number[]>([]);

    // Function to load books for the current page
    async function loadBooks(pageNr: number, novelsPerPage: number, similarNovel: Novel | null = null) {

        if (similarNovel && embeddings && session) {

            console.log(similarNovel);

            const embeddingDim = embeddings.dims[1];
            console.log(embeddingDim);
            let similarBookIndex = similarNovel.embeddingsIndex;
            console.log(similarBookIndex);

            let rawEmbeddingsArray = await embeddings.getData();



            let similarBookEmbedding = rawEmbeddingsArray.slice(similarBookIndex * embeddingDim, (similarBookIndex + 1) * embeddingDim);

            let inputTensor = new ort.Tensor("int8", similarBookEmbedding, [1, embeddingDim]);




            let output = await session.run({
                query: inputTensor,
                corpus: embeddings,
                top_k: new ort.Tensor("int64", [100], [1]),
            });

            let similarBookIndices = output.index.data as BigInt64Array;


            let similarBooksOrNull = await novelDB.novels.bulkGet(Array.from(similarBookIndices).map((index) => Number(index)+1));
            console.log(similarBooksOrNull);

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
            };

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

    function toggleDescription(bookId: number) {
        if (expandedBooks.includes(bookId)) {
            expandedBooks = expandedBooks.filter((id) => id !== bookId);
        } else {
            expandedBooks = [...expandedBooks, bookId];
        }
    }

    function toggleTags(bookId: number) {
        if (expandedTags.includes(bookId)) {
            expandedTags = expandedTags.filter((id) => id !== bookId);
        } else {
            expandedTags = [...expandedTags, bookId];
        }
    }
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-semibold mb-4">Recommended Books</h2>
    <div class="space-y-4">
        {#each books as book (book.embeddingsIndex)}
            <Card class="overflow-hidden">
                <CardContent class="p-0">
                    <div class="flex flex-col">
                        <div class="flex flex-row p-6 pb-2 items-start">
                            <div class="relative w-32 md:w-48 aspect-[2/3] shrink-0">
                                <img
                                    src={book.cover !== "" ? book.cover : "https://www.royalroad.com/dist/img/nocover-new-min.png"}
                                    alt={`Cover of ${book.title}`}
                                    class="object-contain w-full h-full"
                                />
                            </div>
                            <div class="flex-1 pl-6">
                                <h3 class="text-xl font-bold">
                                    <a href={book.url} class="hover:text-primary transition-colors">
                                        {book.title}
                                    </a>
                                </h3>
                                <!-- Tags section - visible in both modes -->
                                <div class="flex flex-wrap gap-2 mb-4 mt-2">
                                    <Badge variant="default" class="px-3 py-1">
                                        {book.lable || "Unknown"}
                                    </Badge>
                                    {#each expandedTags.includes(book.embeddingsIndex) ? book.tags : book.tags.slice(0, 6) as tag}
                                        <Badge variant="secondary">
                                            {tag}
                                        </Badge>
                                    {/each}
                                    {#if book.tags.length > 6}
                                        <Button variant="ghost" size="sm" class="h-6 px-2" onclick={() => toggleTags(book.embeddingsIndex)}>
                                            <span class="flex items-center text-xs">
                                                {#if expandedTags.includes(book.embeddingsIndex)}
                                                    Show less <ChevronUp class="ml-1 h-3 w-3" />
                                                {:else}
                                                    +{book.tags.length - 6} more <ChevronDown class="ml-1 h-3 w-3" />
                                                {/if}
                                            </span>
                                        </Button>
                                    {/if}
                                </div>

                                <!-- Stats and description for landscape mode only -->
                                <div class="hidden landscape:block">
                                    <div class="flex gap-6 mb-4">
                                        <div class="flex items-center gap-1">
                                            <Star class="h-4 w-4 fill-primary text-primary" />
                                            <span class="text-sm font-medium">{book.rating}</span>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <Heart class="h-4 w-4" />
                                            <span class="text-sm">{book.followingUsers}</span>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <Eye class="h-4 w-4" />
                                            <span class="text-sm">{book.views}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p class="text-sm">
                                            {expandedBooks.includes(book.embeddingsIndex) ? book.description : book.description.slice(0, 100) + "..."}
                                        </p>
                                        <Button variant="ghost" size="sm" class="mt-2 h-8 px-2" onclick={() => toggleDescription(book.embeddingsIndex)}>
                                            {#if expandedBooks.includes(book.embeddingsIndex)}
                                                <span class="flex items-center">
                                                    Show less <ChevronUp class="ml-1 h-4 w-4" />
                                                </span>
                                            {:else}
                                                <span class="flex items-center">
                                                    Read more <ChevronDown class="ml-1 h-4 w-4" />
                                                </span>
                                            {/if}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Stats and description for portrait mode only -->
                        <div class="px-6 py-2 landscape:hidden">
                            <div class="flex gap-6 mb-4">
                                <div class="flex items-center gap-1">
                                    <Star class="h-4 w-4 fill-primary text-primary" />
                                    <span class="text-sm font-medium">{book.rating}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <Heart class="h-4 w-4" />
                                    <span class="text-sm">{book.followingUsers}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <Eye class="h-4 w-4" />
                                    <span class="text-sm">{book.views}</span>
                                </div>
                            </div>

                            <div>
                                <p class="text-sm">
                                    {expandedBooks.includes(book.embeddingsIndex) ? book.description : book.description.slice(0, 100) + "..."}
                                </p>
                                <Button variant="ghost" size="sm" class="mt-2 h-8 px-2" onclick={() => toggleDescription(book.embeddingsIndex)}>
                                    {#if expandedBooks.includes(book.embeddingsIndex)}
                                        <span class="flex items-center">
                                            Show less <ChevronUp class="ml-1 h-4 w-4" />
                                        </span>
                                    {:else}
                                        <span class="flex items-center">
                                            Read more <ChevronDown class="ml-1 h-4 w-4" />
                                        </span>
                                    {/if}
                                </Button>
                            </div>
                        </div>

                        <!-- Chapter/pages info - visible in both modes but positioned differently -->
                        <div
                            class="landscape:px-6 landscape:py-2 mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground"
                            class:px-6={true}
                            class:py-2={true}
                        >
                            <div class="flex items-center gap-1">
                                <Book class="h-4 w-4" />
                                <span>{book.chapters} chapters</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <BookOpen class="h-4 w-4" />
                                <span>{book.pages} pages</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
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
