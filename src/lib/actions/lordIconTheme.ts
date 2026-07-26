// Lordicon's <lord-icon> web component only accepts literal hex colors via its
// `colors` attribute — it can't read CSS variables or `currentColor` itself.
// This action resolves a daisyUI theme CSS variable (default: the same
// `--color-base-content` used for surrounding text) to a hex string and keeps
// the icon's colors attribute in sync whenever the active theme changes.

function clamp01(n: number): number {
    return Math.min(1, Math.max(0, n));
}

function srgbGammaEncode(c: number): number {
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// Björn Ottosson's OKLab/OKLCH -> linear sRGB -> sRGB conversion.
function oklchToHex(l: number, c: number, hDeg: number): string {
    const h = (hDeg * Math.PI) / 180;
    const a = c * Math.cos(h);
    const b = c * Math.sin(h);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

    const l3 = l_ ** 3;
    const m3 = m_ ** 3;
    const s3 = s_ ** 3;

    const rLin = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    const r = clamp01(srgbGammaEncode(rLin));
    const g = clamp01(srgbGammaEncode(gLin));
    const bChan = clamp01(srgbGammaEncode(bLin));

    return (
        '#' +
        [r, g, bChan]
            .map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
            .join('')
    );
}

function parseColorToHex(resolved: string): string {
    // getComputedStyle can return oklch(L C H), rgb(r, g, b), or rgba(r, g, b, a)
    // depending on the browser/version — handle whichever one comes back.
    const oklchMatch = resolved.match(/oklch\(([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
    if (oklchMatch) {
        const [, lStr, cStr, hStr] = oklchMatch;
        return oklchToHex(parseFloat(lStr), parseFloat(cStr), parseFloat(hStr));
    }

    const rgbMatch = resolved.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return (
            '#' +
            [r, g, b]
                .map((v) => Math.round(parseFloat(v)).toString(16).padStart(2, '0'))
                .join('')
        );
    }

    return '#000000';
}

function resolveCssVarToHex(varName: string): string {
    if (typeof window === 'undefined') return '#000000';

    const probe = document.createElement('span');
    probe.style.color = `var(${varName})`;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    document.body.removeChild(probe);

    return parseColorToHex(resolved);
}

export function lordIconTheme(node: HTMLElement, varName: string = '--color-base-content') {
    function apply(name: string) {
        const hex = resolveCssVarToHex(name);
        node.setAttribute('colors', `primary:${hex},secondary:${hex}`);
    }

    apply(varName);

    return {
        update(name: string = '--color-base-content') {
            apply(name);
        },
    };
}
