<script lang="ts">
    import { enhance } from '$app/forms';
    import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_BASE, CREATION_BONUS_POOL, CREATION_MAX_PER_ATTRIBUTE, PERSONALITIES, POSITIONS, type AttributeKey, type Personality, type Position } from '$lib/football/types';

    let { form }: { form: { error?: string } | null } = $props();

    let teamName = $state('');
    let playerName = $state('');
    let position = $state<Position>('FWD');
    let personality = $state<Personality>('FOCUSED');
    let submitting = $state(false);

    let attrKeys = $derived(ATTRIBUTES_BY_POSITION[position]);
    let allocations = $state<Record<AttributeKey, number>>({
        finishing: 0, trickery: 0, timing: 0, control: 0, passing: 0, vision: 0,
        tackling: 0, disruption: 0, positioning: 0, reflexes: 0, handling: 0, distribution: 0,
    });

    let totalAllocated = $derived(attrKeys.reduce((sum, key) => sum + allocations[key], 0));
    let pointsLeft = $derived(CREATION_BONUS_POOL - totalAllocated);
    const maxExtra = CREATION_MAX_PER_ATTRIBUTE - ATTRIBUTE_BASE;

    function adjust(key: AttributeKey, delta: number) {
        const next = allocations[key] + delta;
        if (next < 0 || next > maxExtra) return;
        if (delta > 0 && pointsLeft <= 0) return;
        allocations[key] = next;
    }

    const attrLabels: Record<AttributeKey, string> = {
        finishing: 'Finishing', trickery: 'Trickery', timing: 'Timing',
        control: 'Control', passing: 'Passing', vision: 'Vision',
        tackling: 'Tackling', disruption: 'Disruption', positioning: 'Positioning',
        reflexes: 'Reflexes', handling: 'Handling', distribution: 'Distribution',
    };
</script>

<svelte:head>
    <title>Create Your Team - Calderra</title>
</svelte:head>

<section class="w-full max-w-2xl mx-auto flex flex-col space-y-6">
    <div>
        <h1 class="text-3xl font-bold">Build Your Team</h1>
        <p class="text-base-content/70">Name your club and create your first star player. We'll fill out the rest of your 15-player squad so you can kick off right away.</p>
    </div>

    <form
        method="POST"
        class="flex flex-col space-y-6"
        use:enhance={() => {
            submitting = true;
            return async ({ update }) => { submitting = false; await update(); };
        }}
    >
        <div class="card bg-base-200 p-5 space-y-4">
            <h2 class="text-lg font-semibold">Club</h2>
            <input class="input w-full" type="text" name="teamName" placeholder="Team name" maxlength="40" required bind:value={teamName} />
        </div>

        <div class="card bg-base-200 p-5 space-y-4">
            <h2 class="text-lg font-semibold">Your Star Player</h2>
            <input class="input w-full" type="text" name="playerName" placeholder="Player name" maxlength="30" required bind:value={playerName} />

            <div>
                <p class="text-sm font-medium mb-2">Position</p>
                <div class="grid grid-cols-4 gap-2">
                    {#each POSITIONS as pos}
                    <button type="button" class="btn btn-sm {position === pos ? 'btn-primary' : 'btn-outline'}" onclick={() => { position = pos; }}>
                        {pos}
                    </button>
                    {/each}
                </div>
                <input type="hidden" name="position" value={position} />
            </div>

            <div>
                <p class="text-sm font-medium mb-2">Personality</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {#each PERSONALITIES as p}
                    <button type="button" class="btn btn-sm {personality === p ? 'btn-primary' : 'btn-outline'}" onclick={() => { personality = p; }}>
                        {p}
                    </button>
                    {/each}
                </div>
                <input type="hidden" name="personality" value={personality} />
            </div>

            <div>
                <div class="flex justify-between items-center mb-2">
                    <p class="text-sm font-medium">Attributes</p>
                    <p class="text-sm {pointsLeft === 0 ? 'text-success' : 'text-base-content/60'}">{pointsLeft} points left</p>
                </div>
                <div class="space-y-2">
                    {#each attrKeys as key}
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-sm w-28">{attrLabels[key]}</span>
                        <div class="flex items-center gap-2">
                            <button type="button" class="btn btn-xs btn-circle" onclick={() => adjust(key, -1)}>-</button>
                            <span class="w-8 text-center font-semibold">{ATTRIBUTE_BASE + allocations[key]}</span>
                            <button type="button" class="btn btn-xs btn-circle" onclick={() => adjust(key, 1)}>+</button>
                        </div>
                    </div>
                    <input type="hidden" name={`alloc_${key}`} value={allocations[key]} />
                    {/each}
                </div>
            </div>
        </div>

        {#if form?.error}
        <p class="text-error text-sm">{form.error}</p>
        {/if}

        <button type="submit" class="btn btn-primary w-full" disabled={submitting}>
            {#if submitting}<span class="loading loading-spinner loading-sm"></span>{/if}
            Create Team
        </button>
    </form>
</section>
