<script lang="ts">
    import { goto } from "$app/navigation";

    let { isActive = false, title = "", linkTo = "" } = $props();

</script>

<button class="cursor-pointer flex justify-start items-center font-semibold space-x-3 {isActive ? 'bg-secondary text-gray-800' : 'hover:bg-accent hover:text-gray-800'} w-full p-3 rounded-lg relative"
onclick={()=>{
    goto(linkTo);
    let element = document.getElementById('drawer-left');
    element?.classList.remove('show');
}}>
    <slot />
    <p>{title}</p>
    {#if isActive}
    <span class="absolute w-1 h-9 rounded-tr-lg rounded-br-lg -left-3 top-1.5 bg-secondary"></span>
    {/if}
  </button>