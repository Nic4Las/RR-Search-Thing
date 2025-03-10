<script lang="ts">
	import DownloadModal from "$lib/components/DownloadModal.svelte";
	import { Input } from "$lib/components/ui/input";
	import { Search } from "@lucide/svelte";
	import { Button } from "./lib/components/ui/button";
    import BookList from "$lib/components/BookList.svelte";

</script>

<main>
	<main class="container mx-auto px-4 py-8">
		<DownloadModal />
		<section class="max-w-5xl mx-auto">
		  <div class="text-center mb-8">
			<h1 class="text-3xl md:text-4xl font-bold mb-4">Find Your Next Great Read</h1>
			<p class="text-muted-foreground mb-6">Search for similar books based on titles you already love</p>
			<div class="flex w-full max-w-lg mx-auto items-center space-x-2">
			  <div class="relative flex-1">
				<Input type="text" placeholder="Enter a book title..." class="pl-4 pr-10 py-6" />
				<Search class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
			  </div>
			  <Button type="submit" size="lg">
				Search
			  </Button>
			</div>
		  </div>
		  <BookList />
		</section>
	  </main>
</main>
