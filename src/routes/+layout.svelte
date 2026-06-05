<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/calderra_logo_rounded.png';
	import { invalidate } from '$app/navigation'
	import { themeState } from '$lib/state/theme.svelte.js';
	import { initTheme } from '$lib/state/theme.svelte';
	import { onMount } from 'svelte'
	let { data, children } = $props()
	let { supabase, claims } = $derived(data)
	
    initTheme();

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== claims?.exp) {
				invalidate('supabase:auth')
			}
		})
		return () => data.subscription.unsubscribe()
	})

	// persist theme
    $effect(() => {
        document.documentElement.setAttribute(
            'data-theme',
            themeState.current
        );

        localStorage.setItem('theme', themeState.current);
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<section>
{@render children()}
</section>
