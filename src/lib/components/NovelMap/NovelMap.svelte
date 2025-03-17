<script lang="ts">
    import { onMount } from "svelte";
    import { novelDB } from "src/db/novels";
    import { Button } from "$lib/components/ui/button";
    import { Settings, PercentIcon, BookOpen, Eye, FileText, Star } from "lucide-svelte";
    import * as Popover from "$lib/components/ui/popover";
    import * as Accordion from "$lib/components/ui/accordion";
    import { Label } from "../ui/label";
    import { Input } from "../ui/input";
    import { cn } from "$lib/utils";
    import RangeSlider from "../RangeSlider.svelte";
    import NovelTooltip from "./NovelTooltip.svelte";
    import type { Novel } from "../../../db/novels";
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    let filterPercent = $state(0.5);

    let filterPages = $state<[number, number]>([0, 20_000]);

    let filterViews = $state<[number, number]>([0, 75_000_000]);

    let filterChapters = $state<[number, number]>([0, 2_000]);

    let filterRating = $state<[number, number]>([0, 5]);

    let novels = $derived.by(async () => await novelDB.novels.orderBy("views").reverse().toArray());

    let data = $derived.by(async () => {
        filterPercent;
        let filterMinPages = filterPages[0];
        let filterMaxPages = filterPages[1];
        let filterMinViews = filterViews[0];
        let filterMaxViews = filterViews[1];
        let filterMinChapters = filterChapters[0];
        let filterMaxChapters = filterChapters[1];
        let filterMinRating = filterRating[0];
        let filterMaxRating = filterRating[1];

        let localNovels = await novels;

        return localNovels
            .slice(0, Math.floor(localNovels.length * filterPercent))
            .filter((novel) => {
                return (
                    novel.pages >= filterMinPages &&
                    novel.pages <= filterMaxPages &&
                    novel.views >= filterMinViews &&
                    novel.views <= filterMaxViews &&
                    novel.rating >= filterMinRating &&
                    novel.rating <= filterMaxRating &&
                    novel.chapters >= filterMinChapters &&
                    novel.chapters <= filterMaxChapters
                );
            });
    });

    type ViewPos = { x: number; y: number };
    let viewportPos: ViewPos = $state({ x: 845, y: 425 });
    let viewportZoom = $state(0.4);

    // Add new state for debounced zooming
    let tempZoom = $state(1);
    let lastZoom = $state(0.4);
    let isActivelyZooming = $state(false);
    let zoomDebounceTimer: NodeJS.Timeout | null = null;
    const ZOOM_DEBOUNCE_DELAY = 300; // ms

    // Pan state tracking
    let isPanning = $state(false);
    let startPanPos = $state({ x: 0, y: 0 });

    // Track touch positions for pinch-to-zoom
    let previousTouchDistance = $state(0);
    let touchZooming = $state(false);

    // timeout for auto-hiding tooltip on touch devices
    let tooltipTimeout: NodeJS.Timeout | null = null;

    // Handle mouse down to start panning
    function handleMouseDown(e: { clientX: number; clientY: number }) {
        isPanning = true;
        startPanPos = { x: e.clientX - viewportPos.x, y: e.clientY - viewportPos.y };
    }

    // Handle mouse move for panning
    function handleMouseMove(e: { clientX: number; clientY: number }) {
        if (!isPanning) return;
        viewportPos = {
            x: e.clientX - startPanPos.x,
            y: e.clientY - startPanPos.y,
        };
    }

    // Handle mouse up to end panning
    function handleMouseUp() {
        isPanning = false;
    }

    // Handle wheel for zooming with debounce
    function handleWheel(e: WheelEvent) {
        e.preventDefault();

        // Get mouse position relative to SVG

        if (!e.currentTarget) return;

        let targetElement = e.currentTarget as HTMLElement;
        const rect = targetElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom factor (smaller value for smoother zoom)
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

        // Set active zooming state
        isActivelyZooming = true;

        // Start with current temp zoom or view zoom
        const currentZoom = tempZoom;

        // Calculate new zoom level
        const newZoom = currentZoom * zoomFactor;

        // Adjust position to zoom toward mouse position
        viewportPos = {
            x: mouseX - (mouseX - viewportPos.x) * zoomFactor,
            y: mouseY - (mouseY - viewportPos.y) * zoomFactor,
        };

        // Update temporary zoom immediately for smooth visual feedback
        tempZoom = newZoom;

        // Clear any existing timer
        if (zoomDebounceTimer) {
            clearTimeout(zoomDebounceTimer);
        }

        // Set timer for actual zoom update after debounce period
        zoomDebounceTimer = setTimeout(() => {
            // Apply the final zoom value when zooming stops
            viewportZoom = tempZoom;
            lastZoom = tempZoom;
            isActivelyZooming = false;
            zoomDebounceTimer = null;
        }, ZOOM_DEBOUNCE_DELAY);
    }

    // Handle touch start for panning and pinch zoom
    function handleTouchStart(e: TouchEvent) {
        if (e.touches.length === 1) {
            // Single touch - start panning
            isPanning = true;
            startPanPos = {
                x: e.touches[0].clientX - viewportPos.x,
                y: e.touches[0].clientY - viewportPos.y,
            };
        } else if (e.touches.length === 2) {
            // Two touches - start pinch zooming
            touchZooming = true;
            isActivelyZooming = true;
            isPanning = false;
            // Calculate initial distance between touch points
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            previousTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }

    // Handle touch move for panning and pinch zoom
    function handleTouchMove(e: TouchEvent) {
        e.preventDefault(); // Prevent scrolling while interacting with the map

        if (isPanning && e.touches.length === 1) {
            // Handle panning with one finger
            viewportPos = {
                x: e.touches[0].clientX - startPanPos.x,
                y: e.touches[0].clientY - startPanPos.y,
            };
        } else if (touchZooming && e.touches.length === 2) {
            // Handle pinch zooming with two fingers

            // Calculate current distance between touch points
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);

            // Calculate zoom factor based on the change in distance
            const zoomFactor = currentDistance / previousTouchDistance;

            if (zoomFactor !== 1 && zoomFactor > 0.1 && zoomFactor < 10) {
                // Calculate center point between the two touches
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                // Update temporary zoom immediately for smooth visual feedback
                tempZoom = tempZoom * zoomFactor;

                // Adjust position to zoom toward center of pinch
                viewportPos = {
                    x: centerX - (centerX - viewportPos.x) * zoomFactor,
                    y: centerY - (centerY - viewportPos.y) * zoomFactor,
                };

                previousTouchDistance = currentDistance;

                // Clear any existing timer
                if (zoomDebounceTimer) {
                    clearTimeout(zoomDebounceTimer);
                }

                // Set timer for actual zoom update after debounce period
                zoomDebounceTimer = setTimeout(() => {
                    // Apply the final zoom value when zooming stops
                    viewportZoom = tempZoom;
                    lastZoom = tempZoom;
                    isActivelyZooming = false;
                    zoomDebounceTimer = null;
                }, ZOOM_DEBOUNCE_DELAY);
            }
        }
    }

    // Handle touch end
    function handleTouchEnd(e: TouchEvent) {
        isPanning = false;
        touchZooming = false;
        
        // Check if the tap ended on a circle element or its descendants
        const target = e.target as Element;
        const wasNovelTap = target.tagName === 'circle' || 
                           target.closest('circle') !== null;
        
        // Close tooltip when tapping on background (not on a novel point)
        if (!wasNovelTap) {
            tooltipVisible = false;
            hoveredNovel = null;
            hoveredPointRadius.set(1);
            
            // Clear any existing tooltip timeout
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
        }
    }

    // Predefined filter percentage options
    const percentOptions = [0.2, 0.4, 0.6, 0.8, 1.0];
    
    // Function to get human-readable percentage
    function formatPercent(value: number): string {
        return `${Math.round(value * 100)}%`;
    }

    // On component initialization, set tempZoom to match viewportZoom
    onMount(() => {
        tempZoom = viewportZoom;
    });

    // Add state variables for tooltip
    let hoveredNovel = $state<Novel | null>(null);
    let tooltipVisible = $state(false);
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    
    // Detect if device is touch-based
    let isTouchDevice = $state(false);
    
    $effect(() => {
        isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
    });

    // Function to calculate classes based on hover state
    const calcRadius = (novel: Novel) => {
        // calculate radius based on views (sqrt for better scaling) between 5 and 15
        let radius = 5 + (10 * Math.sqrt(novel.views / 25_000_000));
        
        // Get current zoom factor to use
        const currentZoom = isActivelyZooming ? lastZoom : viewportZoom;
        
        if (hoveredNovel?.fictionId === novel.fictionId) {
            // Apply a percentage boost (30%) instead of fixed +3 value
            const hoverBoost = radius * 0.3;
            return (radius + hoverBoost) / Math.sqrt(currentZoom);
        } else {
            return radius / Math.sqrt(currentZoom);
        }
    }
    
    // Handle point hover/tap
    let hoveredPointRadius = tweened(1, {
        duration: 150,
        easing: cubicOut
    });
    
    function handlePointInteraction(event: MouseEvent | TouchEvent, novel: Novel) {
        event.stopPropagation(); // Prevent the background click from triggering
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        
        hoveredNovel = novel;
        hoveredPointRadius.set(1.5); // Will animate to 1.5x size
        tooltipX = clientX + 10; // Offset slightly
        tooltipY = clientY + 10;
        tooltipVisible = true;
        
        // Auto-hide after some time on touch devices
        if (isTouchDevice) {
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
            }
            tooltipTimeout = setTimeout(() => {
                tooltipVisible = false;
                hoveredNovel = null;
                hoveredPointRadius.set(1);
            }, 10000);
        }
    }
    
    function handlePointLeave() {
        if (!isTouchDevice) {
            tooltipVisible = false;
            hoveredNovel = null;
            hoveredPointRadius.set(1);
        }
    }
    
    // Modify the background click handler to only close when it's not a direct point click
    function handleBackgroundClick(event: MouseEvent) {
        // Only close if it's a direct click on the background
        if (event.target === event.currentTarget) {
            tooltipVisible = false;
            hoveredNovel = null;
            hoveredPointRadius.set(1);
        }
    }
