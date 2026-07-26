<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';
    import { ATTRIBUTES_BY_POSITION, ATTRIBUTE_MAX, FORMATIONS, type AttributeKey, type Position } from '$lib/football/types';
    import { formationCounts } from '$lib/football/lineup';
    import { xpToReachLevel, MAX_LEVEL } from '$lib/football/xp';

    let { data }: { data: PageData } = $props();
    let team = $derived(data.team);

    const currentLineup = data.team?.default_lineup as any;

    let formation = $state<string>(currentLineup?.formation ?? team?.default_formation ?? '2-2-2');
    let selectedDef = $state<string[]>(currentLineup?.DEF?.map(String) ?? []);
    let selectedMid = $state<string[]>(currentLineup?.MID?.map(String) ?? []);
    let selectedFwd = $state<string[]>(currentLineup?.FWD?.map(String) ?? []);
    let lineupSaving = $state(false);

    let counts = $derived(formationCounts(formation as any));

    const attrLabels: Record<AttributeKey, string> = {
        finishing: 'FIN', trickery: 'TRK', timing: 'TIM',
        control: 'CTL', passing: 'PAS', vision: 'VIS',
        tackling: 'TCK', disruption: 'DIS', positioning: 'POS',
        reflexes: 'REF', handling: 'HAN', distribution: 'DST',
    };

    function toggle(list: string[], id: string, max: number): string[] {
        if (list.includes(id)) return list.filter((x) => x !== id);
        if (list.length >= max) return list;
        return [...list, id];
    }

    const playersByPosition = (pos: Position) => (team?.players ?? []).filter((p: any) => p.position === pos);
</script>

<svelte:head>
    <title>Squad - Calderra</title>
</svelte:head>

{#if team}
<section class="w-full flex flex-col space-y-6">
    <h1 class="text-3xl font-bold">Squad & Formation</h1>

    <div class="card bg-base-200 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Formation</h2>
        <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {#each FORMATIONS as f}
            <button
                class="btn btn-sm {formation === f ? 'btn-primary' : 'btn-outline'}"
                onclick={() => {
                    formation = f;
                    selectedDef = selectedDef.slice(0, formationCounts(f as any).DEF);
                    selectedMid = selectedMid.slice(0, formationCounts(f as any).MID);
                    selectedFwd = selectedFwd.slice(0, formationCounts(f as any).FWD);
                }}
            >{f}</button>
            {/each}
        </div>

        <form method="POST" action="?/saveLineup" use:enhance={() => {
            lineupSaving = true;
            return async ({ update }) => { await update(); lineupSaving = false; };
        }}>
            <input type="hidden" name="formation" value={formation} />
            {#each selectedDef as id}<input type="hidden" name="def" value={id} />{/each}
            {#each selectedMid as id}<input type="hidden" name="mid" value={id} />{/each}
            {#each selectedFwd as id}<input type="hidden" name="fwd" value={id} />{/each}

            {#each [{ pos: 'DEF' as Position, label: 'Defenders', selected: selectedDef, max: counts.DEF, setter: (v: string[]) => selectedDef = v },
                    { pos: 'MID' as Position, label: 'Midfielders', selected: selectedMid, max: counts.MID, setter: (v: string[]) => selectedMid = v },
                    { pos: 'FWD' as Position, label: 'Forwards', selected: selectedFwd, max: counts.FWD, setter: (v: string[]) => selectedFwd = v }] as group}
            <div class="mt-4">
                <p class="text-sm font-medium mb-2">{group.label} (pick {group.max})</p>
                <div class="flex flex-wrap gap-2">
                    {#each playersByPosition(group.pos) as p}
                    <button
                        type="button"
                        class="btn btn-sm {group.selected.includes(p.id.toString()) ? 'btn-primary' : 'btn-outline'}"
                        onclick={() => group.setter(toggle(group.selected, p.id.toString(), group.max))}
                    >{p.name}</button>
                    {/each}
                </div>
            </div>
            {/each}

            <button type="submit" class="btn btn-primary mt-4" disabled={lineupSaving || selectedDef.length !== counts.DEF || selectedMid.length !== counts.MID || selectedFwd.length !== counts.FWD}>
                {#if lineupSaving}<span class="loading loading-spinner loading-sm"></span>{/if}
                Save Lineup
            </button>
        </form>
    </div>

    <div class="card bg-base-200 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Roster ({team.players.length})</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each team.players as p}
            {@const xpNeeded = p.level < MAX_LEVEL ? xpToReachLevel(p.level) : 0}
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
                        <span class="font-semibold">{p[attr]}</span>
                        {#if p.unspent_points > 0 && p[attr] < ATTRIBUTE_MAX}
                        <form method="POST" action="?/allocatePoints" use:enhance>
                            <input type="hidden" name="playerId" value={p.id} />
                            <input type="hidden" name="attribute" value={attr} />
                            <button type="submit" class="btn btn-xs btn-circle mt-1">+</button>
                        </form>
                        {/if}
                    </div>
                    {/each}
                </div>
            </div>
            {/each}
        </div>
    </div>
</section>
{/if}
