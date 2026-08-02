<script lang="ts">
    type Slot = { id: string; name: string; x: number; y: number; team: 'HOME' | 'AWAY' };

    let {
        homeSlots,
        awaySlots,
        activePlayerId = null,
        activePosition = null,
        onPlayerClick = null,
    }: {
        homeSlots: Slot[];
        awaySlots: Slot[];
        activePlayerId?: string | null;
        activePosition?: { x: number; y: number } | null;
        onPlayerClick?: ((id: string) => void) | null;
    } = $props();

    let allSlots = $derived([...homeSlots, ...awaySlots]);

    function initials(name: string): string {
        const parts = name.trim().split(/\s+/);
        return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    }

    function shortName(name: string): string {
        const parts = name.trim().split(/\s+/);
        if (parts.length < 2) return name;
        return `${parts[0][0].toUpperCase()}.${parts[parts.length - 1]}`;
    }

    let ballPos = $derived(
        activePosition
            ? { x: Math.min(97, activePosition.x + 3), y: Math.min(97, activePosition.y + 3) }
            : { x: 50, y: 50 }
    );
</script>

<div class="relative w-full aspect-[3/2] rounded-lg overflow-hidden border border-base-300" style="background: repeating-linear-gradient(90deg, #2f9e44, #2f9e44 10%, #37b24d 10%, #37b24d 20%);">
    <!-- pitch markings -->
    <div class="absolute inset-0">
        <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/60"></div>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/60"></div>
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-24 border border-white/60 border-l-0"></div>
        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-24 border border-white/60 border-r-0"></div>
    </div>

    {#each allSlots as slot (slot.id)}
    {@const isActive = slot.id === activePlayerId}
    {@const pos = isActive && activePosition ? activePosition : slot}
    <button
        type="button"
        class="absolute flex items-center gap-0.5 transition-all duration-700 ease-out {slot.team === 'AWAY' ? 'flex-col-reverse' : 'flex-col'} {onPlayerClick ? 'cursor-pointer' : 'cursor-default'}"
        style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -50%); z-index: {isActive ? 20 : 10};"
        onclick={() => onPlayerClick?.(slot.id)}
        disabled={!onPlayerClick}
    >
        <div class="rounded-full flex items-center justify-center text-[10px] font-bold border-2 {slot.team === 'HOME' ? 'bg-primary text-primary-content border-primary-content/40' : 'bg-secondary text-secondary-content border-secondary-content/40'} {isActive ? 'w-9 h-9 ring-2 ring-warning' : 'w-7 h-7'}">
            {initials(slot.name)}
        </div>
        <span class="text-[9px] text-white drop-shadow max-w-10.5 truncate text-center">{shortName(slot.name)}</span>
    </button>
    {/each}

    <div
        class="absolute w-2.5 h-2.5 rounded-full bg-white border border-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out"
        style="left: {ballPos.x}%; top: {ballPos.y}%; transform: translate(-50%, -50%); z-index: 30;"
    ></div>
</div>
