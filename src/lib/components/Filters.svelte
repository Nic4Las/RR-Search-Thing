<script lang="ts">
    import { ChevronDown, ChevronUp, Filter, SortAsc, SortDesc, X, Plus, Minus } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { RadioGroup, RadioGroupItem } from "$lib/components/ui/radio-group";
    import { Label } from "$lib/components/ui/label";
    import { Slider } from "$lib/components/ui/slider";
    import { Input } from "$lib/components/ui/input";
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "$lib/components/ui/accordion";
    import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
    import { Badge } from "$lib/components/ui/badge";
    import { cn } from "$lib/utils";
    import RangeSlider from "$lib/components/RangeSlider.svelte";
    import { Tags } from "../../db/novels";
    import { on } from "svelte/events";
    import { onMount } from "svelte";

    export type TagStatus = "included" | "excluded" | "neutral";

    // Changed null to undefined for better TypeScript compatibility
    export type LastUpdatedOption = "1day" | "3days" | "7days" | "1month" | "1year" | undefined;
    
    const stringToLastUpdatedOption = (str: string): LastUpdatedOption => {
        switch (str) {
            case "1day":
            case "3days":
            case "7days":
            case "1month":
            case "1year":
                return str as LastUpdatedOption;
            default:
                return undefined;
        }
    };
    // Remove LabelOption type as we're now using an array of strings
    type LabelType = "Original" | "Fan Fiction";
    const labelOptions: LabelType[] = ["Original", "Fan Fiction"];

    export interface FilterState {
        tags: Record<string, TagStatus>;
        labels: LabelType[]; // Changed to array of strings
        rating: [number, number];
        pages: [number, number];
        views: [number, number];
        chapters: [number, number];
        lastUpdated: LastUpdatedOption;
        orderBy: string;
        orderDirection: "asc" | "desc";
    }

    const defaultFilters: FilterState = {
        tags: Object.fromEntries(Tags.map((tag) => [tag, "neutral"])),
        labels: ["Original", "Fan Fiction"],
        rating: [0, 5],
        pages: [300, 20_000],
        views: [0, 75_000_000],
        chapters: [0, 2_000],
        lastUpdated: undefined,
        orderBy: "views",
        orderDirection: "desc",
    };

    const allTags = Tags;

    let { onApplyFilters }: { onApplyFilters: (filters: FilterState) => void } = $props();

    // Reactive state using Svelte 5 runes
    let isExpanded = $state(false);

    let filters = $state<FilterState>(defaultFilters);

    // Derived state for active filters count
    const activeFiltersCount = $derived(
        Object.values(filters.tags).filter((status, index) => status !== Object.values(defaultFilters.tags)[index]).length +
            // Count labels as active if they differ from default selection
            (!arraysEqual(filters.labels, defaultFilters.labels) ? 1 : 0) +
            (filters.rating[0] !== defaultFilters.rating[0] || filters.rating[1] !== defaultFilters.rating[1] ? 1 : 0) +
            (filters.pages[0] !== defaultFilters.pages[0] || filters.pages[1] !== defaultFilters.pages[1] ? 1 : 0) +
            (filters.views[0] !== defaultFilters.views[0] || filters.views[1] !== defaultFilters.views[1] ? 1 : 0) +
            (filters.chapters[0] !== defaultFilters.chapters[0] || filters.chapters[1] !== defaultFilters.chapters[1] ? 1 : 0) +
            (filters.lastUpdated !== defaultFilters.lastUpdated ? 1 : 0)
    );

    // Helper function to compare arrays
    function arraysEqual(a: any[], b: any[]): boolean {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, idx) => val === sortedB[idx]);
    }
    
    function handleTagChange(tag: string, status: TagStatus) {
        filters.tags[tag] = status;
        filters.tags = { ...filters.tags };
    }

    function toggleLabel(label: LabelType) {
        if (filters.labels.includes(label)) {
            filters.labels = filters.labels.filter((l) => l !== label);
        } else {
            filters.labels = [...filters.labels, label];
        }
    }

    function resetFilters() {
        filters = defaultFilters;
        applyFilters();
    }

    function applyFilters() {
        onApplyFilters(filters);
    }

    function updateOrderBy(orderBy: string): void {
        filters.orderBy = orderBy;
        applyFilters();
    }

    function updateOrderDirection(direction: "asc" | "desc"): void {
        filters.orderDirection = direction;
        applyFilters();
    }

    onMount(() => {
        applyFilters();
    });
</script>

