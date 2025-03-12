<script lang="ts">
	import SearchBar from "./lib/components/SearchBar.svelte";
	import DownloadModal from "$lib/components/DownloadModal.svelte";
	import BookList from "$lib/components/BookList.svelte";
    import type { Novel } from "./db/novels";

	let currentSearch = $state("");
	let searchResult = $state<Novel|null>(null);
</script>

<main>
	<main class="container mx-auto px-4 py-8">
		<DownloadModal />
		<section class="max-w-5xl mx-auto">
			<div class="text-center mb-8">
				<h1 class="text-3xl md:text-4xl font-bold mb-4">
					Find Your Next Great Read
				</h1>
				<p class="text-muted-foreground mb-6">
					Search for similar books based on titles you already love
				</p>
				<SearchBar novelSelected={(novel) => searchResult = novel}></SearchBar>
			</div>
			<BookList similarNovel={searchResult}/>
		</section>
	</main>
</main>
