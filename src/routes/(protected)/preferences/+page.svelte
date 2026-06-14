<script lang="ts">
    import type { PageProps } from './$types';
        import { themeState } from '$lib/state/theme.svelte';

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

                    <!-- Compact Mode -->
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">Compact Mode</p>
                            <p class="text-sm text-base-content/60">
                                Reduce spacing throughout the application.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                        />
                    </div>

                    <!-- Animations -->
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">Enable Animations</p>
                            <p class="text-sm text-base-content/60">
                                Show interface transitions and effects.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                            checked
                        />
                    </div>

                    <!-- Sidebar -->
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">
                                Collapse Sidebar by Default
                            </p>
                            <p class="text-sm text-base-content/60">
                                Start with a compact navigation menu.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                        />
                    </div>

                </div>
            </div>

            <div class="divider"></div>

            <!-- Notifications -->
            <div>
                <h2 class="text-xl font-semibold mb-4">
                    Notifications
                </h2>

                <div class="space-y-5">

                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">
                                Email Notifications
                            </p>
                            <p class="text-sm text-base-content/60">
                                Receive updates by email.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                            checked
                        />
                    </div>

                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">
                                Browser Notifications
                            </p>
                            <p class="text-sm text-base-content/60">
                                Show alerts inside your browser.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                        />
                    </div>

                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">
                                Sound Effects
                            </p>
                            <p class="text-sm text-base-content/60">
                                Play sounds for actions and alerts.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                        />
                    </div>

                </div>
            </div>

            <div class="divider"></div>

            <!-- Data & Behavior -->
            <div>
                <h2 class="text-xl font-semibold mb-4">
                    Behavior
                </h2>

                <div class="space-y-5">

                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-medium">
                                Auto Save Changes
                            </p>
                            <p class="text-sm text-base-content/60">
                                Automatically save forms while editing.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            class="toggle toggle-primary checkbox"
                            checked
                        />
                    </div>

                </div>
            </div>

            <div class="card-actions justify-end mt-8">
                <button class="btn btn-ghost">
                    Reset Defaults
                </button>

                <button class="btn btn-primary">
                    Save Preferences
                </button>
            </div>

        </div>
    </div>
</div>