</script>

<section class="fixed inset-0 overflow-hidden">
    <h1 class="text-3xl md:text-4xl font-bold text-center absolute top-4 left-0 right-0 z-10">Novels:</h1>
    
    <Popover.Root>
        <Popover.Trigger class="absolute bottom-4 left-4 z-20">
            <Button size="icon" variant="outline">
                <Settings class="h-[1.2rem] w-[1.2rem]" />
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-96 p-5" aria-label="Settings" side="bottom" align="start">
            <div class="space-y-5">
                <div>
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium text-base">Display Settings</h4>
                        <span class="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                            <PercentIcon class="h-3 w-3" />
                            <span>Showing {formatPercent(filterPercent)}</span>
                        </span>
                    </div>
                    <p class="text-muted-foreground text-sm mt-1.5">
                        Configure which novels appear on the map.
                    </p>
                </div>
                
                <div class="space-y-3">
                    <Label class="text-sm">Filter Percentage</Label>
                    <div class="flex gap-1.5 mt-1.5">
                        {#each percentOptions as percent}
                            <Button 
                                variant={filterPercent === percent ? "default" : "outline"}
                                size="sm"
                                class={cn(
                                    "flex-1 transition-all",
                                    filterPercent === percent && "shadow-md"
                                )}
                                onclick={() => filterPercent = percent}
                            >
                                {formatPercent(percent)}
                            </Button>
                        {/each}
                    </div>
                </div>

                <Accordion.Root class="w-full" type="single">
                    <Accordion.Item value="filters">
                        <Accordion.Trigger class="py-2">
                            <span class="text-sm font-medium">Advanced Filters</span>
                        </Accordion.Trigger>
                        <Accordion.Content class="pt-2 pb-4 space-y-4">
                            <div class="space-y-3">
                                <div class="flex items-center gap-4">
                                    <BookOpen class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div class="w-full mx-4">
                                        <RangeSlider label="Pages" bind:values={filterPages} min={0} max={20000} step={100} />
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-4">
                                    <Eye class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div class="w-full mx-4">
                                        <RangeSlider label="Views" bind:values={filterViews} min={0} max={75000000} step={1000000} />
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-4">
                                    <FileText class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div class="w-full mx-4">
                                        <RangeSlider label="Chapters" bind:values={filterChapters} min={0} max={2000} step={10} />
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-4">
                                    <Star class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div class="w-full mx-4">
                                        <RangeSlider label="Rating" bind:values={filterRating} min={0} max={5} step={0.5} />
                                    </div>
                                </div>
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            </div>
        </Popover.Content>
    </Popover.Root>

    {#await data}
        <div class="absolute inset-0 flex items-center justify-center">Loading...</div>
    {:then novels}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="absolute inset-0 cursor-grab touch-none"
            onmousedown={handleMouseDown}
            onmousemove={handleMouseMove}
            onmouseup={handleMouseUp}
            onmouseleave={handleMouseUp}
            onwheel={handleWheel}
            ontouchstart={handleTouchStart}
            ontouchmove={handleTouchMove}
            ontouchend={handleTouchEnd}
            ontouchcancel={handleTouchEnd}
            onclick={handleBackgroundClick}
        >
            <svg class="w-full h-full" role="img">
                <g transform={`translate(${viewportPos.x},${viewportPos.y}) scale(${isActivelyZooming ? tempZoom : viewportZoom})`}>
                    {#each novels.reverse() as novel}
                        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                        <circle
                            cx={novel.x * 100}
                            cy={novel.y * 100}
                            r={calcRadius(novel)}
                            fill={`hsl(${(novel.cluster / 25) * 360}, 100%, 50%)`}
                            class="stroke-primary cursor-pointer transition-all hover:shadow-sm hover:z-10"
                            style="transform-box: fill-box; transform-origin: center; vector-effect: non-scaling-stroke; stroke-width: 1px; "
                            onmouseover={(e) => handlePointInteraction(e, novel)}
                            onmouseleave={handlePointLeave}
                            onclick={(e) => handlePointInteraction(e, novel)}
                        />
                        <!-- fill={`oklch(0.25 ${ 0.5 } ${(novel.cluster / 25) * 360}deg)`} -->
                    {/each}
                </g>
            </svg>
        </div>
    {/await}
    <NovelTooltip 
        novel={hoveredNovel} 
        x={tooltipX} 
        y={tooltipY} 
        visible={tooltipVisible} 
    />
</section>