<script lang="ts">
    import { formBand } from '$lib/football/matchEngine';
    import { X, Gauge, Zap } from '@lucide/svelte';

    let {
        player,
        stamina,
        form,
        canSubstitute,
        onClose,
        onSubstitute,
    }: {
        player: { id: string; name: string; position: string; personality: string } | null;
        stamina: number | null;
        form: number | null;
        canSubstitute: boolean;
        onClose: () => void;
        onSubstitute: () => void;
    } = $props();

    let staminaColor = $derived(
        stamina === null ? 'bg-base-300' : stamina >= 60 ? 'bg-success' : stamina >= 30 ? 'bg-warning' : 'bg-error'
    );
    let formBandLabel = $derived(form === null ? null : formBand(form));
    let formColor = $derived(
        formBandLabel === 'on fire' ? 'bg-success' : formBandLabel === 'normal' ? 'bg-warning' : formBandLabel === 'poor' ? 'bg-error' : 'bg-base-300'
    );
</script>

{#if player}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onclick={onClose} role="presentation">
    <div class="card bg-base-200 w-full max-w-sm p-5 space-y-4" onclick={(e) => e.stopPropagation()} role="presentation">
        <div class="flex justify-between items-start">
            <div>
                <p class="text-lg font-bold">{player.name}</p>
                <p class="text-xs text-base-content/60">{player.position} · {player.personality}</p>
            </div>
            <button type="button" class="btn btn-xs btn-circle btn-ghost" onclick={onClose} aria-label="Close">
                <X size="14" />
            </button>
        </div>

        <div class="space-y-1">
            <div class="flex justify-between text-xs text-base-content/70">
                <span class="flex items-center gap-1"><Gauge size="12" /> Stamina</span>
                <span>{stamina !== null ? `${Math.round(stamina)}%` : 'Not on the pitch'}</span>
            </div>
            {#if stamina !== null}
            <div class="w-full h-2 rounded-full bg-base-300 overflow-hidden">
                <div class="h-full {staminaColor}" style="width: {stamina}%"></div>
            </div>
            {/if}
        </div>

        <div class="space-y-1">
            <div class="flex justify-between text-xs text-base-content/70">
                <span class="flex items-center gap-1"><Zap size="12" /> Form</span>
                <span class="capitalize">{formBandLabel ?? 'Not on the pitch'}</span>
            </div>
            {#if form !== null}
            <div class="w-full h-2 rounded-full bg-base-300 overflow-hidden">
                <div class="h-full {formColor}" style="width: {form}%"></div>
            </div>
            {/if}
        </div>

        {#if canSubstitute}
        <button type="button" class="btn btn-primary btn-sm w-full" onclick={onSubstitute}>Substitute this player</button>
        {/if}
    </div>
</div>
{/if}
