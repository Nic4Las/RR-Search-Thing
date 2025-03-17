<script lang="ts">
    import DownloadModal from "$lib/components/DownloadModal.svelte";
    import { Input } from "$lib/components/ui/input";
    import { Search, Eye, X } from "@lucide/svelte";
    import { novelDB, type Novel } from "src/db/novels";

    // Props
    let { novelSelected } : { novelSelected: (novel: Novel|null) => void } = $props();

    // Core state
    let query = $state("");
    let suggestions = $state<Novel[]>([]);
    let selectedIndex = $state(-1);
    
    // UI state
    let hasFocus = $state(false);
    let justSelected = $state(false);
    let suggestionsContainer: HTMLDivElement | null = $state(null);

    // Derived state
    let showSuggestions = $derived(
        suggestions.length > 0 && hasFocus && !justSelected
    );

    // Debounce mechanism with cleanup
    let debounceTimer: ReturnType<typeof setTimeout>;

    function handleInput(value: string) {
        query = value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            justSelected = false;
            fetchSuggestions();
        }, 300);
    }

    function performSearch() {
        // Additional search logic could go here
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            selectSuggestion(suggestions[selectedIndex]);
        }
    }

    // Format view count for display (1K, 1M, etc.)
    function formatViewCount(views: number): string {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
        }
        return views.toString();
    }

    async function fetchSuggestions() {
        if (!query.trim()) {
            suggestions = [];
            return;
        }

        const words = query.trim().toLowerCase().split(/\s+/);
        const latestWord = words[words.length - 1];

        if (!latestWord) {
            suggestions = [];
            return;
        }

        try {
            suggestions = (await novelDB.novels
                .where("titleWords")
                .startsWithIgnoreCase(latestWord)
                .distinct()
                .sortBy("views"))
                .reverse()
                .slice(0, 10);
            
            // Reset selection when suggestions update
            selectedIndex = -1;
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            suggestions = [];
        }
    }

    function selectSuggestion(novel: Novel) {
        query = novel.title;
        justSelected = true;
        suggestions = [];
        selectedIndex = -1;
        novelSelected(novel);
    }

    function clearSearch() {
        query = "";
        suggestions = [];
        selectedIndex = -1;
        justSelected = false;
        novelSelected(null);
    }

    // Handle keyboard navigation
    function handleKeyNavigation(e: KeyboardEvent) {
        if (!showSuggestions) return;
        
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % suggestions.length;
                scrollSelectedIntoView();
                break;
            case "ArrowUp":
                e.preventDefault();
                selectedIndex = selectedIndex <= 0 ? suggestions.length - 1 : selectedIndex - 1;
                scrollSelectedIntoView();
                break;
            case "Enter":
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    e.preventDefault();
                    selectSuggestion(suggestions[selectedIndex]);
                } else {
                    performSearch();
                }
                break;
            case "Escape":
                e.preventDefault();
                suggestions = [];
                break;
        }
    }
    
    // Scroll the selected suggestion into view
    function scrollSelectedIntoView() {
        setTimeout(() => {
            if (!suggestionsContainer || selectedIndex < 0) return;
            
            const selectedElement = suggestionsContainer.querySelector(`.suggestion-item:nth-child(${selectedIndex + 1})`);
            if (!selectedElement) return;
            
            const containerRect = suggestionsContainer.getBoundingClientRect();
            const elementRect = selectedElement.getBoundingClientRect();
            
            // Check if element is outside visible container
            if (elementRect.bottom > containerRect.bottom) {
                // Scroll down if element is below visible area
                suggestionsContainer.scrollTop += elementRect.bottom - containerRect.bottom;
            } else if (elementRect.top < containerRect.top) {
                // Scroll up if element is above visible area
                suggestionsContainer.scrollTop -= containerRect.top - elementRect.top;
            }
        }, 10); // Small delay to ensure DOM is updated
    }

    // Handle focus changes with a short delay to allow for clicks
    function handleBlur() {
        setTimeout(() => {
            hasFocus = false;
        }, 300);
    }
</script>

<div class="flex w-full max-w-lg mx-auto items-center">
    <div class="relative flex-1">
        <Input
            type="text"
            placeholder="Enter a book title..."
            class={`pr-10 py-6 ${query ? 'pl-10' : 'pl-4'}`}
            value={query}
            oninput={(e) => handleInput(e.currentTarget.value)}
            onfocus={() => { hasFocus = true; }}
            onblur={handleBlur}
            onkeydown={handleKeyNavigation}
        />
        
        {#if query}
            <button
                class="absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer rounded-full hover:bg-muted transition-colors"
                onclick={clearSearch}
                aria-label="Clear search"
            >
                <X class="h-4 w-4" />
            </button>
        {/if}
        
        <button
            class="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer rounded-full hover:bg-muted transition-colors"
            onclick={performSearch}
            aria-label="Search"
        >
            <Search class="h-5 w-5" />
        </button>

        {#if showSuggestions}
            <div 
                class="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-10 max-h-60 overflow-auto"
                bind:this={suggestionsContainer}
            >
                {#each suggestions as suggestion, i}
                    <button
                        class="suggestion-item w-full text-left px-4 py-2 
                               border-l-2 {i === selectedIndex ? 'bg-muted border-l-primary' : 'border-transparent hover:bg-muted/50 hover:border-l-primary/50'} 
                               flex items-center justify-between transition-colors"
                        onclick={() => selectSuggestion(suggestion)}
                        onmouseenter={() => selectedIndex = i}
                    >
                        <span>{suggestion.title}</span>
                        {#if suggestion.views !== undefined}
                            <span class="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye class="h-3 w-3" />
                                {formatViewCount(suggestion.views)}
                            </span>
                        {/if}
                    </button>
                {:else}
                    <div class="px-4 py-2 text-muted-foreground">No results found</div>
                {/each}
            </div>
        {/if}
    </div>
</div>