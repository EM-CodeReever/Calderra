<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { enhance } from '$app/forms';
    import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_MAX, FORMATIONS, type AttributeKey, type Position } from '$lib/football/types';
    import { formationCounts } from '$lib/football/lineup';
    import { xpToReachLevel, MAX_LEVEL } from '$lib/football/xp';
    import { estimateMarketValue, quickSellValue } from '$lib/football/market';
    import FormationBuilder from '$components/football/FormationBuilder.svelte';
    import BackToFootballHome from '$components/football/BackToFootballHome.svelte';
    import { Tag, Banknote, Trash2, Coins } from '@lucide/svelte';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    let team = $derived(data.team);

    const currentLineup = data.team?.default_lineup as any;

    let formation = $state<string>(currentLineup?.formation ?? team?.default_formation ?? '2-2-2');
    let selectedGk = $state<string>(currentLineup?.GK ? String(currentLineup.GK) : (team?.players.find((p: any) => p.position === 'GK')?.id?.toString() ?? ''));
    let selectedDef = $state<string[]>(currentLineup?.DEF?.map(String) ?? []);
    let selectedMid = $state<string[]>(currentLineup?.MID?.map(String) ?? []);
    let selectedFwd = $state<string[]>(currentLineup?.FWD?.map(String) ?? []);
    let lineupSaving = $state(false);

    let counts = $derived(formationCounts(formation as any));

    function cycleFormation(direction: 1 | -1) {
        const idx = FORMATIONS.indexOf(formation as any);
        const next = FORMATIONS[(idx + direction + FORMATIONS.length) % FORMATIONS.length];
        formation = next;
        const nextCounts = formationCounts(next);
        selectedDef = selectedDef.slice(0, nextCounts.DEF);
        selectedMid = selectedMid.slice(0, nextCounts.MID);
        selectedFwd = selectedFwd.slice(0, nextCounts.FWD);
    }

    let rosterForBuilder = $derived((team?.players ?? []).map((p: any) => ({ id: p.id.toString(), name: p.name, position: p.position as Position })));

    const attrLabels: Record<AttributeKey, string> = {
        finishing: 'FIN', trickery: 'TRK', timing: 'TIM',
        control: 'CTL', passing: 'PAS', vision: 'VIS',
        tackling: 'TCK', disruption: 'DIS', positioning: 'POS',
        reflexes: 'REF', handling: 'HAN', distribution: 'DST',
    };

    type ActionMode = 'sell' | 'quicksell' | 'release' | null;
    let openAction = $state<Record<string, ActionMode>>({});
    let listPrices = $state<Record<string, number>>({});
    let submittingId = $state<string | null>(null);
</script>

<svelte:head>
    <title>Squad - Calderra</title>
</svelte:head>

