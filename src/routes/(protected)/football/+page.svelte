<script lang="ts">
    import type { PageData } from './$types';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { Goal, Users, Trophy, Coins, ShieldPlus, Swords, Crown, BookOpen, Play } from '@lucide/svelte';

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
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <!-- Featured: Kick Off -->
        <div class="col-span-2 rounded-2xl p-5 flex flex-col justify-between gap-3 bg-linear-to-br from-primary to-primary/70 text-primary-content shadow-lg">
            <div class="flex items-center gap-2">
                <Play size="24" />
                <span class="font-black text-lg uppercase tracking-wide">Kick Off</span>
            </div>
            <p class="text-sm text-primary-content/80">Choose an opponent and get playing. Halftime lets you make changes before the second half kicks off.</p>
            <form
                method="POST"
                action="?/playMatch"
                class="flex flex-col sm:flex-row gap-2"
                use:enhance={() => {
                    playingMatch = true;
                    return async ({ update }) => { await update(); playingMatch = false; };
                }}
            >
                <select class="select select-bordered bg-base-100 text-base-content w-full" name="aiTeamId" bind:value={selectedAiTeamId}>
                    {#each data.aiTeams as ai}
                    <option value={ai.id}>{ai.name} ({ai.formation})</option>
                    {/each}
                </select>
                <button type="submit" class="btn btn-neutral" disabled={playingMatch}>
                    {#if playingMatch}<span class="loading loading-spinner loading-sm"></span>{/if}
                    Play
                </button>
            </form>
        </div>

        <button
            type="button"
            class="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center min-h-28 bg-linear-to-br from-secondary to-secondary/70 text-secondary-content shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            onclick={() => goto('/football/squad')}
        >
            <Users size="26" />
            <span class="font-bold text-sm uppercase tracking-wide">Squad</span>
        </button>

        <button
            type="button"
            class="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center min-h-28 bg-linear-to-br from-accent to-accent/70 text-accent-content shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            onclick={() => goto('/football/transfer-market')}
        >
            <Coins size="26" />
            <span class="font-bold text-sm uppercase tracking-wide">Transfer Market</span>
        </button>

        <button
            type="button"
            class="relative rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center min-h-28 bg-linear-to-br from-info to-info/70 text-info-content shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            onclick={() => goto('/football/challenges')}
        >
            {#if data.pendingChallengeCount > 0}
            <span class="badge badge-primary badge-sm absolute top-2 right-2">{data.pendingChallengeCount}</span>
            {/if}
            <Swords size="26" />
            <span class="font-bold text-sm uppercase tracking-wide">Challenges</span>
        </button>

        <button
            type="button"
            class="relative rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center min-h-28 bg-linear-to-br from-warning to-warning/70 text-warning-content shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            onclick={() => goto('/football/league')}
        >
            <span class="badge badge-ghost badge-xs absolute top-2 right-2">Soon</span>
            <Crown size="26" />
            <span class="font-bold text-sm uppercase tracking-wide">League</span>
        </button>

        <button
            type="button"
            class="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center min-h-28 bg-linear-to-br from-neutral to-neutral/70 text-neutral-content shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            onclick={() => goto('/football/guide')}
        >
            <BookOpen size="26" />
            <span class="font-bold text-sm uppercase tracking-wide">How to Play</span>
        </button>

        {#if data.userProfile?.is_admin}
        <button
            type="button"
            class="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center min-h-28 bg-base-300 text-base-content shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-200"
            onclick={() => goto('/football/admin')}
        >
            <ShieldPlus size="26" />
            <span class="font-bold text-sm uppercase tracking-wide">Admin</span>
        </button>
        {/if}
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
