<script lang="ts">
    import type { PageProps } from './$types';
    import { onMount } from 'svelte';
    import { Toaster } from 'svelte-5-french-toast';
    import { DiamondPercent, MessageSquareMore, Sticker } from '@lucide/svelte';
    import DadJokeBox from '$components/DadJokeBox.svelte';
    import CompleteProfileModal from '$components/CompleteProfileModal.svelte';
    import AnnouncementsCard from '$components/AnnouncementsCard.svelte';
    import GameShortcutCard from '$components/GameShortcutCard.svelte';
    import LeaderboardTeaserCard from '$components/LeaderboardTeaserCard.svelte';

    let { data }: PageProps = $props();
    let { userProfile, bestRecord, rank, topScore, gamesPlayed } = $derived(data);

    let completeProfileModal = $state(false);

    onMount(()=>{
        if(!userProfile){
            completeProfileModal = true;
        }
    })
</script>

<svelte:head>
    <title>Dashboard</title>
</svelte:head>
<Toaster />

<section class="w-full h-fit flex flex-col space-y-5">
    <div>
        <h1 class="text-3xl lg:text-4xl font-semibold">Welcome back{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}</h1>
        <p class="text-base-content/70">Here's what's happening in Calderra.</p>
    </div>

    <AnnouncementsCard />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GameShortcutCard title="Memory Cards" description="Flip, match, beat the clock." href="/memory-card">
            <Sticker/>
        </GameShortcutCard>
        <GameShortcutCard title="Ping Pong" description="Solo vs CPU or challenge a friend." href="/ping-pong">
            <DiamondPercent/>
        </GameShortcutCard>
        <GameShortcutCard title="Skaros Rock" description="Hang out in the chat room." href="/chat-room">
            <MessageSquareMore/>
        </GameShortcutCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="order-2 lg:order-1">
            <LeaderboardTeaserCard {bestRecord} {rank} {topScore} {gamesPlayed} />
        </div>
        <div class="order-1 lg:order-2">
            <DadJokeBox/>
        </div>
    </div>
</section>

<div>
    {#if completeProfileModal}
    <CompleteProfileModal {userProfile} bind:IsVisible={completeProfileModal} />
    {/if}
</div>
