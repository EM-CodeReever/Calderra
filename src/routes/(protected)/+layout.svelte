<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import MainNavbar from "$components/MainNavbar.svelte";
    import SideNavbar from "$components/SideNavbar.svelte";
    let { children } = $props()
    // export let data;
    // let { session, supabase,userProfile } = data;
    // $: ({ session, supabase,userProfile } = data);
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

  <section class="flex flex-col misty-waves w-full h-fit min-h-screen p-5 screen-400:p-4">
    <MainNavbar/>
      <SideNavbar {currentPath}>
        {@render children()}
      </SideNavbar>
  </section>

  <!-- <RiddleBox/> -->
 