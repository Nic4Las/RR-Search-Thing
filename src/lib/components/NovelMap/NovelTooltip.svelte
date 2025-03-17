<script lang="ts">
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
    import { fly } from "svelte/transition";
    import type { Novel } from "../../../db/novels";
    
    export let novel: Novel | null = null;
    export let x: number = 0;
    export let y: number = 0;
    export let visible: boolean = false;
    
    // Ensure the tooltip stays within viewport bounds
    $: adjustedX = Math.min(x, window.innerWidth - 320);
    $: adjustedY = Math.min(y, window.innerHeight - 200);
</script>

{#if visible && novel}
    <div 
        class="absolute z-50 w-[300px]" 
        style="left: {adjustedX}px; top: {adjustedY}px;"
        transition:fly={{ y: 5, duration: 200 }}
    >
        <Card class="shadow-lg border-primary/20">
            <CardHeader class="pb-2">
                <CardTitle class="text-base line-clamp-2">{novel.title}</CardTitle>
                <CardDescription class="text-xs">{novel.label}</CardDescription>
            </CardHeader>
            <CardContent class="pb-3 pt-0">
                <div class="text-xs text-muted-foreground mb-2 flex gap-2 flex-wrap">
                    {#if novel.tags && novel.tags.length > 0}
                        {#each novel.tags.slice(0, 3) as tag}
                            <span class="bg-primary/10 px-2 py-0.5 rounded-full">{tag}</span>
                        {/each}
                        {#if novel.tags.length > 3}
                            <span class="text-xs opacity-80">+{novel.tags.length - 3}</span>
                        {/if}
                    {/if}
                </div>
                <p class="text-xs line-clamp-3">
                    {novel.description || "No description available"}
                </p>
            </CardContent>
        </Card>
    </div>
{/if}
