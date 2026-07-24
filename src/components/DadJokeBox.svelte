<script lang="ts">
  import { RefreshCcw } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  let jokePromise = $state<Promise<any>>(Promise.resolve());
  let joke = $state("Loading...");

  onMount(()=>{
      refreshJoke();
  });

  function refreshJoke(){
      jokePromise = fetch('https://icanhazdadjoke.com/', {
          headers: { Accept: 'application/json' },
      }).then(res => res.json()).then(data => {
          joke = data.joke;
      });
  }
</script>

<div class="h-fit max-h-72 relative rounded-xl w-full mr-5 lg:mr-0 p-5 flex flex-col justify-between text-base-content" >
    <button class="btn rounded-full p-2 btn-primary absolute top-4 right-4" onclick={()=>{
        refreshJoke()
    }}>
    <RefreshCcw size="20" />
    </button>
    <span>
        <p class="text-2xl font-semibold">Dad joke of the moment</p>
        {#await jokePromise}
        <div class="w-full h-fit flex justify-center items-center" style="max-height: 8rem;">
            <span class="loading loading-spinner loading-md"></span>
        </div>
        {:then}
        <p class="text-sm my-3 h-fit overflow-y-auto" in:fade={{duration: 500}} style="max-height: 8rem;">
            {joke}
        </p>
        {/await}
    </span>
</div>
