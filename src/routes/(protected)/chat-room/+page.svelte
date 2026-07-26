<script lang="ts">
    import { Globe, SquarePlus, ArrowBigRightDash, MessageSquareText } from '@lucide/svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { enhance } from '$app/forms';
    import { lordIconTheme } from '$lib/actions/lordIconTheme';
    import { themeState } from '$lib/state/theme.svelte';

    let { data, form }: { data: PageData; form: { error?: string } | null } = $props();

    let roomCode = $state('');
    let showCreateForm = $state(false);
    let creatingRoom = $state(false);
</script>
<svelte:head>
    <title>Calderra - Chat Room</title>
</svelte:head>
<div class="w-full max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-start gap-8">
    {#if data.rooms.length > 0}
    <div class="w-full lg:w-64 lg:shrink-0 lg:order-first lg:sticky lg:top-4">
        <h2 class="text-lg font-semibold mb-3">Your Rooms</h2>
        <div class="flex flex-col space-y-2">
            {#each data.rooms as room}
            <button
                class="btn btn-ghost justify-start w-full border border-base-300"
                onclick={()=>{ goto(`/chat-room/${room.code}`) }}
            >
                <MessageSquareText size="18" />
                <span class="flex-1 text-left truncate">{room.name}</span>
            </button>
            {/each}
        </div>
    </div>
    {/if}

    <section class="flex-1 flex flex-col justify-center items-center space-y-12">
        <span class="flex flex-col items-center space-y-3 ">
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
            <lord-icon
                src="https://cdn.lordicon.com/jdgfsfzr.json"
                trigger="loop"
                use:lordIconTheme={themeState.current}
                style="width:200px;height:200px">
            </lord-icon>
            <h1 class="text-5xl font-semibold">Skaros Rock</h1>
            <p class="max-w-sm text-center">Skaros Rock is a social chat platform where you can connect and talk to other users! Global chat is open to all but other rooms require a code</p>
        </span>

        <div class="flex flex-col justify-center items-center space-y-3 w-full max-w-md">
            <span class="flex flex-col sm:flex-row justify-center items-stretch gap-3 w-full">
                <button class="btn btn-secondary flex-1" onclick={()=>{goto('/chat-room/global')}}>Join Global Chat
                    <Globe size="20" />
                </button>
                <button class="btn btn-primary flex-1" onclick={()=>{showCreateForm = !showCreateForm}}>Create a room
                    <SquarePlus size="20" />
                </button>
            </span>

            {#if showCreateForm}
            <form
                class="w-full flex space-x-2"
                method="POST"
                action="?/createRoom"
                use:enhance={() => {
                    creatingRoom = true;
                    return async ({ update }) => {
                        creatingRoom = false;
                        // apply default behavior (follows the redirect on success,
                        // populates `form` with the error on failure)
                        await update();
                    };
                }}
            >
                <input type="text" name="name" class="input w-full" placeholder="Room name" required maxlength="40" />
                <button type="submit" class="btn btn-primary" disabled={creatingRoom}>
                    {#if creatingRoom}<span class="loading loading-spinner loading-sm"></span>{/if}
                    Create
                </button>
            </form>
            {#if form?.error}
            <p class="text-error text-sm">{form.error}</p>
            {/if}
            {/if}

            <div class="divider info max-w-md">or</div>
            <form class="grid w-full max-w-md gap-y-3 grid-cols-1" onsubmit={(e)=>{
                e.preventDefault();
                goto(`/chat-room/${roomCode}`)}}>
                <input type="text" class="input placeholder:text-gray-300 w-full" name="room_code" placeholder="Enter a room code" bind:value={roomCode} />
                <button type="submit" class="btn btn-primary flex-grow w-full max-w-md">Join Room
                    <ArrowBigRightDash />
                </button>
            </form>
        </div>
    </section>
</div>
