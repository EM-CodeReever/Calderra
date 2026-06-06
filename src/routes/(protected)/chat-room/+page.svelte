<script lang="ts">
    import Badge from '$components/Badge.svelte';
    import LabelledInput from '$components/LabelledInput.svelte';
  import { Globe, SquarePlus, ArrowBigRightDash } from '@lucide/svelte';
    import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
    
    let roomCode = '';
    let errorText = '';
</script>
<svelte:head>
    <title>Calderra - Chat Room</title>
</svelte:head>
<section class="w-full flex flex-col justify-center items-center space-y-16">
    <span class="flex flex-col items-center space-y-3 ">
        <script src="https://cdn.lordicon.com/lordicon.js"></script>
        <lord-icon
            src="https://cdn.lordicon.com/jdgfsfzr.json"
            trigger="loop"
            colors="primary:#ffffff,secondary:#107c91"
            style="width:200px;height:200px">
        </lord-icon>
        <h1 class="text-5xl font-semibold">Chat Room</h1>
        <p class="max-w-sm text-center">Join a Chat Room and talk to other users! Global chat is open to all but other rooms require a code</p>
    </span>
    <div class="flex flex-col justify-center items-center space-y-3 w-full max-w-md">
        <span class="flex flex-col justify-center items-center space-y-4 w-full max-w-md">
            <button class="btn btn-secondary flex-grow w-full max-w-md" onclick={()=>{goto('/chat-room/global')}}>Join Global Chat
                <Globe size="20" />
            </button>
            <button class="btn btn-primary flex-grow w-full max-w-md" disabled>Create a room
                <SquarePlus size="20" />
            </button>

        </span>
        <div class="divider info max-w-md">or</div>
        <form class="grid w-full max-w-md gap-y-3 grid-cols-1" onsubmit={(e)=>{
            e.preventDefault();
            goto(`/chat-room/${roomCode}`)}}>
            <input type="text" class="input placeholder:text-gray-300 w-full" name="room_code" placeholder="Enter a room code" bind:value={roomCode} />
            <button type="submit" class="btn btn-primary flex-grow w-full max-w-md">Join Room 
                <ArrowBigRightDash />
            </button>
            <p class="text-orangeWeb-800  text-center">{errorText}</p>
        </form>
    </div>
</section>