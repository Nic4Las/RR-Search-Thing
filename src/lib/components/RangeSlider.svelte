<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Slider } from '$lib/components/ui/slider';
    import { Input } from '$lib/components/ui/input';
    
    let { 
        label,
        min, 
        max, 
        step = 1, 
        values = $bindable(), 
        formatValue = (val: number) => val ? val.toString() : '0'
    }: { 
        label: string; 
        values: [number, number]; 
        min: number; 
        max: number; 
        step?: number; 
        formatValue?: (val: number) => string;
    } = $props();
    
    let showInputs = $state(false);
</script>

<div>
    <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium">
            {label}: {formatValue(values[0])} - {formatValue(values[1])}
        </h3>
        <Button
            variant="ghost"
            size="sm"
            class="h-8 px-2"
            onclick={() => showInputs = !showInputs}
        >
            {showInputs ? 'Hide' : 'Precise Input'}
        </Button>
    </div>
    
    {#if showInputs}
        <div class="flex gap-2 mb-2">
            <Input
                type="number"
                min={min}
                max={values[1]}
                step={step}
                bind:value={values[0]}
            />
            <span class="self-center">to</span>
            <Input
                type="number"
                min={values[0]}
                max={max}
                step={step}
                bind:value={values[1]}
            />
        </div>
    {/if}
    
    <Slider
        type="multiple"
        min={min}
        max={max}
        step={step}
        bind:value={values}
    />
</div>
