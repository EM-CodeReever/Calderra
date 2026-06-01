<script lang="ts">
  import { goto } from "$app/navigation";
  import { Club, DiamondPercent, House, ListOrdered, LogOut, Menu, MessageSquareMore, Settings, Sticker, SquareMenu } from "@lucide/svelte";
  import SideNavbar from "./SideNavbar.svelte";
  import SideNavItem from "./SideNavItem.svelte";
  import Project from "./svg/Project.svelte";
  // export let userProfile;
  // export let supabase;

  function toggleDrawer(name:string) {
      let element = document.getElementById(`drawer-${name}`);
      if (element?.classList.contains('show')) {
          element?.classList.remove('show');
      } else {
          element?.classList.add('show');
      }
    }

</script>


<div class="drawer">
  <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col">
    <!-- Navbar -->
    <div class="navbar bg-none p-0 flex justify-between items-center">
      
      <div class="flex space-x-1 items-center">
      <div class="flex-none lg:hidden">
        <label for="my-drawer-2" aria-label="open sidebar" class="btn btn-ghost btn-secondary">
          <Menu size="26" />
        </label>
      </div>
        <img
            src="/calderra_logo_rounded.png"
            alt="Calderra logo"
            class="w-10 h-10 hidden sm:flex -mt-3"
          />
          <a
            href="/dashboard"
            class="px-2 py-0.5 rounded-md font-extrabold text-2xl lg:text-3xl text-gray-200"
            >Calderra</a
          >
      </div>
      <div class="flex-none ">
        <label
          class="flex space-x-3 p-3 rounded-2xl cursor-pointer hover:bg-secondary/50 duration-200"
          tabindex="0"
        >
          <div class="flex flex-col">
            <p class="font-semibold">testuser</p>
            <p class="text-xs font-thin">test@example.com</p>
          </div>
          <div class="avatar">
            <div class="w-10 rounded-xl ring-secondary ring-2">
              <img src="https://robohash.org/random" />
            </div>
        </div>
        </label>
      </div>
    </div>
  </div>
  <div class="drawer-side">
    <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu bg-base-200 min-h-full w-80 p-4">
      <!-- Sidebar content here -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <label class="btn btn-neutral absolute right-3 top-3" onclick={()=>{toggleDrawer('left')}}>✕</label>
      <div class="flex items-center justify-center">
        <a href="/dashboard" class="bg-oxfordBlue-600 px-2 py-0.5 rounded-md font-extrabold text-2xl lg:text-2xl text-gray-200">Calderra</a>
      </div>
      <SideNavItem title="Dashboard" linkTo="/dashboard">
        <Project/>
    </SideNavItem>
    <SideNavItem title="Ping Pong" linkTo="/ping-pong">
      <DiamondPercent/>
    </SideNavItem>
    <SideNavItem title="Memory Cards"  linkTo="/memory-card">
        <Sticker/>
    </SideNavItem>
    <SideNavItem title="Regalore" linkTo="/chat-room">
      <MessageSquareMore/>
    </SideNavItem>
    <SideNavItem title="Leaderboard" linkTo="/leaderboard">
      <ListOrdered/>
    </SideNavItem>
    <SideNavItem title="Homepage" linkTo="/">
      <House/>
    </SideNavItem>
    </ul>
  </div>
</div>