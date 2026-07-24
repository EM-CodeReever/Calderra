<script lang="ts">
    import { goto } from "$app/navigation";

    let { isActive = false, title = "", linkTo = "", expanded = true} = $props();

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<button class="cursor-pointer flex items-center font-semibold text-base-content {isActive ? 'bg-primary text-primary-content' : 'hover:bg-secondary hover:text-secondary-content'} w-full p-3 rounded-lg relative {expanded ? 'justify-start space-x-3' : 'justify-center space-x-0'} {!expanded ? 'tooltip tooltip-right' : ''}"
data-tip={!expanded ? title : undefined}
onclick={()=>{
    goto(linkTo);
    let closeSidebarButton:HTMLInputElement = document.getElementById("my-drawer-2") as HTMLInputElement;
    if(closeSidebarButton){
      closeSidebarButton.checked = false;
    }
}}>
    <div class="flex items-center justify-center">
        <slot />
    </div>
    <p class="overflow-hidden whitespace-nowrap transition-all duration-200 {expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}">{title}</p>
    {#if isActive}
    <span class="absolute w-1 h-9 rounded-tr-lg rounded-br-lg -left-3 top-1.5 bg-primary"></span>
    {/if}
  </button>