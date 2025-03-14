<script lang="ts">
    import { onMount } from "svelte";
    import * as ort from "onnxruntime-web";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import { novelDB, type Novel } from "../../db/novels";
    import vectorDB from "../../db/embeddings";
    import onnxModelUrl from "../../assets/vector_search.onnx?url";
    import BookCard from "$lib/components/BookCard.svelte";
    import Filters, { type FilterState, type LastUpdatedOption } from "./Filters.svelte";

    // Similar book data
    let { similarNovel }: { similarNovel: Novel | null } = $props();

    // onnx runtime session and embeddings tensor
    let session: ort.InferenceSession | null = null;
    let embeddings: ort.TypedTensor<"int8"> | null = null;

    // Pagination state
    let currentPage = $state(1);
    const booksPerPage = 10;
    let totalBooks = $derived.by(async () => await novelDB.novels.count());

    // Filters
    let filters: FilterState | null = $state<FilterState | null>(null);

    onMount(async () => {
        let embeddingsArray = (await vectorDB.embeddings.toArray())[0];
        embeddings = new ort.Tensor("int8", embeddingsArray.vectors.data as Int8Array, embeddingsArray.vectors.shape);

        // Load the ONNX model
        session = await ort.InferenceSession.create(onnxModelUrl);
    });

    const getSimilarNovelIndexes = async (
        similarNovel: Novel | null,
        embeddings: ort.TypedTensor<"int8"> | null,
        session: ort.InferenceSession | null
    ) => {
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

            return Array.from(output.index.data as BigInt64Array).map((index) => Number(index));
        } else {
            return null;
        }
    };

    const lastUpdatedOptionToInt = (option: LastUpdatedOption): number => {
        switch (option) {
            case "1day":
                return Date.now() - 24 * 60 * 60 * 1000;
            case "3days":
                return Date.now() - 3 * 24 * 60 * 60 * 1000;
            case "7days":
                return Date.now() - 7 * 24 * 60 * 60 * 1000;
            case "1month":
                return Date.now() - 30 * 24 * 60 * 60 * 1000;
            case "1year":
                return Date.now() - 365 * 24 * 60 * 60 * 1000;
            default:
                return 0;
        }
    };

    const filterNovel = (
        filters: FilterState,
        novel: Novel
    ): boolean => {
        let minViews = filters.views[0];
        let maxViews = filters.views[1];

        let minRating = filters.rating[0];
        let maxRating = filters.rating[1];

        let minChapters = filters.chapters[0];
        let maxChapters = filters.chapters[1];

        let minPages = filters.pages[0];
        let maxPages = filters.pages[1];

        let tags = filters.tags;
        
        let labels = filters.labels;
        
        let lastUpdated = filters.lastUpdated;

        let views = novel.views;
        let rating = novel.rating;
        let chapters = novel.chapters;
        let pages = novel.pages;
        let lastUpdatedDate = novel.lastUpdated;

        if (views < minViews || views > maxViews) {
            return false;
        }

        if (rating < minRating || rating > maxRating) {
            return false;
        }

        if (chapters < minChapters || chapters > maxChapters) {
            return false;
        }

        if (pages < minPages || pages > maxPages) {
            return false;
        }

        if (lastUpdatedDate > Date.now()-lastUpdatedOptionToInt(lastUpdated)) {
            return false;
        }

        if (tags) {
            for (let tag in tags) {
                if (tags[tag] === "included" && !novel.tags.includes(tag)) {
                    return false;
                } else if (tags[tag] === "excluded" && novel.tags.includes(tag)) {
                    return false;
                }
            }
        }

        // if (labels) {
        //     for (let label of labels) {
        //         if (!novel.label.includes(label)) {
        //             return false;
        //         }
        //     }
        // }

        return true;
    };

    const deriveNovels = async (
        currentPage: number,
        booksPerPage: number,
        filters: FilterState | null,
        similarNovelIndexes: number[] | null
    ) => {

        // useless shit to get svelte to check if i update the properties of an object
        
        if(filters){
            filters.views[0];
            filters.views[1];
            filters.rating[0];
            filters.rating[1];
            filters.chapters[0];
            filters.chapters[1];
            filters.pages[0];
            filters.pages[1];
            filters.tags;
            filters.labels;
            filters.lastUpdated;
        }

        if (similarNovelIndexes) {
            if(filters){
                let similarBooksOrNull = ((await novelDB.novels.bulkGet(similarNovelIndexes))).slice(
                    (currentPage - 1) * booksPerPage,
                    currentPage * booksPerPage
                );
                if (similarBooksOrNull) {
                    return similarBooksOrNull.filter((book) => book !== undefined).filter((novel) => filterNovel(filters, novel)) as Novel[];
                }
            }
            else{
                let similarBooksOrNull = (await novelDB.novels.bulkGet(similarNovelIndexes)).slice(
                    (currentPage - 1) * booksPerPage,
                    currentPage * booksPerPage
                );
                if (similarBooksOrNull) {
                    return similarBooksOrNull.filter((book) => book !== null) as Novel[];
                }
            }

        }

        if (filters != null) {
            console.log(filters);
            let orderBy = filters.orderBy;
            let orderDirection = filters.orderDirection;

            if (orderDirection === "asc") {
                return novelDB.novels
                    .orderBy(orderBy)
                    .distinct()
                    .filter((novel) => filterNovel(filters, novel))
                    .offset((currentPage - 1) * booksPerPage)
                    .limit(booksPerPage)
                    .toArray();
            } else {
                return novelDB.novels
                    .orderBy(orderBy)
                    .reverse()
                    .distinct()
                    .filter((novel) => filterNovel(filters, novel))
                    .offset((currentPage - 1) * booksPerPage)
                    .limit(booksPerPage)
                    .toArray();
            }
        } else {
            return novelDB.novels
                .orderBy("views")
                .reverse()
                .distinct()
                .offset((currentPage - 1) * booksPerPage)
                .limit(booksPerPage)
                .toArray();
        }
    };

    // let similarNovelIndexes = $derived.by(() => {
    //     return getSimilarNovelIndexes(similarNovel, embeddings, session);
    // });

    let similarNovelIndexes = $state<number[] | null>(null);

    $effect(() => {

        similarNovel;
        embeddings;
        session;

        getSimilarNovelIndexes(similarNovel, embeddings, session).then((indexes) => {
            similarNovelIndexes = indexes;
        });
    });


    let books = $derived.by(() => deriveNovels(currentPage, booksPerPage, filters, similarNovelIndexes));

    // $inspect(similarNovelIndexes);
    // $inspect(books);
    // $inspect(totalBooks);
    // $inspect(filters);
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-semibold mb-4">Recommended Books</h2>
    <!-- Filters -->
    <Filters
        onApplyFilters={(filter) => {
            filters = filter;
        }}
    />
    {#await books}
        <div>Loading...</div>
    {:then books}
        <div class="space-y-4">
            {#each books as book (book.embeddingsIndex)}
                <BookCard {book} />
            {/each}
        </div>
    {/await}

    <!-- Pagination -->
    {#await totalBooks}
        <div>Loading...</div>
    {:then totalBooks}
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
    {/await}
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
