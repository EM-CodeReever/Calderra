<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { enhance } from '$app/forms';
    import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_MIN, ATTRIBUTE_MAX, PERSONALITIES, POSITIONS, type AttributeKey, type Position } from '$lib/football/types';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let name = $state('');
    let position = $state<Position>('FWD');
    let personality = $state<(typeof PERSONALITIES)[number]>('FOCUSED');
    let price = $state(300);
    let attrValues = $state<Record<AttributeKey, number>>({
        finishing: 10, trickery: 10, timing: 10,
        control: 10, passing: 10, vision: 10,
        tackling: 10, disruption: 10, positioning: 10,
        reflexes: 10, handling: 10, distribution: 10,
    });

    let activeAttrs = $derived(ATTRIBUTES_BY_POSITION[position]);
    let submitting = $state(false);

    const attrLabels: Record<AttributeKey, string> = {
        finishing: 'Finishing', trickery: 'Trickery', timing: 'Timing',
        control: 'Control', passing: 'Passing', vision: 'Vision',
        tackling: 'Tackling', disruption: 'Disruption', positioning: 'Positioning',
        reflexes: 'Reflexes', handling: 'Handling', distribution: 'Distribution',
    };
</script>

<svelte:head>
    <title>Admin: Create Player - Calderra</title>
</svelte:head>

<section class="w-full max-w-2xl mx-auto flex flex-col space-y-6">
    <div>
        <h1 class="text-3xl font-bold">Football Admin</h1>
        <p class="text-base-content/70">Create fictional free-agent players for the transfer market.</p>
    </div>

    {#if form?.error}
    <div class="alert alert-error text-sm">{form.error}</div>
    {/if}
    {#if form?.success}
    <div class="alert alert-success text-sm">Player added to the transfer market.</div>
    {/if}

    <form
        method="POST"
        action="?/createPlayer"
        class="card bg-base-200 p-5 space-y-4"
        use:enhance={() => {
            submitting = true;
            return async ({ update }) => { await update(); submitting = false; };
        }}
    >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="flex flex-col gap-1">
                <span class="text-xs text-base-content/60">Player name</span>
                <input class="input" name="name" bind:value={name} maxlength="30" required />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-xs text-base-content/60">Price (credits)</span>
                <input class="input" type="number" name="price" bind:value={price} min="0" step="10" required />
            </label>
        </div>

        <div>
            <span class="text-xs text-base-content/60">Position</span>
            <div class="flex flex-wrap gap-2 mt-1">
                {#each POSITIONS as p}
                <button type="button" class="btn btn-sm {position === p ? 'btn-primary' : 'btn-outline'}" onclick={() => position = p}>{p}</button>
                {/each}
            </div>
            <input type="hidden" name="position" value={position} />
        </div>

        <div>
            <span class="text-xs text-base-content/60">Personality</span>
            <div class="flex flex-wrap gap-2 mt-1">
                {#each PERSONALITIES as p}
                <button type="button" class="btn btn-sm {personality === p ? 'btn-primary' : 'btn-outline'}" onclick={() => personality = p}>{p}</button>
                {/each}
            </div>
            <input type="hidden" name="personality" value={personality} />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {#each activeAttrs as attr}
            <label class="flex flex-col gap-1">
                <span class="text-xs text-base-content/60">{attrLabels[attr]} ({ATTRIBUTE_MIN}-{ATTRIBUTE_MAX})</span>
                <input class="input" type="number" name="attr_{attr}" bind:value={attrValues[attr]} min={ATTRIBUTE_MIN} max={ATTRIBUTE_MAX} required />
            </label>
            {/each}
        </div>

        <button type="submit" class="btn btn-primary w-full" disabled={submitting}>
            {#if submitting}<span class="loading loading-spinner loading-sm"></span>{/if}
            Add to Transfer Market
        </button>
    </form>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Unsigned Free Agents ({data.freeAgents.length})</h2>
        {#if data.freeAgents.length === 0}
        <p class="text-sm text-base-content/60">No free agents on the market yet.</p>
        {:else}
        <div class="flex flex-col space-y-2">
            {#each data.freeAgents as p}
            <div class="flex justify-between items-center p-3 rounded-lg border border-base-300">
                <div>
                    <p class="font-semibold">{p.name} <span class="text-xs text-base-content/60">{p.position} · {p.personality}</span></p>
                    <p class="text-xs text-base-content/50">
                        {#each ATTRIBUTES_BY_POSITION[p.position as Position] as attr}
                        {attrLabels[attr]}: {(p as any)[attr]}&nbsp;&nbsp;
                        {/each}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="badge badge-primary">{p.price ?? 0} cr</span>
                    <form method="POST" action="?/deletePlayer" use:enhance>
                        <input type="hidden" name="playerId" value={p.id} />
                        <button type="submit" class="btn btn-xs btn-ghost text-error">Remove</button>
                    </form>
                </div>
            </div>
            {/each}
        </div>
        {/if}
    </div>
</section>
