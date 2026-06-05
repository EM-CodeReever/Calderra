<script lang="ts">
    import { goto } from "$app/navigation";

    let { isActive = false, title = "", linkTo = "" } = $props();

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<label for="my-drawer-2" aria-label="close sidebar" class="cursor-pointer flex justify-start items-center font-semibold text-base-content space-x-3 {isActive ? 'bg-primary text-primary-content' : 'hover:bg-secondary hover:text-secondary-content'} w-full p-3 rounded-lg relative"
onclick={()=>{
    goto(linkTo);
    let element = document.getElementById('drawer-left');
    element?.classList.remove('show');
}}>
    <slot />
    <p>{title}</p>
    {#if isActive}
    <span class="absolute w-1 h-9 rounded-tr-lg rounded-br-lg -left-3 top-1.5 bg-primary"></span>
    {/if}
  </label>