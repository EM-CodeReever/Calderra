<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/calderra_logo_rounded.png';
	import { invalidate } from '$app/navigation'
	import { onMount } from 'svelte'
	let { data, children } = $props()
	let { supabase, claims } = $derived(data)
	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== claims?.exp) {
				invalidate('supabase:auth')
			}
		})
		return () => data.subscription.unsubscribe()
	})
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
