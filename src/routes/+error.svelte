<script lang="ts">
    import { page } from '$app/state';
</script>
<svelte:head>
  <title>Error {page.status}</title>
</svelte:head>

<section class="w-full bg-base-300 text-base-content h-screen">
    <div class="w-full h-full flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-5xl font-bold mb-5">{page.status}</h1>
            <p class="text-2xl">{page.error?.message}</p>
            <button class="btn btn-soft btn-secondary mt-10" onclick={() => {history.back()}}>
                Go Back
            </button>
        </div>
    </div>
</section>