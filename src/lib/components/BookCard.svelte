<script lang="ts">
    import { Book, Eye, Heart, Star, ChevronDown, ChevronUp, BookOpen } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent } from "$lib/components/ui/card";
    import type { Novel } from "../../db/novels";
    
    let { book }: { book: Novel } = $props();
    let expandedDescription = $state(false);
    let expandedTags = $state(false);
    
    function toggleDescription() {
        expandedDescription = !expandedDescription;
    }
    
    function toggleTags() {
        expandedTags = !expandedTags;
    }
</script>

<Card class="overflow-hidden">
    <CardContent class="p-0">
        <div class="flex flex-col">
            <div class="flex flex-row p-6 pb-2 items-start">
                <div class="relative w-32 md:w-48 aspect-[2/3] shrink-0">
                    <img
                        src={book.cover !== "" ? book.cover : "https://www.royalroad.com/dist/img/nocover-new-min.png"}
                        alt={`Cover of ${book.title}`}
                        class="object-contain w-full h-full"
                    />
                </div>
                <div class="flex-1 pl-6">
                    <h3 class="text-xl font-bold">
                        <a href={book.url} class="hover:text-primary transition-colors">
                            {book.title}
                        </a>
                    </h3>
                    <!-- Tags section - visible in both modes -->
                    <div class="flex flex-wrap gap-2 mb-4 mt-2">
                        <Badge variant="default" class="px-3 py-1">
                            {book.label || "Unknown"}
                        </Badge>
                        {#each expandedTags ? book.tags : book.tags.slice(0, 6) as tag}
                            <Badge variant="secondary">
                                {tag}
                            </Badge>
                        {/each}
                        {#if book.tags.length > 6}
                            <Button variant="ghost" size="sm" class="h-6 px-2" onclick={toggleTags}>
                                <span class="flex items-center text-xs">
                                    {#if expandedTags}
                                        Show less <ChevronUp class="ml-1 h-3 w-3" />
                                    {:else}
                                        +{book.tags.length - 6} more <ChevronDown class="ml-1 h-3 w-3" />
                                    {/if}
                                </span>
                            </Button>
                        {/if}
                    </div>

                    <!-- Stats and description for landscape mode only -->
                    <div class="hidden landscape:block">
                        <div class="flex gap-6 mb-4">
                            <div class="flex items-center gap-1">
                                <Star class="h-4 w-4 fill-primary text-primary" />
                                <span class="text-sm font-medium">{book.rating}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <Heart class="h-4 w-4" />
                                <span class="text-sm">{book.followingUsers}</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <Eye class="h-4 w-4" />
                                <span class="text-sm">{book.views}</span>
                            </div>
                        </div>

                        <div>
                            <p class="text-sm whitespace-pre-line">
                                {expandedDescription ? book.description : book.description.slice(0, 100) + "..."}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="mt-2 h-8 px-2"
                                onclick={toggleDescription}
                            >
                                {#if expandedDescription}
                                    <span class="flex items-center">
                                        Show less <ChevronUp class="ml-1 h-4 w-4" />
                                    </span>
                                {:else}
                                    <span class="flex items-center">
                                        Read more <ChevronDown class="ml-1 h-4 w-4" />
                                    </span>
                                {/if}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats and description for portrait mode only -->
            <div class="px-6 py-2 landscape:hidden">
                <div class="flex gap-6 mb-4">
                    <div class="flex items-center gap-1">
                        <Star class="h-4 w-4 fill-primary text-primary" />
                        <span class="text-sm font-medium">{book.rating}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <Heart class="h-4 w-4" />
                        <span class="text-sm">{book.followingUsers}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <Eye class="h-4 w-4" />
                        <span class="text-sm">{book.views}</span>
                    </div>
                </div>

                <div>
                    <p class="text-sm whitespace-pre-line">
                        {expandedDescription ? book.description : book.description.slice(0, 100) + "..."}
                    </p>
                    <Button variant="ghost" size="sm" class="mt-2 h-8 px-2" onclick={toggleDescription}>
                        {#if expandedDescription}
                            <span class="flex items-center">
                                Show less <ChevronUp class="ml-1 h-4 w-4" />
                            </span>
                        {:else}
                            <span class="flex items-center">
                                Read more <ChevronDown class="ml-1 h-4 w-4" />
                            </span>
                        {/if}
                    </Button>
                </div>
            </div>

            <!-- Chapter/pages info - visible in both modes but positioned differently -->
            <div
                class="landscape:px-6 landscape:py-2 mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground"
                class:px-6={true}
                class:py-2={true}
            >
                <div class="flex items-center gap-1">
                    <Book class="h-4 w-4" />
                    <span>{book.chapters} chapters</span>
                </div>
                <div class="flex items-center gap-1">
                    <BookOpen class="h-4 w-4" />
                    <span>{book.pages} pages</span>
                </div>
            </div>
        </div>
    </CardContent>
</Card>

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
