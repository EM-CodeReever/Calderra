<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';
    import { onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { scale } from 'svelte/transition';
    import PitchVisualizer from '$components/football/PitchVisualizer.svelte';
    import { computeSlots, toLite } from '$lib/football/lineup';
    import type { Lineup } from '$lib/football/types';

    let { data }: { data: PageData } = $props();
    let match = $derived(data.match);

    let homeLineup = $derived(match.homeLineup as unknown as Lineup);
    let awayLineup = $derived(match.awayLineup as unknown as Lineup);
    let homeRoster = $derived(match.homePlayers.map(toLite));
    let awayRoster = $derived(match.awayPlayers.map(toLite));
    let homeSlots = $derived(computeSlots(homeLineup, homeRoster, 'HOME'));
    let awaySlots = $derived(computeSlots(awayLineup, awayRoster, 'AWAY'));

    let half1Events = $derived(match.events.filter((e) => e.half === 1));

    let visibleCount = $state(0);
    let playing = $state(true);
    let showHalftimePanel = $state(false);
    let timer: ReturnType<typeof setInterval> | undefined;

    let totalToShowNow = $derived(match.status === 'AWAITING_HALFTIME' ? half1Events.length : match.events.length);

    function tick() {
        if (visibleCount >= totalToShowNow) {
            playing = false;
            if (match.status === 'AWAITING_HALFTIME') showHalftimePanel = true;
            clearInterval(timer);
            return;
        }
        visibleCount++;
    }

    function startTimer() {
        clearInterval(timer);
        playing = true;
        timer = setInterval(tick, 2200);
    }

    $effect(() => {
        match.status;
        showHalftimePanel = false;
        startTimer();
    });

    onDestroy(() => clearInterval(timer));

    function skipToEnd() {
        clearInterval(timer);
        visibleCount = totalToShowNow;
        playing = false;
        if (match.status === 'AWAITING_HALFTIME') showHalftimePanel = true;
    }

    let visibleEvents = $derived(match.events.slice(0, visibleCount));
    let activeEvent = $derived(visibleEvents[visibleEvents.length - 1] ?? null);

    let showGoalFlash = $state(false);
    let goalFlashScorer = $state('');
    let goalFlashTimer: ReturnType<typeof setTimeout> | undefined;
    let lastGoalSequence = -1;
    let lastGoalMatchId = '';

    $effect(() => {
        const evt = activeEvent;
        if (match.id !== lastGoalMatchId) {
            lastGoalMatchId = match.id;
            lastGoalSequence = -1;
        }
        if (evt && evt.type === 'SHOT_GOAL' && evt.sequence !== lastGoalSequence) {
            lastGoalSequence = evt.sequence;
            const scorer = [...homeRoster, ...awayRoster].find((p) => p.id === evt.playerId);
            goalFlashScorer = scorer?.name ?? 'Goal!';
            showGoalFlash = true;
            clearTimeout(goalFlashTimer);
            goalFlashTimer = setTimeout(() => { showGoalFlash = false; }, 2000);
        }
    });
    onDestroy(() => clearTimeout(goalFlashTimer));

    let myLineup = $derived(data.viewerIsHome ? homeLineup : awayLineup);
    let myRoster = $derived(data.viewerIsHome ? homeRoster : awayRoster);
    let starterIds = $derived(new Set([myLineup.GK, ...myLineup.DEF, ...myLineup.MID, ...myLineup.FWD]));
    let subOut = $state('');
    let subIn = $state('');
</script>

<svelte:head>
    <title>{match.homeTeamName} vs {match.awayTeamName} - Calderra</title>
</svelte:head>

<section class="w-full max-w-3xl mx-auto flex flex-col space-y-4">
    <div class="flex justify-between items-center">
        <button class="btn btn-ghost btn-sm" onclick={() => goto('/football')}>&larr; Back</button>
        <span class="text-sm text-base-content/60">
            {#if activeEvent}{activeEvent.minute}'{/if}
            {#if match.status !== 'COMPLETED' && !showHalftimePanel}(live){/if}
        </span>
    </div>

    <div class="text-center">
        <h1 class="text-2xl font-bold">{match.homeTeamName} <span class="text-primary">{visibleEvents.filter(e=>e.type==='SHOT_GOAL' && homeRoster.some(p=>p.id===e.playerId)).length}</span> - <span class="text-secondary">{visibleEvents.filter(e=>e.type==='SHOT_GOAL' && awayRoster.some(p=>p.id===e.playerId)).length}</span> {match.awayTeamName}</h1>
    </div>

    <div class="relative">
        <PitchVisualizer
            {homeSlots}
            {awaySlots}
            activePlayerId={activeEvent?.playerId ?? null}
            activePosition={activeEvent?.positionData as any}
        />
        {#if showGoalFlash}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-50" transition:scale={{ duration: 250, start: 0.5 }}>
            <div class="bg-warning text-warning-content rounded-2xl px-8 py-4 text-center shadow-2xl">
                <p class="text-3xl font-black tracking-wide">⚽ GOAL!</p>
                <p class="text-lg font-semibold">{goalFlashScorer}</p>
            </div>
        </div>
        {/if}
    </div>

    <div class="card bg-base-200 p-4 min-h-16 flex items-center justify-center text-center">
        <p class="text-sm {activeEvent?.type === 'HALFTIME' || activeEvent?.type === 'FULLTIME' ? 'font-bold text-base' : ''}">{activeEvent?.description ?? 'Kick off!'}</p>
    </div>

    <div class="flex justify-end gap-2">
        {#if visibleCount < totalToShowNow}
        <button class="btn btn-ghost btn-sm" onclick={skipToEnd}>Skip ahead</button>
        {/if}
    </div>

    {#if showHalftimePanel && match.status === 'AWAITING_HALFTIME'}
    <div class="card bg-base-200 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Halftime</h2>
        <p class="text-sm text-base-content/70">Make a substitution if you like, or continue as you are.</p>
        <form method="POST" action="?/submitHalftime" use:enhance>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label class="flex flex-col gap-1">
                    <span class="text-xs text-base-content/60">Sub out</span>
                    <select class="select" name="subOut" bind:value={subOut}>
                        <option value="">— Keep lineup as is —</option>
                        {#each myRoster.filter(p => starterIds.has(p.id) && p.id !== myLineup.GK) as p}
                        <option value={p.id}>{p.name} ({p.position})</option>
                        {/each}
                    </select>
                </label>
                <label class="flex flex-col gap-1">
                    <span class="text-xs text-base-content/60">Sub in</span>
                    <select class="select" name="subIn" bind:value={subIn} disabled={!subOut}>
                        <option value="">Choose a bench player</option>
                        {#each myLineup.bench.map(id => myRoster.find(p => p.id === id)).filter(p => p && (!subOut || p.position === myRoster.find(x=>x.id===subOut)?.position)) as p}
                        <option value={p!.id}>{p!.name} ({p!.position})</option>
                        {/each}
                    </select>
                </label>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4">Start Second Half</button>
        </form>
    </div>
    {/if}

    {#if match.status === 'COMPLETED' && visibleCount >= match.events.length}
    <div class="card bg-base-200 p-5 text-center space-y-2">
        <h2 class="text-xl font-bold">Full Time</h2>
        <p>{match.homeTeamName} {match.homeScore} - {match.awayScore} {match.awayTeamName}</p>
        <button class="btn btn-primary" onclick={() => goto('/football')}>Back to Football Home</button>
    </div>
    {/if}

    <details class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-medium">Full commentary log</summary>
        <div class="collapse-content">
            <ul class="text-sm space-y-1">
                {#each visibleEvents as e}
                <li class={e.type === 'HALFTIME' || e.type === 'FULLTIME' ? 'font-bold' : ''}><span class="text-base-content/50">{e.minute}'</span> {e.description}</li>
                {/each}
            </ul>
        </div>
    </details>
</section>
