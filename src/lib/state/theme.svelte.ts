import type { Theme } from '$lib/index';

const DEFAULT_THEME: Theme['current'] = 'dark';

// read saved value safely (SSR-safe)
function getSavedTheme(): Theme['current'] {
    if (typeof localStorage === 'undefined') return DEFAULT_THEME;

    const saved = localStorage.getItem('theme');
    return (saved as Theme['current']) ?? DEFAULT_THEME;
}

export function initTheme() {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('theme');
    if (saved) {
        themeState.current = saved as any;
    }
}

export const themeState = $state<Theme>({
    current: getSavedTheme(),
    extra: {
        landingPageTop: '',
        landingPageBelow: '',
        navbar: '',
        footer: '',
        MainBG: ''
    }
});

// Themes with bespoke Haikei wave artwork (see static/{theme}_bg_top.svg / _below.svg).
// Everything else falls back to a generic wave that recolors itself via the
// active daisyUI theme's own CSS variables (see .wave-fallback-* in layout.css).
const BESPOKE_WAVE_THEMES: Theme['current'][] = [
    'abyss', 'aqua', 'emerald', 'cupcake', 'bumblebee', 'retro', 'cyberpunk', 'silk'
];

export function isBespokeWaveTheme(): boolean {
    return BESPOKE_WAVE_THEMES.includes(themeState.current);
}

export function waveBgClass(position: 'top' | 'below'): string {
    return isBespokeWaveTheme()
        ? `${themeState.current}-bg-${position}`
        : `wave-fallback-${position}`;
}

// For solid sections sandwiched between two waves (e.g. the project showcase):
// bespoke themes keep their original flat secondary fill. Fallback themes get no
// background of their own — they sit in front of a single shared gradient layer
// painted once behind the whole section group, so color stays continuous across
// section boundaries instead of each section computing its own gradient relative
// to its own (differently sized) box.
export function showcaseBgClass(): string {
    return isBespokeWaveTheme() ? 'bg-secondary' : '';
}