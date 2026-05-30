<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/calderra_logo_rounded.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
