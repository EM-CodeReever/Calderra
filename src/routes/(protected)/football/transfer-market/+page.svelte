<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { enhance } from '$app/forms';
    import { ATTRIBUTES_BY_POSITION, POSITIONS, type AttributeKey, type Position } from '$lib/football/types';
    import { Coins } from '@lucide/svelte';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    let team = $derived(data.team);

    let filterPosition = $state<Position | 'ALL'>('ALL');
    let signingId = $state<string | null>(null);

    let visibleAgents = $derived(
        filterPosition === 'ALL' ? data.freeAgents : data.freeAgents.filter((p: any) => p.position === filterPosition)
    );

    const attrLabels: Record<AttributeKey, string> = {
        finishing: 'FIN', trickery: 'TRK', timing: 'TIM',
        control: 'CTL', passing: 'PAS', vision: 'VIS',
        tackling: 'TCK', disruption: 'DIS', positioning: 'POS',
        reflexes: 'REF', handling: 'HAN', distribution: 'DST',
    };
</script>

<svelte:head>
    <title>Transfer Market - Calderra</title>
</svelte:head>

{#if team}
<section class="w-full max-w-3xl mx-auto flex flex-col space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold">Transfer Market</h1>
            <p class="text-base-content/70">Sign free-agent players to bolster your squad.</p>
        </div>
        <div class="badge badge-lg badge-primary gap-1"><Coins size="16" /> {team.budget} credits</div>
    </div>

    {#if form?.error}
    <div class="alert alert-error text-sm">{form.error}</div>
    {/if}
    {#if form?.success}
    <div class="alert alert-success text-sm">Signed {form.signedName}!</div>
    {/if}

    <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm {filterPosition === 'ALL' ? 'btn-primary' : 'btn-outline'}" onclick={() => filterPosition = 'ALL'}>ALL</button>
        {#each POSITIONS as p}
        <button class="btn btn-sm {filterPosition === p ? 'btn-primary' : 'btn-outline'}" onclick={() => filterPosition = p}>{p}</button>
        {/each}
    </div>

    {#if visibleAgents.length === 0}
    <div class="card bg-base-200 p-5 text-center text-sm text-base-content/60">No free agents available right now.</div>
    {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each visibleAgents as p (p.id)}
        <div class="card bg-base-200 p-4 space-y-2">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold">{p.name}</p>
                    <p class="text-xs text-base-content/60">{p.position} · {p.personality}</p>
                </div>
                <span class="badge badge-primary gap-1"><Coins size="12" /> {p.price ?? 0}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
                {#each ATTRIBUTES_BY_POSITION[p.position as Position] as attr}
                <div class="flex flex-col items-center">
                    <span class="text-base-content/50">{attrLabels[attr]}</span>
                    <span class="font-semibold">{p[attr]}</span>
                </div>
                {/each}
            </div>
            <form
                method="POST"
                action="?/sign"
                use:enhance={() => {
                    signingId = p.id.toString();
                    return async ({ update }) => { await update(); signingId = null; };
                }}
            >
                <input type="hidden" name="playerId" value={p.id} />
                <button
                    type="submit"
                    class="btn btn-sm btn-primary w-full"
                    disabled={signingId === p.id.toString() || team.budget < (p.price ?? 0)}
                >
                    {#if signingId === p.id.toString()}<span class="loading loading-spinner loading-xs"></span>{/if}
                    {team.budget < (p.price ?? 0) ? "Can't afford" : 'Sign'}
                </button>
            </form>
        </div>
        {/each}
    </div>
    {/if}
</section>
{/if}
