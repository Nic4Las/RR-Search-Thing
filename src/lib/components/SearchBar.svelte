
<script lang="ts">
    import DownloadModal from "$lib/components/DownloadModal.svelte";
    import { Input } from "$lib/components/ui/input";
    import { Search, Eye } from "@lucide/svelte";
    import { novelDB, type Novel } from "../../db/novels";

	let currentSearch = $state("");

	let { novelSelected } : { novelSelected: (novel: Novel) => void } = $props();

    let suggestions: Novel[] = $state([]);
    let showSuggestions = $state(false);
    let inputValue = $state(""); // Temporary value for input
    let debounceTimer: ReturnType<typeof setTimeout>; // Timer for debounce
    let selectionJustMade = $state(false); // Flag to track when a selection was just made
    let selectedIndex = $state(-1); // Track currently selected suggestion
    let suggestionsContainer: HTMLDivElement; // Reference to suggestions container

    // Debounce function to limit how often we update the search
    function debounceSearch(value: string) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearch = value;
            selectionJustMade = false; // Reset the flag when user types
            selectedIndex = -1; // Reset selection when search changes
        }, 300); // 300ms debounce time
    }

    function performSearch() {
        currentSearch = inputValue;
        // Add any additional search functionality here
    }

    // Function to format view count (e.g., 1000 -> 1K, 1000000 -> 1M)
    function formatViewCount(views: number): string {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1).replace(/\.0$/, "") + "K";
        }
        return views.toString();
    }

    $effect(() => {
        // Update suggestions when search changes
        updateSuggestions();
    });

    async function updateSuggestions() {
        if (!currentSearch.trim()) {
            suggestions = [];
            showSuggestions = false;
            selectedIndex = -1; // Reset selection when no suggestions
            return;
        }

        // Don't show suggestions if a selection was just made
        if (selectionJustMade) {
            return;
        }

        // Split search by spaces to get words
        const words = currentSearch.trim().toLowerCase().split(/\s+/);
        // Use the last word for suggestions
        const latestWord = words[words.length - 1];

        if (latestWord) {
            try {
                // Query titleWords index for words starting with the latest word
                const matchingNovels = (await novelDB.novels.where("titleWords").startsWithIgnoreCase(latestWord).distinct().sortBy("views"))
                    .reverse()
                    .slice(0, 10);

                showSuggestions = matchingNovels.length > 0;
                suggestions = matchingNovels;
                selectedIndex = -1; // Reset selection when suggestions update
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                suggestions = [];
                showSuggestions = false;
                selectedIndex = -1;
            }
        } else {
            suggestions = [];
            showSuggestions = false;
            selectedIndex = -1;
        }
    }

    function selectSuggestion(novel: Novel) {
        currentSearch = novel.title;
        inputValue = novel.title;
        showSuggestions = false;
        selectionJustMade = true; // Set flag when selection is made
        selectedIndex = -1; // Reset selection
        novelSelected(novel);
    }

    // Sync inputValue with currentSearch changes (e.g., when set programmatically)
    $effect(() => {
        inputValue = currentSearch;
    });

    // Handle keyboard navigation
    function handleKeyNavigation(e: KeyboardEvent) {
        if (!showSuggestions || suggestions.length === 0) return;
        
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault(); // Prevent cursor from moving
                selectedIndex = (selectedIndex + 1) % suggestions.length;
                scrollSelectedIntoView();
                break;
            case "ArrowUp":
                e.preventDefault(); // Prevent cursor from moving
                selectedIndex = selectedIndex <= 0 ? suggestions.length - 1 : selectedIndex - 1;
                scrollSelectedIntoView();
                break;
            case "Enter":
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    e.preventDefault(); // Prevent form submission
                    selectSuggestion(suggestions[selectedIndex]);
                } else {
                    performSearch();
                }
                break;
            case "Escape":
                showSuggestions = false;
                selectedIndex = -1;
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
</script>

<div class="flex w-full max-w-lg mx-auto items-center">
    <div class="relative flex-1">
        <Input
            type="text"
            placeholder="Enter a book title..."
            class="pl-4 pr-10 py-6"
            bind:value={inputValue}
            oninput={() => debounceSearch(inputValue)}
            onfocus={() => {
                if (suggestions.length > 0) showSuggestions = true;
            }}
            onblur={() => {
                setTimeout(() => {
                    showSuggestions = false;
                    selectedIndex = -1;
                }, 200); // Delay hiding suggestions to allow click events
            }}
            onkeydown={(e) => handleKeyNavigation(e)}
        />
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
                        class="suggestion-item w-full text-left px-4 py-2 hover:bg-muted flex items-center justify-between {i === selectedIndex ? 'bg-muted' : ''}"
                        onclick={() => {
                            selectSuggestion(suggestion);
                        }}
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