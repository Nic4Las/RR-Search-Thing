<script lang="ts">
    import DownloadModal from "$lib/components/DownloadModal.svelte";
    import type { Novel } from "./db/novels";
// Add imports for the theme switcher
    import { Button } from "$lib/components/ui/button/index.js";
    import BookOpen from "@lucide/svelte/icons/book-open";
    import Home from "@lucide/svelte/icons/home";
    import Map from "@lucide/svelte/icons/map";
    import Menu from "@lucide/svelte/icons/menu";
    import Moon from "@lucide/svelte/icons/moon";
    import Sun from "@lucide/svelte/icons/sun";
    import { ModeWatcher, toggleMode } from "mode-watcher";
// Import slide animation
    import NovelMap from "$lib/components/NovelMap/NovelMap.svelte";
    import SimilaritySearch from "$lib/components/SimilaritySearch/SimilaritySearch.svelte";
    import { cubicOut } from "svelte/easing";
    import { slide } from "svelte/transition";

    type Pages = "home" | "favorites" | "novel_map";

    let searchResult = $state<Novel | null>(null);
    let currentPage = $state<Pages>("home");

    // map query
    let mapQuery = $state<Novel|null>(null);

    // Mobile menu state
    let mobileMenuOpen = $state(false);

    // Navigation items
    const navItems = [
        { id: "home" as const, label: "Home", icon: Home },
        // { id: "favorites" as const, label: "Favorites", icon: Heart },
        { id: "novel_map" as const, label: "Novel Map", icon: Map },
    ];

    // Toggle mobile menu
    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    // Navigate to page
    function navigateTo(page: Pages) {
        currentPage = page;
        mobileMenuOpen = false; // Close mobile menu after navigation
    }

    const searchInMap = (novel: Novel) => {
        currentPage = "novel_map";
        mapQuery = novel;
    };
</script>

<ModeWatcher />

<header
    class="backdrop-blur-md bg-gradient-to-r from-background/80 via-background/90 to-background/80 border-b py-4 px-0 sm:px-4 shadow-sm sticky top-0 z-[45] dark:border-slate-700 dark:from-background/70 dark:via-background/80 dark:to-background/70"
>
    <div class="w-full sm:container sm:mx-auto flex justify-between items-center">
        <div class="flex items-center gap-3 pl-2 sm:pl-0">
            <!-- Mobile Menu Toggle moved here -->
            <Button onclick={toggleMobileMenu} variant="ghost" size="icon" class="md:hidden" aria-label="Menu">
                <Menu class="h-5 w-5" />
            </Button>
            <div class="p-2 bg-primary/10 rounded-full">
                <BookOpen class="h-6 w-6 text-primary" />
            </div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">RR Search Thing</h1>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-6">
            {#each navItems as { id, label, icon: Icon }}
                <button
                    onclick={() => navigateTo(id)}
                    class="flex items-center gap-2 py-2 text-sm font-medium transition-colors relative group"
                    class:text-primary={currentPage === id}
                    class:text-muted-foreground={currentPage !== id}
                >
                    <Icon class="h-5 w-5" />
                    <span>{label}</span>
                    {#if currentPage === id}
                        <span class="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-primary"></span>
                    {/if}
                    <span
                        class="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                    ></span>
                </button>
            {/each}
        </nav>

        <div class="flex items-center gap-4 pr-4 sm:pr-0">
            <!-- Removed mobile menu toggle from here -->

            <span class="hidden md:inline text-sm text-muted-foreground font-medium">Find your perfect book match</span>
            <Button
                onclick={toggleMode}
                variant="outline"
                size="icon"
                class="rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80"
            >
                <Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span class="sr-only">Toggle theme</span>
            </Button>
        </div>
    </div>
</header>

<!-- Mobile Navigation Drawer -->
{#if mobileMenuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
        onclick={() => (mobileMenuOpen = false)}
        transition:slide={{ duration: 200, easing: cubicOut }}
    ></div>
    <nav
        class="fixed top-[73px] left-0 bottom-0 w-64 backdrop-blur-md bg-gradient-to-r from-background/80 via-background/90 to-background/80 shadow-lg z-40 p-4 border-r dark:border-slate-700 dark:from-background/70 dark:via-background/80 dark:to-background/70 overflow-hidden"
        transition:slide={{ duration: 300, easing: cubicOut, axis: "x" }}
    >
        <div class="space-y-2 w-full">
            {#each navItems as { id, label, icon: Icon }}
                <button
                    onclick={() => navigateTo(id)}
                    class="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors"
                    class:bg-primary={currentPage === id}
                    class:text-primary-foreground={currentPage === id}
                    class:text-foreground={currentPage !== id}
                    class:hover:bg-muted={currentPage !== id}
                >
                    <Icon class="h-5 w-5 flex-shrink-0" />
                    <span class="whitespace-nowrap">{label}</span>
                </button>
            {/each}
        </div>
    </nav>
{/if}

<main>
    <DownloadModal />

    {#if currentPage === "home"}
        <SimilaritySearch {searchResult} searchInMap={searchInMap} />
    {:else if currentPage === "favorites"}
        <h1>Favorites</h1>
    {:else if currentPage === "novel_map"}
        <NovelMap mapQuery={mapQuery} />
    {/if}
</main>
