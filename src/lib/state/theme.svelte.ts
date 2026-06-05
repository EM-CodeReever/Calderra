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