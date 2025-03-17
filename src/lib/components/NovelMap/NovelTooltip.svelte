<script lang="ts">
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
    import { Eye, Heart, Star, Book, BookOpen } from "lucide-svelte";
    import { fly } from "svelte/transition";
    import type { Novel } from "../../../db/novels";
    
    export let novel: Novel | null = null;
    export let x: number = 0;
    export let y: number = 0;
    export let visible: boolean = false;
    
    // Ensure the tooltip stays within viewport bounds
    $: adjustedX = Math.min(x, window.innerWidth - 320);
    $: adjustedY = Math.min(y, window.innerHeight - 200);
    
    /**
     * Formats a number to a simplified format with k, M, B suffixes
     */
    function formatNumber(num: number, digits: number = 1): string {
        if (!num) return "0";
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        
        const item = lookup.slice().reverse().find(item => num >= item.value);
        
        return item
            ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
            : "0";
    }
</script>

{#if visible && novel}
    <div 
        class="absolute z-50 w-[320px] touch-none" 
        style="left: {adjustedX}px; top: {adjustedY}px;"
        transition:fly={{ y: 5, duration: 200 }}
    >
        <Card class="shadow-lg border-primary/20">
            <CardContent class="p-3">
                <div class="flex gap-3">
                    <!-- Cover image -->
                    <div class="w-16 h-24 shrink-0">
                        <img 
                            src={novel.cover !== "" ? novel.cover : "https://www.royalroad.com/dist/img/nocover-new-min.png"}
                            alt={`Cover of ${novel.title}`}
                            class="w-full h-full object-cover rounded-sm"
                        />
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <!-- Title and label -->
                        <h3 class="font-medium text-sm line-clamp-2">{novel.title}</h3>
                        <p class="text-xs text-muted-foreground">{novel.label}</p>
                        
                        <!-- Stats -->
                        <div class="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <div class="flex items-center gap-1">
                                <Star class="h-3 w-3 fill-primary text-primary" />
                                <span>{novel.rating}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <Heart class="h-3 w-3" />
                                <span>{formatNumber(novel.followingUsers)}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <Eye class="h-3 w-3" />
                                <span>{formatNumber(novel.views)}</span>
                            </div>
                        </div>
                        
                        <!-- Chapters and Pages -->
                        <div class="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <div class="flex items-center gap-1">
                                <Book class="h-3 w-3" />
                                <span>{novel.chapters} ch</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <BookOpen class="h-3 w-3" />
                                <span>{novel.pages} pg</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tags -->
                <div class="text-xs text-muted-foreground mt-2 flex gap-1.5 flex-wrap">
                    {#if novel.tags && novel.tags.length > 0}
                        {#each novel.tags.slice(0, 3) as tag}
                            <span class="bg-primary/10 px-2 py-0.5 rounded-full">{tag}</span>
                        {/each}
                        {#if novel.tags.length > 3}
                            <span class="text-xs opacity-80">+{novel.tags.length - 3}</span>
                        {/if}
                    {/if}
                </div>
                
                <!-- Description -->
                <p class="text-xs line-clamp-3 mt-2">
                    {novel.description || "No description available"}
                </p>
            </CardContent>
        </Card>
    </div>
{/if}
