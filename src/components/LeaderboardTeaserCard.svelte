<script lang="ts">
  import { Trophy } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import type { LB_MemoryCards } from "$prisma";

  let {
      bestRecord = null,
      rank = null,
      topScore = null,
      gamesPlayed = 0,
  }: { bestRecord: LB_MemoryCards | null; rank: number | null; topScore: number | null; gamesPlayed: number } = $props();
</script>

<div class="card bg-base-200 rounded-xl p-5 flex flex-col space-y-3 w-full">
    <div class="flex items-center space-x-2">
        <Trophy class="text-warning" size="20" />
        <p class="text-lg font-semibold">Memory Cards Leaderboard</p>
    </div>
    {#if bestRecord && rank}
    <p class="text-sm text-base-content/70">
        You're ranked <b>#{rank}</b> with a score of <b>{bestRecord.score}</b> ({bestRecord.time}).
    </p>
    <p class="text-xs text-base-content/50">
        {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'} played
    </p>
    {:else if gamesPlayed > 0}
    <p class="text-sm text-base-content/70">
        You've played {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'} — top score right now is <b>{topScore}</b>, keep going to crack the top 10!
    </p>
    <button class="btn btn-primary btn-sm w-fit" onclick={()=>{ goto('/memory-card') }}>Play Memory Cards</button>
    {:else}
    <p class="text-sm text-base-content/70">
        {#if topScore}
        Top score right now is <b>{topScore}</b> — you haven't made the top 10 yet.
        {:else}
        No scores on the board yet — be the first!
        {/if}
    </p>
    <button class="btn btn-primary btn-sm w-fit" onclick={()=>{ goto('/memory-card') }}>Play Memory Cards</button>
    {/if}
    <button class="btn btn-ghost btn-sm w-fit" onclick={()=>{ goto('/leaderboard') }}>View full leaderboard</button>
</div>
