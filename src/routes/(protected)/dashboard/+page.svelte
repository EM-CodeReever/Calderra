<script lang="ts">
    import type { PageData } from '../dashboard/$types';
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-5-french-toast';
    import { page } from "$app/state";  
    import { Club, DiamondPercent, House, LogOut, MessageSquareMore, Settings } from '@lucide/svelte';
  import RiddleBox from '$components/RiddleBox.svelte';
  import CompleteProfileModal from '$components/CompleteProfileModal.svelte';
    let { supabase, userProfile }: PageData = $props();


    let currentPath = $state(page.route.id);


    let completeProfileModal = $state(false);
    let triggerContentLoadInAnimation = $state(false);
    
    console.log(currentPath);

    onMount(()=>{
        triggerContentLoadInAnimation = true;
        if(!userProfile){
            completeProfileModal = true;
        }
    })


</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>
<Toaster />

<section class="w-full h-fit">
    <RiddleBox/>
</section>



  <div>
    {#if completeProfileModal}
      <CompleteProfileModal {userProfile} bind:IsVisible={completeProfileModal} />
    {/if}
  </div>

