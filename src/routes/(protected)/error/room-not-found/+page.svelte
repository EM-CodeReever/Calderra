<script lang="ts">
  import { goto } from "$app/navigation";
  import { lordIconTheme } from '$lib/actions/lordIconTheme';
  import { themeState } from '$lib/state/theme.svelte';
</script>

<svelte:head>
 <title>
    Room Not Found
 </title>
</svelte:head>

<section class="w-full h-fit">
    <div class="w-full flex justify-center items-center">
        <span class="flex flex-col items-center space-y-3 ">
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
<lord-icon
    src="https://cdn.lordicon.com/lltgvngb.json"
    trigger="in"
    delay="0"
    state="in-reveal"
    use:lordIconTheme={themeState.current}
    style="width:200px;height:200px">
</lord-icon>
            <h1 class="text-5xl font-semibold">Room Not Found</h1>
            <p class="lg:max-w-full max-w-xs text-center">Invalid room code, please double check to ensure you got it right.</p>
            <button class="btn btn-primary flex-grow w-full max-w-md" onclick={()=>{goto("/chat-room")}}>Return to Chat Home
            </button>
        </span>
    </div>
</section>
