<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    let showContent = $state(false);
    onMount(() => {
        showContent = true;
    });


</script>
<svelte:head>
    <title>About</title>
</svelte:head>
<section class="misty-waves min-h-screen h-fit flex flex-col items-center justify-center px-5 text-gray-800">
    {#if showContent}
    <div class="w-full max-w-2xl h-fit text-base-content" in:fly={{duration:1000,y:-400,opacity:0}}>
        <h1 class="text-4xl text-center font-bold mb-5">About Calderra</h1>
        <p class="text-center  px-5">
            Calderra is a collection of hobby projects and experiments that I have worked on over the years.
        </p>
    </div>
    {/if}
</section>