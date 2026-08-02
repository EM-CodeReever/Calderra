<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';
    import { onDestroy } from 'svelte';
    import { goto, invalidateAll } from '$app/navigation';
    import { scale } from 'svelte/transition';
    import PitchVisualizer from '$components/football/PitchVisualizer.svelte';
    import PlayerStatModal from '$components/football/PlayerStatModal.svelte';
    import BackToFootballHome from '$components/football/BackToFootballHome.svelte';
    import { computeSlots, toLite } from '$lib/football/lineup';
    import type { Lineup } from '$lib/football/types';

    let { data }: { data: PageData } = $props();
    let match = $derived(data.match);

    let homeLineup = $derived(match.homeLineup as unknown as Lineup);
    let awayLineup = $derived(match.awayLineup as unknown as Lineup);
    let homeRoster = $derived(match.homePlayers.map(toLite));
    let awayRoster = $derived(match.awayPlayers.map(toLite));

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

    let lastMatchId = '';
    let lastTotalToShowNow = 0;

    $effect(() => {
        const currentTotal = totalToShowNow;
        if (match.id !== lastMatchId) {
            // genuinely a different match — reset playback from the start
            lastMatchId = match.id;
            lastTotalToShowNow = currentTotal;
            visibleCount = 0;
            showHalftimePanel = false;
            startTimer();
        } else if (currentTotal > lastTotalToShowNow) {
            // new events actually arrived (second half simulated) — resume playback through them
            lastTotalToShowNow = currentTotal;
            showHalftimePanel = false;
            startTimer();
        }
        // otherwise this is just a data refresh with nothing new to show (our own halftime
        // submission while still waiting on the opponent, or a poll that found no change yet)
        // — leave playback state untouched so the "waiting" panel doesn't flicker/replay.
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

    // Once we're watching second-half events, reflect any halftime substitutions on the pitch
    // instead of the pre-match starting lineup.
    let effectiveHomeLineup = $derived(
        activeEvent?.half === 2 && match.homeHalftimeLineup ? (match.homeHalftimeLineup as unknown as Lineup) : homeLineup
    );
    let effectiveAwayLineup = $derived(
        activeEvent?.half === 2 && match.awayHalftimeLineup ? (match.awayHalftimeLineup as unknown as Lineup) : awayLineup
    );
    let homeSlots = $derived(computeSlots(effectiveHomeLineup, homeRoster, 'HOME'));
    let awaySlots = $derived(computeSlots(effectiveAwayLineup, awayRoster, 'AWAY'));

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

    let showCardFlash = $state(false);
    let cardFlashPlayer = $state('');
    let cardFlashType = $state<'YELLOW' | 'RED'>('YELLOW');
    let cardFlashTimer: ReturnType<typeof setTimeout> | undefined;
    let lastCardSequence = -1;
    let lastCardMatchId = '';

    $effect(() => {
        const evt = activeEvent;
        if (match.id !== lastCardMatchId) {
            lastCardMatchId = match.id;
            lastCardSequence = -1;
        }
        if (evt && (evt.type === 'CARD_YELLOW' || evt.type === 'CARD_RED') && evt.sequence !== lastCardSequence) {
            lastCardSequence = evt.sequence;
            const booked = [...homeRoster, ...awayRoster].find((p) => p.id === evt.playerId);
            cardFlashPlayer = booked?.name ?? '';
            cardFlashType = evt.type === 'CARD_RED' ? 'RED' : 'YELLOW';
            showCardFlash = true;
            clearTimeout(cardFlashTimer);
            cardFlashTimer = setTimeout(() => { showCardFlash = false; }, 1800);
        }
    });
    onDestroy(() => clearTimeout(cardFlashTimer));

    // Cards persist on the pitch for the rest of the match once shown.
    let cardedById = $derived.by(() => {
        const map: Record<string, 'YELLOW' | 'RED'> = {};
        for (const e of visibleEvents) {
            if (e.type === 'CARD_YELLOW' && e.playerId && map[e.playerId] !== 'RED') map[e.playerId] = 'YELLOW';
            if (e.type === 'CARD_RED' && e.playerId) map[e.playerId] = 'RED';
        }
        return map;
    });

    let homeScore = $derived(visibleEvents.filter((e) => e.type === 'SHOT_GOAL' && homeRoster.some((p) => p.id === e.playerId)).length);
    let awayScore = $derived(visibleEvents.filter((e) => e.type === 'SHOT_GOAL' && awayRoster.some((p) => p.id === e.playerId)).length);

    let myLineup = $derived(data.viewerIsHome ? homeLineup : awayLineup);
    let myRoster = $derived(data.viewerIsHome ? homeRoster : awayRoster);
    let starterIds = $derived(new Set([myLineup.GK, ...myLineup.DEF, ...myLineup.MID, ...myLineup.FWD]));
    let subOut = $state('');
    let subIn = $state('');

    let viewerAlreadySubmitted = $derived(!!(data.viewerIsHome ? match.homeHalftimeLineup : match.awayHalftimeLineup));
    let isPvpMatch = $derived(!match.homeIsAi && !match.awayIsAi);

    let pollTimer: ReturnType<typeof setInterval> | undefined;
    $effect(() => {
        const shouldPoll = showHalftimePanel && match.status === 'AWAITING_HALFTIME' && viewerAlreadySubmitted;
        if (shouldPoll) {
            pollTimer = setInterval(() => invalidateAll(), 4000);
        }
        return () => clearInterval(pollTimer);
    });

    let selectedPlayerId = $state<string | null>(null);

    let selectedPlayer = $derived.by(() => {
        if (!selectedPlayerId) return null;
        const p = [...homeRoster, ...awayRoster].find((p) => p.id === selectedPlayerId);
        return p ? { id: p.id, name: p.name, position: p.position, personality: p.personality } : null;
    });

    let selectedPlayerIsHome = $derived(homeRoster.some((p) => p.id === selectedPlayerId));

    // Stamina/form snapshots are only captured once per half (at its end), so we interpolate
    // stamina from 100% down to that end value based on how far through the half's events
    // playback currently is — otherwise everyone would appear to "start" already tired.
    let currentHalfNumber = $derived(activeEvent?.half ?? 1);
    let currentHalfEventsList = $derived(match.events.filter((e) => e.half === currentHalfNumber));
    let currentHalfProgress = $derived.by(() => {
        if (!activeEvent) return 0;
        const idx = currentHalfEventsList.findIndex((e) => e.sequence === activeEvent.sequence);
        if (idx === -1) return 0;
        if (currentHalfEventsList.length <= 1) return 1;
        return idx / (currentHalfEventsList.length - 1);
    });

    let selectedPlayerStamina = $derived.by(() => {
        if (!selectedPlayerId) return null;
        const staminaMap = currentHalfNumber === 1
            ? (selectedPlayerIsHome ? match.homeStaminaH1 : match.awayStaminaH1)
            : (selectedPlayerIsHome ? match.homeStamina : match.awayStamina);
        const endValue = staminaMap?.[selectedPlayerId];
        if (endValue === undefined || endValue === null) return null;
        return 100 - (100 - endValue) * currentHalfProgress;
    });

    let selectedPlayerForm = $derived.by(() => {
        if (!selectedPlayerId) return null;
        const formMap = currentHalfNumber === 1
            ? (selectedPlayerIsHome ? match.homeFormH1 : match.awayFormH1)
            : (selectedPlayerIsHome ? match.homeForm : match.awayForm);
        return formMap?.[selectedPlayerId] ?? null;
    });

    let canSubstituteSelected = $derived(
        showHalftimePanel && match.status === 'AWAITING_HALFTIME' && !viewerAlreadySubmitted &&
        !!selectedPlayerId && selectedPlayerIsHome === data.viewerIsHome &&
        starterIds.has(selectedPlayerId) && selectedPlayerId !== myLineup.GK
    );

    function handleSubstitute() {
        if (selectedPlayerId) subOut = selectedPlayerId;
        selectedPlayerId = null;
    }
</script>

<svelte:head>
    <title>{match.homeTeamName} vs {match.awayTeamName} - Calderra</title>
</svelte:head>

<section class="w-full max-w-3xl mx-auto flex flex-col space-y-4">
    <div class="flex justify-between items-center">
        <BackToFootballHome />
        <span class="text-sm text-base-content/60">
            {#if activeEvent}{activeEvent.minute}'{/if}
            {#if match.status !== 'COMPLETED' && !showHalftimePanel}(live){/if}
        </span>
    </div>

    <div class="flex justify-center">
        <div class="inline-flex items-center gap-3 bg-neutral text-neutral-content rounded-full px-5 py-2 max-w-full">
            <span class="font-semibold truncate">{match.homeTeamName}</span>
            <span class="badge badge-primary badge-lg font-bold">{homeScore}</span>
            <span class="opacity-50">-</span>
            <span class="badge badge-secondary badge-lg font-bold">{awayScore}</span>
            <span class="font-semibold truncate">{match.awayTeamName}</span>
        </div>
    </div>

    <div class="relative">
        <PitchVisualizer
            {homeSlots}
            {awaySlots}
            activePlayerId={activeEvent?.playerId ?? null}
            activePosition={activeEvent?.positionData as any}
            onPlayerClick={(id) => selectedPlayerId = id}
            {cardedById}
        />
        {#if showGoalFlash}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-50" transition:scale={{ duration: 250, start: 0.5 }}>
            <div class="bg-warning text-warning-content rounded-2xl px-8 py-4 text-center shadow-2xl">
                <p class="text-3xl font-black tracking-wide">⚽ GOAL!</p>
                <p class="text-lg font-semibold">{goalFlashScorer}</p>
            </div>
        </div>
        {/if}
        {#if showCardFlash}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-50" transition:scale={{ duration: 250, start: 0.5 }}>
            <div class="{cardFlashType === 'RED' ? 'bg-error text-error-content' : 'bg-warning text-warning-content'} rounded-2xl px-8 py-4 text-center shadow-2xl">
                <div class="mx-auto mb-1 w-5 h-7 rounded-xs {cardFlashType === 'RED' ? 'bg-error-content/90' : 'bg-warning-content/90'}"></div>
                <p class="text-xl font-black tracking-wide">{cardFlashType === 'RED' ? 'RED CARD' : 'YELLOW CARD'}</p>
                <p class="text-lg font-semibold">{cardFlashPlayer}</p>
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

    {#if showHalftimePanel && match.status === 'AWAITING_HALFTIME' && !viewerAlreadySubmitted}
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

    {#if showHalftimePanel && match.status === 'AWAITING_HALFTIME' && viewerAlreadySubmitted}
    <div class="card bg-base-200 p-5 space-y-2 text-center">
        <h2 class="text-lg font-semibold">Halftime submitted</h2>
        <p class="text-sm text-base-content/70">
            {isPvpMatch ? "Waiting for the other manager to make their move..." : 'Waiting for the second half to kick off...'}
        </p>
        <span class="loading loading-dots loading-md mx-auto"></span>
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

    <PlayerStatModal
        player={selectedPlayer}
        stamina={selectedPlayerStamina}
        form={selectedPlayerForm}
        canSubstitute={canSubstituteSelected}
        onClose={() => selectedPlayerId = null}
        onSubstitute={handleSubstitute}
    />
</section>
