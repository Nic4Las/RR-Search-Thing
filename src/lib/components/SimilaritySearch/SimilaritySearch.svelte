<script lang="ts">
    import type { Novel } from "src/db/novels";
    import BookListV2 from "./BookListV2.svelte";
    import SearchBar from "./SearchBar.svelte";

    let { searchResult, searchInMap } : { searchResult: Novel|null, searchInMap: (novel: Novel) => void } = $props();
    const searchSimilar = (novel: Novel) => {
        searchResult = novel;
    }
</script>

<section class="max-w-5xl mx-auto">
    <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">Find Your Next Great Read</h1>
        <p class="text-muted-foreground mb-6">Search for similar books based on titles you already love</p>
        <SearchBar novelSelected={(novel) => (searchResult = novel)}></SearchBar>
    </div>
    <BookListV2 similarNovel={searchResult} searchInMap={searchInMap} searchSimilar={searchSimilar} />
</section>