{#if team}
<section class="w-full flex flex-col space-y-6">
    <BackToFootballHome />

    <div class="flex items-center justify-between flex-wrap gap-3">
        <h1 class="text-3xl font-bold">Squad & Formation</h1>
        <div class="badge badge-lg badge-primary gap-1"><Coins size="16" /> {team.budget} credits</div>
    </div>

    {#if form?.error}
    <div class="alert alert-error text-sm">{form.error}</div>
    {/if}
    {#if form?.success && typeof form?.payout === 'number'}
    <div class="alert alert-success text-sm">Sold for {form.payout} credits.</div>
    {/if}

    <div class="card bg-base-200 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Formation</h2>

        <form method="POST" action="?/saveLineup" use:enhance={() => {
            lineupSaving = true;
            return async ({ update }) => { await update(); lineupSaving = false; };
        }}>
            <input type="hidden" name="formation" value={formation} />
            <input type="hidden" name="gk" value={selectedGk} />
            {#each selectedDef as id}<input type="hidden" name="def" value={id} />{/each}
            {#each selectedMid as id}<input type="hidden" name="mid" value={id} />{/each}
            {#each selectedFwd as id}<input type="hidden" name="fwd" value={id} />{/each}

            <FormationBuilder
                {formation}
                roster={rosterForBuilder}
                bind:selectedGk
                bind:selectedDef
                bind:selectedMid
                bind:selectedFwd
                onCyclePrev={() => cycleFormation(-1)}
                onCycleNext={() => cycleFormation(1)}
            />
            <div class="flex justify-center">
                <button type="submit" class="btn btn-primary mt-4 max-w-md" disabled={lineupSaving || !selectedGk || selectedDef.length !== counts.DEF || selectedMid.length !== counts.MID || selectedFwd.length !== counts.FWD}>
                    {#if lineupSaving}<span class="loading loading-spinner loading-sm"></span>{/if}
                    Save Lineup
                </button>
            </div>
            
        </form>
    </div>

    <div class="card bg-base-200 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Roster ({team.players.length})</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each team.players as p (p.id)}
            {@const xpNeeded = p.level < MAX_LEVEL ? xpToReachLevel(p.level) : 0}
            {@const pid = p.id.toString()}
            {@const suggested = estimateMarketValue(p as any)}
            {@const quickValue = quickSellValue(p as any)}
            <div class="card bg-base-100 p-4 space-y-2">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold">{p.name}</p>
                        <p class="text-xs text-base-content/60">{p.position} · {p.personality} · Lv.{p.level}</p>
                    </div>
                    {#if p.unspent_points > 0}
                    <span class="badge badge-primary">{p.unspent_points} pts</span>
                    {/if}
                </div>
                {#if p.level < MAX_LEVEL}
                <progress class="progress progress-primary w-full" value={p.xp} max={xpNeeded}></progress>
                {/if}
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    {#each ATTRIBUTES_BY_POSITION[p.position as Position] as attr}
                    <div class="flex flex-col items-center">
                        <span class="text-base-content/50">{attrLabels[attr]}</span>
                        <span class="font-semibold">{(p as any)[attr]}</span>
                        {#if p.unspent_points > 0 && (p as any)[attr] < ATTRIBUTE_MAX}
                        <form method="POST" action="?/allocatePoints" use:enhance>
                            <input type="hidden" name="playerId" value={p.id} />
                            <input type="hidden" name="attribute" value={attr} />
                            <button type="submit" class="btn btn-xs btn-circle mt-1">+</button>
                        </form>
                        {/if}
                    </div>
                    {/each}
                </div>

                <div class="flex gap-1 pt-1 border-t border-base-300">
                    <button type="button" class="btn btn-xs btn-ghost flex-1" onclick={() => openAction[pid] = openAction[pid] === 'sell' ? null : 'sell'}>
                        <Tag size="12" /> List
                    </button>
                    <button type="button" class="btn btn-xs btn-ghost flex-1" onclick={() => openAction[pid] = openAction[pid] === 'quicksell' ? null : 'quicksell'}>
                        <Banknote size="12" /> Quick Sell
                    </button>
                    <button type="button" class="btn btn-xs btn-ghost flex-1 text-error" onclick={() => openAction[pid] = openAction[pid] === 'release' ? null : 'release'}>
                        <Trash2 size="12" /> Release
                    </button>
                </div>

                {#if openAction[pid] === 'sell'}
                <form
                    method="POST"
                    action="?/listForSale"
                    class="flex items-center gap-2 bg-base-200 rounded-lg p-2"
                    use:enhance={() => { submittingId = pid; return async ({ update }) => { await update(); submittingId = null; openAction[pid] = null; }; }}
                >
                    <input type="hidden" name="playerId" value={p.id} />
                    <input
                        class="input input-sm w-24"
                        type="number"
                        name="price"
                        min="0"
                        value={listPrices[pid] ?? suggested}
                        oninput={(e) => listPrices[pid] = Number((e.target as HTMLInputElement).value)}
                    />
                    <button type="submit" class="btn btn-sm btn-primary flex-1" disabled={submittingId === pid}>List for sale</button>
                </form>
                {:else if openAction[pid] === 'quicksell'}
                <div class="flex items-center justify-between gap-2 bg-base-200 rounded-lg p-2">
                    <p class="text-xs text-base-content/70">Instant payout: <b>{quickValue} credits</b></p>
                    <form method="POST" action="?/quickSell" use:enhance={() => { submittingId = pid; return async ({ update }) => { await update(); submittingId = null; openAction[pid] = null; }; }}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <button type="submit" class="btn btn-sm btn-primary" disabled={submittingId === pid}>Confirm</button>
                    </form>
                </div>
                {:else if openAction[pid] === 'release'}
                <div class="flex items-center justify-between gap-2 bg-base-200 rounded-lg p-2">
                    <p class="text-xs text-base-content/70">Release for free — no payout.</p>
                    <form method="POST" action="?/release" use:enhance={() => { submittingId = pid; return async ({ update }) => { await update(); submittingId = null; openAction[pid] = null; }; }}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <button type="submit" class="btn btn-sm btn-error" disabled={submittingId === pid}>Confirm release</button>
                    </form>
                </div>
                {/if}
            </div>
            {/each}
        </div>
    </div>
</section>
{/if}
