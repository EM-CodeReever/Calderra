<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import MainNavbar from "$components/MainNavbar.svelte";
    import SideNavbar from "$components/SideNavbar.svelte";
    import type { LayoutData } from './$types';
    let { data, children }: { data: LayoutData; children: any } = $props();
    let userProfile = $derived(data.userProfile);
    let currentPath = $derived(page.route.id);
  


    function toggleDrawer(name:string) {
      let element = document.getElementById(`drawer-${name}`);
      if (element?.classList.contains('show')) {
          element?.classList.remove('show');
      } else {
          element?.classList.add('show');
      }
    }

    function logOut(){
      // supabase.auth.signOut();
      goto("/");
    }

  </script>

  <section class="flex flex-col bg-base-300 w-full h-fit min-h-screen p-5 sm:p-4">
    <MainNavbar {userProfile} supabase={data.supabase}/>
      <SideNavbar {currentPath}>
        {@render children()}
      </SideNavbar>
  </section>

  <!-- <RiddleBox/> -->
 