<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { enhance } from '$app/forms';
    import { Swords } from '@lucide/svelte';

    let { data, form }: { data: PageData; form: ActionData } = $props();

    let sendingTo = $state<string | null>(null);
    let respondingTo = $state<string | null>(null);
</script>

<svelte:head>
    <title>Challenges - Calderra</title>
</svelte:head>

{#if data.team}
<section class="w-full max-w-2xl mx-auto flex flex-col space-y-6">
    <div>
        <h1 class="text-3xl font-bold flex items-center gap-2"><Swords /> Challenges</h1>
        <p class="text-base-content/70">Challenge other managers to a match. Halftime tactics happen once both of you have made your move.</p>
    </div>

    {#if form?.error}
    <div class="alert alert-error text-sm">{form.error}</div>
    {/if}

    {#if data.incoming.length > 0}
    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Incoming Challenges</h2>
        {#each data.incoming as c}
        <div class="flex justify-between items-center p-3 rounded-lg border border-base-300">
            <span><b>{c.teamName}</b> <span class="text-base-content/60 text-sm">({c.ownerName})</span></span>
            <div class="flex gap-2">
                <form method="POST" action="?/respond" use:enhance={() => { respondingTo = c.id; return async ({ update }) => { await update(); respondingTo = null; }; }}>
                    <input type="hidden" name="challengeId" value={c.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <button type="submit" class="btn btn-sm btn-primary" disabled={respondingTo === c.id}>Accept</button>
                </form>
                <form method="POST" action="?/respond" use:enhance={() => { respondingTo = c.id; return async ({ update }) => { await update(); respondingTo = null; }; }}>
                    <input type="hidden" name="challengeId" value={c.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <button type="submit" class="btn btn-sm btn-ghost" disabled={respondingTo === c.id}>Decline</button>
                </form>
            </div>
        </div>
        {/each}
    </div>
    {/if}

    {#if data.outgoing.length > 0}
    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Sent Challenges</h2>
        {#each data.outgoing as c}
        <div class="flex justify-between items-center p-3 rounded-lg border border-base-300">
            <span><b>{c.teamName}</b> <span class="text-base-content/60 text-sm">({c.ownerName})</span></span>
            <form method="POST" action="?/cancel" use:enhance>
                <input type="hidden" name="challengeId" value={c.id} />
                <button type="submit" class="btn btn-sm btn-ghost">Cancel</button>
            </form>
        </div>
        {/each}
    </div>
    {/if}

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Other Managers</h2>
        {#if data.opponents.length === 0}
        <p class="text-sm text-base-content/60">No other managers have set up a team yet — check back soon.</p>
        {:else}
        {#each data.opponents as o}
        <div class="flex justify-between items-center p-3 rounded-lg border border-base-300">
            <div>
                <p class="font-semibold">{o.name}</p>
                <p class="text-xs text-base-content/60">{o.ownerName} · {o.formation}</p>
            </div>
            <form method="POST" action="?/send" use:enhance={() => { sendingTo = o.id; return async ({ update }) => { await update(); sendingTo = null; }; }}>
                <input type="hidden" name="opponentTeamId" value={o.id} />
                <button type="submit" class="btn btn-sm btn-primary" disabled={sendingTo === o.id || !o.hasLineup}>
                    {o.hasLineup ? 'Challenge' : 'No lineup set'}
                </button>
            </form>
        </div>
        {/each}
        {/if}
    </div>
</section>
{/if}
