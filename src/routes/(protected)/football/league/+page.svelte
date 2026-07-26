<script lang="ts">
    import { goto } from '$app/navigation';
    import { Trophy } from '@lucide/svelte';
</script>

<svelte:head>
    <title>League - Calderra</title>
</svelte:head>

<section class="w-full max-w-2xl mx-auto flex flex-col space-y-6">
    <div class="card bg-base-200 p-8 text-center space-y-4">
        <Trophy size="40" class="mx-auto text-primary" />
        <h1 class="text-2xl font-bold">League — Coming Soon</h1>
        <p class="text-base-content/70">
            A proper Premier-League-style round robin is on the way: up to 10 teams join a season,
            play everyone home and away, and climb a live table for bragging rights.
        </p>
        <p class="text-sm text-base-content/50">
            For now, challenge other managers directly from the Challenges page.
        </p>
        <button class="btn btn-primary" onclick={() => goto('/football/challenges')}>Go to Challenges</button>
    </div>
</section>
