export type SidebarMode = 'hover' | 'click';

const DEFAULT_MODE: SidebarMode = 'hover';

// read saved value safely (SSR-safe)
function getSavedMode(): SidebarMode {
    if (typeof localStorage === 'undefined') return DEFAULT_MODE;

    const saved = localStorage.getItem('sidebarMode');
    return saved === 'hover' || saved === 'click' ? saved : DEFAULT_MODE;
}

export const sidebarState = $state<{ mode: SidebarMode; expanded: boolean; isTouch: boolean }>({
    mode: getSavedMode(),
    expanded: false,
    isTouch: false,
});

export function setSidebarMode(mode: SidebarMode) {
    sidebarState.mode = mode;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sidebarMode', mode);
    }
}

export function initSidebarPreference() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('sidebarMode');
    if (saved === 'hover' || saved === 'click') {
        sidebarState.mode = saved;
    }

    sidebarState.isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
}
