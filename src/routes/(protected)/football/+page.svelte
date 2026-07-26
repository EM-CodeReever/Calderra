<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { Goal, Users, Trophy, Coins, ShieldPlus, Swords, Crown } from '@lucide/svelte';

    let { data }: { data: PageData } = $props();

    let selectedAiTeamId = $state(data.aiTeams[0]?.id ?? '');
    let playingMatch = $state(false);
</script>

<svelte:head>
    <title>Football - Calderra</title>
</svelte:head>

{#if data.team}
<section class="w-full flex flex-col space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold flex items-center gap-2"><Goal /> {data.team.name}</h1>
            <p class="text-base-content/70">{data.team.players.length} players · {data.team.default_formation} formation · <span class="inline-flex items-center gap-1"><Coins size="14" />{data.team.budget} credits</span></p>
        </div>
        <div class="flex gap-2 flex-wrap">
            <button class="btn btn-outline btn-sm" onclick={() => goto('/football/squad')}>
                <Users size="16" /> Squad & Formation
            </button>
            <button class="btn btn-outline btn-sm" onclick={() => goto('/football/transfer-market')}>
                <Coins size="16" /> Transfer Market
            </button>
            <button class="btn btn-outline btn-sm" onclick={() => goto('/football/challenges')}>
                <Swords size="16" /> Challenges
                {#if data.pendingChallengeCount > 0}
                <span class="badge badge-primary badge-xs">{data.pendingChallengeCount}</span>
                {/if}
            </button>
            <button class="btn btn-outline btn-sm" onclick={() => goto('/football/league')}>
                <Crown size="16" /> League
            </button>
            {#if data.userProfile?.is_admin}
            <button class="btn btn-outline btn-sm" onclick={() => goto('/football/admin')}>
                <ShieldPlus size="16" /> Admin
            </button>
            {/if}
        </div>
    </div>

    <div class="card bg-base-200 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Play a Match</h2>
        <p class="text-sm text-base-content/70">Choose an opponent to test your tactics against. Halftime lets you make changes before the second half kicks off.</p>
        <form
            method="POST"
            action="?/playMatch"
            class="flex flex-col sm:flex-row gap-3"
            use:enhance={() => {
                playingMatch = true;
                return async ({ update }) => { await update(); playingMatch = false; };
            }}
        >
            <select class="select w-full" name="aiTeamId" bind:value={selectedAiTeamId}>
                {#each data.aiTeams as ai}
                <option value={ai.id}>{ai.name} ({ai.formation})</option>
                {/each}
            </select>
            <button type="submit" class="btn btn-primary" disabled={playingMatch}>
                {#if playingMatch}<span class="loading loading-spinner loading-sm"></span>{/if}
                Kick Off
            </button>
        </form>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2"><Trophy size="18" /> Recent Matches</h2>
        {#if data.matches.length === 0}
        <p class="text-sm text-base-content/60">No matches played yet — kick off above to get started.</p>
        {:else}
        <div class="flex flex-col space-y-2">
            {#each data.matches as m}
            <button
                class="flex justify-between items-center w-full p-3 rounded-lg border border-base-300 hover:bg-base-300/50 text-left"
                onclick={() => goto(`/football/match/${m.id}`)}
            >
                <span>{m.homeTeamName} <b>{m.homeScore}</b> - <b>{m.awayScore}</b> {m.awayTeamName}</span>
                <span class="text-xs text-base-content/50">
                    {#if m.status === 'COMPLETED'}
                        Full time
                    {:else if m.status === 'AWAITING_HALFTIME'}
                        {m.viewerSubmittedHalftime ? 'Halftime — waiting on opponent' : 'Halftime — needs you!'}
                    {:else}
                        In progress
                    {/if}
                </span>
            </button>
            {/each}
        </div>
        {/if}
    </div>
</section>
{/if}
