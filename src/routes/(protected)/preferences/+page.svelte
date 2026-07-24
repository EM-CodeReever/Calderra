<script lang="ts">
    import { themeState } from '$lib/state/theme.svelte';
    import { sidebarState, setSidebarMode, type SidebarMode } from '$lib/state/sidebar.svelte';

    const themes = [
        "forest",
        "abyss",
        "aqua",
        "emerald",
        "light",
        "dark",
        "cupcake",
        "bumblebee",
        "halloween",
        "garden",
        "synthwave",
        "retro",
        "cyberpunk",
        "valentine",
        "wireframe",
        "black",
        "luxury",
        "dracula",
        "cmyk",
        "autumn",
        "business",
        "acid",
        "lemonade",
        "night",
        "coffee",
        "silk",
        "lunis"
    ] as const;

    function setTheme(theme: typeof themes[number]) {
        themeState.current = theme;
    }
</script>


<div class="container mx-auto max-w-4xl p-6">
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">

            <div class="mb-8">
                <h1 class="text-3xl font-bold">Preferences</h1>
                <p class="text-base-content/70">
                    Customize your application experience.
                </p>
            </div>

            <!-- Appearance -->
            <div>
                <h2 class="text-xl font-semibold mb-4">
                    Appearance
                </h2>

                <div class="grid gap-6">

                      <!-- Theme Picker -->
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title">Theme</h2>

                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                {#each themes as theme}
                                    <button
                                        class="btn {themeState.current === theme ? 'btn-primary' : 'btn-outline'}"
                                        onclick={() => setTheme(theme)}
                                    >
                                        {theme}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar Behavior -->
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title">Sidebar Behavior</h2>
                            <p class="text-sm text-base-content/60">
                                Choose how the collapsed sidebar expands on desktop.
                            </p>

                            <div class="grid grid-cols-2 gap-3 mt-4">
                                <button
                                    class="btn {sidebarState.mode === 'hover' ? 'btn-primary' : 'btn-outline'}"
                                    onclick={() => setSidebarMode('hover' as SidebarMode)}
                                >
                                    Expand on hover
                                </button>
                                <button
                                    class="btn {sidebarState.mode === 'click' ? 'btn-primary' : 'btn-outline'}"
                                    onclick={() => setSidebarMode('click' as SidebarMode)}
                                >
                                    Click to expand
                                </button>
                            </div>
                            <p class="text-xs text-base-content/50 mt-2">
                                On touch devices the sidebar always uses click to expand, regardless of this setting.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
</div>
