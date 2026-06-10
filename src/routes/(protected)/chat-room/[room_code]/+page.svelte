<script lang="ts">
    import type { PageData, PageServerData } from './$types';
    import PartySocket from "partysocket";
    import { page } from "$app/stores";
  import { SendHorizonal, SendHorizonalIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { set } from 'zod';
  import type { LayoutData } from '../../$types';
    let messages:string[] = $state([]);
    let message = $state('');
    let element: HTMLDivElement
    let messageInput: HTMLInputElement
    let { data }: { data: LayoutData } = $props();
    // let {data}: { data: PageServerData } = $props();
    
    
    const scrollToBottom = async (node:HTMLDivElement) => {
        node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
    }; 

// connect to our server
const partySocket = new PartySocket({
  host: "https://calderra-party.em-codereever.partykit.dev",
//   host: "http://localhost:1999",
  room: "global",
  id: data.userProfile?.username as string, 
});

// print each incoming message from the server to console
partySocket.addEventListener("message", (e) => {
    console.log("Received message:", e.data);
    messages = [e.data,...messages];
});

partySocket.addEventListener("open", () => {
    console.log("Connected to party server!");
});


</script>

<svelte:head>
    <title>GlobalChat</title>
</svelte:head>

<section class="w-full h-fit">
    <div class="w-full flex justify-between">
       <div class="flex flex-col">
        {#if true}
            <p class="text-2xl font-bold text-base-content">Welcome to GlobalChat!</p>
        {:else if !true}
            <p class="text-2xl font-bold">GlobalChat</p>
            <p class="text-sm"> Owner: global</p>
            <p class="text-sm"> Code: global</p>
        {/if}
        
       </div>
       <button class="btn btn-error">
        Leave Room
       </button>
    </div>
    <div bind:this={element} class="bg-base-100 text-base-content flex flex-col-reverse px-3 rounded-xl overflow-y-auto my-3 bg-opacity-20 w-full h-[calc(100vh-15.5rem)]">
        {#each messages as message}
            <div class="w-full">
                <p>{message}</p>
            </div>
        {/each}
    </div>
    <form class="flex items-center relative">
        <div class="join w-full">
        <div class="w-full">
            <label class="input w-full join-item">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="currentColor"
                >
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </g>
            </svg>
            <input bind:this={messageInput} class="w-full ring-0 focus:ring-0" type="text" placeholder="Type a message" bind:value={message} />
            </label>
        </div>
        <button class="btn btn-primary btn-soft join-item" onclick={()=>{
            if(message != ''){
                console.log(message);
                partySocket.send(message)
                scrollToBottom(element);
                setTimeout(()=>{
                    messageInput?.focus();
                },1)
                message = "";
            }
            }}>
            <SendHorizonalIcon />
        </button>
        </div>
    </form>
</section>