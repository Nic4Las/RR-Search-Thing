<script lang="ts">
	import SearchBar from "./lib/components/SearchBar.svelte";
	import DownloadModal from "$lib/components/DownloadModal.svelte";
	import BookList from "$lib/components/BookList.svelte";
    import type { Novel } from "./db/novels";
    import BookListV2 from "$lib/components/BookListV2.svelte";
    import Filters from "$lib/components/Filters.svelte";
    
    // Add imports for the theme switcher
    import { ModeWatcher, toggleMode } from "mode-watcher";
    import Sun from "@lucide/svelte/icons/sun";
    import Moon from "@lucide/svelte/icons/moon";
    import BookOpen from "@lucide/svelte/icons/book-open";
    import { Button } from "$lib/components/ui/button/index.js";

	let currentSearch = $state("");
	let searchResult = $state<Novel|null>(null);
</script>

<ModeWatcher />

<header class="backdrop-blur-md bg-gradient-to-r from-background/80 via-background/90 to-background/80 border-b py-4 px-4 shadow-sm sticky top-0 z-10 dark:border-slate-700 dark:from-background/70 dark:via-background/80 dark:to-background/70">
  <div class="container mx-auto flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-primary/10 rounded-full">
        <BookOpen class="h-6 w-6 text-primary" />
      </div>
      <h1 class="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        RR Search Thing
      </h1>
    </div>
    <div class="flex items-center gap-4">
      <span class="hidden md:inline text-sm text-muted-foreground font-medium">Find your perfect book match</span>
      <Button onclick={toggleMode} variant="outline" size="icon" class="rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80">
        <Sun
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Moon
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </div>
  </div>
</header>

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
			<BookListV2 similarNovel={searchResult}/>
		</section>
	</main>
</main>
