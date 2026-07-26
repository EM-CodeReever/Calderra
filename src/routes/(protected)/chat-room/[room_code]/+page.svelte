<script lang="ts">
    import type { PageData } from './$types';
    import ChatRoomView from './ChatRoomView.svelte';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>{data.room.name} - Calderra</title>
</svelte:head>

{#key data.room.code}
<ChatRoomView {data} />
{/key}
