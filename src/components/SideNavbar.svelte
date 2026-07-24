<script lang="ts">
  import { DiamondPercent, House, ListOrdered, Menu, MessageSquareMore, Sticker, X } from "@lucide/svelte";

  import SideNavItem from "./SideNavItem.svelte";
  import Project from "./svg/Project.svelte";
  import { sidebarState } from "$lib/state/sidebar.svelte";

  let { currentPath } = $props();
  let staticPath = "/(protected)";

  let effectiveMode = $derived(sidebarState.isTouch ? 'click' : sidebarState.mode);

  function handleMouseEnter() {
    if (effectiveMode === 'hover') sidebarState.expanded = true;
  }
  function handleMouseLeave() {
    if (effectiveMode === 'hover') sidebarState.expanded = false;
  }

</script>


<div class="w-full h-fit flex flex-col space-y-5 mt-4 lg:space-x-5 lg:space-y-0 lg:flex-row">
    <nav class="w-full text-gray-200 p-3 h-fit rounded-xl justify-start items-center space-y-3 flex-col hidden lg:flex transition-all duration-200 overflow-hidden {sidebarState.expanded ? 'lg:w-56' : 'lg:w-18'}"
    aria-label="Sidebar navigation"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    >
        <button class="btn btn-ghost btn-sm self-end mb-1" aria-label="Toggle sidebar" onclick={()=>{ sidebarState.expanded = !sidebarState.expanded }}>
          {#if sidebarState.expanded}
          <X size={20}/>
          {:else}
          <Menu size={20}/>
          {/if}
        </button>

        <SideNavItem title="Dashboard" isActive={(currentPath === staticPath + "/dashboard")} linkTo="/dashboard" expanded={sidebarState.expanded}>
            <Project />
        </SideNavItem>
        <SideNavItem title="Ping Pong" isActive={(currentPath === staticPath + "/ping-pong")} linkTo="/ping-pong" expanded={sidebarState.expanded}>
          <DiamondPercent/>
        </SideNavItem>
        <SideNavItem title="Memory Cards" isActive={(currentPath === staticPath + "/memory-card")} linkTo="/memory-card" expanded={sidebarState.expanded}>
            <Sticker/>
        </SideNavItem>
        <SideNavItem title="Skaros Rock" isActive={(currentPath === staticPath + "/chat-room")} linkTo="/chat-room" expanded={sidebarState.expanded}>
          <MessageSquareMore/>
        </SideNavItem>
        <SideNavItem title="Leaderboard" isActive={(currentPath === staticPath + "/leaderboard")} linkTo="/leaderboard" expanded={sidebarState.expanded}>
          <ListOrdered/>
        </SideNavItem>
        <SideNavItem title="Homepage" isActive={false} linkTo="/" expanded={sidebarState.expanded}>
          <House/>
        </SideNavItem>
      </nav>
      <div class="w-full ">
        <slot />
      </div>
</div>