<div class="w-full border rounded-lg shadow-sm bg-background">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
        <div class="flex items-center gap-2">
            <Filter class="h-5 w-5" />
            <h2 class="text-lg font-medium">Filters & Sorting</h2>
            {#if activeFiltersCount > 0}
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
            {/if}
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onclick={resetFilters}>Reset</Button>
            <Button variant="ghost" size="icon" onclick={() => (isExpanded = !isExpanded)}>
                {#if isExpanded}
                    <ChevronUp class="h-4 w-4" />
                {:else}
                    <ChevronDown class="h-4 w-4" />
                {/if}
            </Button>
        </div>
    </div>

    <!-- Content -->
    {#if isExpanded}
        <div class="p-4 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            <!-- Tags Accordion -->
            <div class="md:col-span-2 lg:col-span-2">
                <Accordion type="single" class="w-full">
                    <AccordionItem value="tags">
                        <AccordionTrigger>Tags</AccordionTrigger>
                        <AccordionContent>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
                                {#each allTags as tag}
                                    <div class="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            class={cn("h-6 w-6 p-0", filters.tags[tag] === "included" && "bg-green-500 text-white border-green-500")}
                                            onclick={() => handleTagChange(tag, "included")}
                                        >
                                            <Plus class="h-3 w-3" />
                                            <span class="sr-only">Include {tag}</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            class={cn(
                                                "h-6 w-6 p-0",
                                                filters.tags[tag] === "excluded" && "bg-destructive text-destructive-foreground"
                                            )}
                                            onclick={() => handleTagChange(tag, "excluded")}
                                        >
                                            <Minus class="h-3 w-3" />
                                            <span class="sr-only">Exclude {tag}</span>
                                        </Button>
                                        <span
                                            class={cn(
                                                "text-sm",
                                                filters.tags[tag] === "included" && "font-medium text-green-600",
                                                filters.tags[tag] === "excluded" && "font-medium text-destructive line-through"
                                            )}
                                        >
                                            {tag}
                                        </span>
                                        {#if filters.tags[tag] !== "neutral"}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-5 w-5 p-0 ml-auto"
                                                onclick={() => handleTagChange(tag, "neutral")}
                                            >
                                                <X class="h-3 w-3" />
                                                <span class="sr-only">Reset {tag}</span>
                                            </Button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <!-- Label Filter -->
            <div>
                <h3 class="text-sm font-medium mb-2">Labels</h3>
                <div class="space-y-2">
                    {#each labelOptions as label}
                        <div class="flex items-center space-x-2">
                            <Checkbox id={`label-${label}`} checked={filters.labels.includes(label)} onCheckedChange={() => toggleLabel(label)} />
                            <Label for={`label-${label}`}>{label}</Label>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Last Updated -->
            <div>
                <h3 class="text-sm font-medium mb-2">Last Updated</h3>
                <Select
                    type="single"
                    value={filters.lastUpdated != undefined ? String(filters.lastUpdated) : ""}
                    onValueChange={(value: string) => (filters.lastUpdated = stringToLastUpdatedOption(value))}
                >
                    <SelectTrigger>
                        {filters.lastUpdated ? filters.lastUpdated : "Any time"}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={"undefined"}>Any time</SelectItem>
                        <SelectItem value="1day">Last 24 hours</SelectItem>
                        <SelectItem value="3days">Last 3 days</SelectItem>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="1month">Last month</SelectItem>
                        <SelectItem value="1year">Last year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <!-- Rating Slider -->
            <RangeSlider label="Rating" bind:values={filters.rating} min={0} max={5} step={0.5} />

            <!-- Views Slider -->
            <RangeSlider label="Views" bind:values={filters.views} min={0} max={75_000_000} step={1000} formatValue={(val) => val.toLocaleString()} />

            <!-- Chapters Range -->
            <RangeSlider label="Chapters" bind:values={filters.chapters} min={0} max={2_000} step={1} />

            <!-- Pages Range -->
            <RangeSlider label="Pages" bind:values={filters.pages} min={0} max={20_000} step={10} />

            <!-- Ordering Section -->
            <div class="md:col-span-2 lg:col-span-2 border-t pt-4 mt-2">
                <h3 class="text-sm font-medium mb-2">Order By</h3>
                <div class="flex flex-wrap gap-4">
                    <Select type="single" value={filters.orderBy} onValueChange={updateOrderBy}>
                        <SelectTrigger class="w-[180px]">
                            {filters.orderBy ? filters.orderBy : "Order by"}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lastUpdated">Last Updated</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                            <SelectItem value="views">Views</SelectItem>
                            <SelectItem value="pages">Pages</SelectItem>
                            <SelectItem value="chapters">Chapters</SelectItem>
                        </SelectContent>
                    </Select>

                    <div class="flex items-center gap-2">
                        <Button
                            variant={filters.orderDirection === "asc" ? "default" : "outline"}
                            size="sm"
                            onclick={() => updateOrderDirection("asc")}
                        >
                            <SortAsc class="h-4 w-4 mr-1" />
                            Ascending
                        </Button>
                        <Button
                            variant={filters.orderDirection === "desc" ? "default" : "outline"}
                            size="sm"
                            onclick={() => updateOrderDirection("desc")}
                        >
                            <SortDesc class="h-4 w-4 mr-1" />
                            Descending
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Apply Button -->
            <div class="md:col-span-2 lg:col-span-2 flex justify-end mt-4">
                <Button onclick={applyFilters}>Apply Filters</Button>
            </div>
        </div>
    {/if}
</div>
