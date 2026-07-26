<script lang="ts">
    import { formationSlotPositions } from '$lib/football/lineup';
    import type { Position } from '$lib/football/types';
    import { ChevronLeft, ChevronRight, X } from '@lucide/svelte';

    type RosterPlayer = { id: string; name: string; position: Position };

    let {
        formation,
        roster,
        selectedGk = $bindable(),
        selectedDef = $bindable(),
        selectedMid = $bindable(),
        selectedFwd = $bindable(),
        onCyclePrev,
        onCycleNext,
    }: {
        formation: string;
        roster: RosterPlayer[];
        selectedGk: string;
        selectedDef: string[];
        selectedMid: string[];
        selectedFwd: string[];
        onCyclePrev: () => void;
        onCycleNext: () => void;
    } = $props();

    let slots = $derived(formationSlotPositions(formation as any));

    let slotsByPosition = $derived.by(() => {
        const counters: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
        return slots.map((s) => ({ ...s, index: counters[s.position]++ }));
    });

    let openSlot = $state<{ position: Position; index: number } | null>(null);

    function idsFor(position: Position): string[] {
        if (position === 'GK') return selectedGk ? [selectedGk] : [];
        if (position === 'DEF') return selectedDef;
        if (position === 'MID') return selectedMid;
        return selectedFwd;
    }

    function playerAt(position: Position, index: number): RosterPlayer | undefined {
        const id = idsFor(position)[index];
        return id ? roster.find((p) => p.id === id) : undefined;
    }

    function toggleSlot(position: Position, index: number) {
        openSlot = openSlot && openSlot.position === position && openSlot.index === index
            ? null
            : { position, index };
    }

    function assign(position: Position, index: number, playerId: string) {
        if (position === 'GK') selectedGk = playerId;
        else if (position === 'DEF') { const a = [...selectedDef]; a[index] = playerId; selectedDef = a; }
        else if (position === 'MID') { const a = [...selectedMid]; a[index] = playerId; selectedMid = a; }
        else { const a = [...selectedFwd]; a[index] = playerId; selectedFwd = a; }
        openSlot = null;
    }

    function clearSlot(position: Position, index: number) {
        if (position === 'GK') selectedGk = '';
        else if (position === 'DEF') { const a = [...selectedDef]; a.splice(index, 1); selectedDef = a; }
        else if (position === 'MID') { const a = [...selectedMid]; a.splice(index, 1); selectedMid = a; }
        else { const a = [...selectedFwd]; a.splice(index, 1); selectedFwd = a; }
        openSlot = null;
    }

    function eligiblePlayers(position: Position, index: number): RosterPlayer[] {
        const used = new Set(idsFor(position));
        const current = idsFor(position)[index];
        return roster.filter((p) => p.position === position && (p.id === current || !used.has(p.id)));
    }

    function shortName(name: string): string {
        const parts = name.trim().split(/\s+/);
        if (parts.length < 2) return name;
        return `${parts[0][0].toUpperCase()}.${parts[parts.length - 1]}`;
    }

    const posLabel: Record<Position, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };
</script>

<div class="space-y-3 max-w-md mx-auto">
    <div class="flex items-center justify-center gap-4">
        <button type="button" class="btn btn-circle btn-sm btn-outline" onclick={onCyclePrev} aria-label="Previous formation">
            <ChevronLeft size="16" />
        </button>
        <div class="flex flex-col items-center">
            <div class="relative w-16 h-11 rounded bg-success/20 border border-success/50">
                {#each slots as s}
                <div class="absolute w-1.5 h-1.5 rounded-full bg-success" style="left: {s.x}%; top: {s.y}%; transform: translate(-50%,-50%);"></div>
                {/each}
            </div>
            <p class="text-sm font-bold mt-1">{formation}</p>
        </div>
        <button type="button" class="btn btn-circle btn-sm btn-outline" onclick={onCycleNext} aria-label="Next formation">
            <ChevronRight size="16" />
        </button>
    </div>

    <div class="relative w-full aspect-[3/2] rounded-lg overflow-hidden border border-base-300" style="background: repeating-linear-gradient(90deg, #2f9e44, #2f9e44 10%, #37b24d 10%, #37b24d 20%);">
        <div class="absolute inset-0">
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/60"></div>
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/60"></div>
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-24 border border-white/60 border-l-0"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-24 border border-white/60 border-r-0"></div>
        </div>

        {#each slotsByPosition as s (s.position + '-' + s.index)}
        {@const player = playerAt(s.position, s.index)}
        {@const isOpen = openSlot?.position === s.position && openSlot?.index === s.index}
        <button
            type="button"
            class="absolute flex flex-col items-center gap-0.5"
            style="left: {s.x}%; top: {s.y}%; transform: translate(-50%, -50%); z-index: {isOpen ? 20 : 10};"
            onclick={() => toggleSlot(s.position, s.index)}
        >
            <div class="rounded-full flex items-center justify-center text-[10px] font-bold border-2 w-8 h-8 {player ? 'bg-primary text-primary-content border-primary-content/40' : 'bg-base-300/70 border-dashed border-white/60 text-white/80'} {isOpen ? 'ring-2 ring-warning' : ''}">
                {player ? player.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '+'}
            </div>
            <span class="text-[9px] text-white drop-shadow max-w-14 truncate">{player ? shortName(player.name) : s.position}</span>
        </button>
        {/each}
    </div>

    {#if openSlot}
    <div class="card bg-base-200 p-4 space-y-2">
        <div class="flex justify-between items-center">
            <p class="text-sm font-medium">Choose your {posLabel[openSlot.position]}</p>
            <button type="button" class="btn btn-xs btn-ghost" onclick={() => openSlot = null}><X size="14" /></button>
        </div>
        <div class="flex flex-wrap gap-2">
            {#each eligiblePlayers(openSlot.position, openSlot.index) as p (p.id)}
            <button
                type="button"
                class="btn btn-sm {idsFor(openSlot.position)[openSlot.index] === p.id ? 'btn-primary' : 'btn-outline'}"
                onclick={() => assign(openSlot!.position, openSlot!.index, p.id)}
            >{p.name}</button>
            {/each}
            {#if idsFor(openSlot.position)[openSlot.index]}
            <button type="button" class="btn btn-sm btn-ghost text-error" onclick={() => clearSlot(openSlot!.position, openSlot!.index)}>Clear</button>
            {/if}
        </div>
    </div>
    {/if}
</div>
