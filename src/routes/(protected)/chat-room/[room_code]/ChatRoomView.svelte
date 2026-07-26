<script lang="ts">
    import type { PageData } from './$types';
    import PartySocket from "partysocket";
    import { SendHorizontal, LogOut, Copy, Check, House } from '@lucide/svelte';
    import { onDestroy, onMount, tick } from 'svelte';
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import ChatMessage from '$components/ChatMessage.svelte';

    let { data }: { data: PageData } = $props();

    let codeCopied = $state(false);

    function copyRoomCode() {
        navigator.clipboard.writeText(data.room.code).then(() => {
            codeCopied = true;
            setTimeout(() => { codeCopied = false; }, 1500);
        });
    }

    type Message = {
        id: string;
        content: string;
        sentAt: string;
        username: string;
        avatar?: string | null;
        profileId: string;
    };

    let messages = $state<Message[]>(data.messages as Message[]);
    let messageInput = $state('');
    let scrollEl: HTMLDivElement;
    let inputEl: HTMLInputElement;

    const myProfileId = data.userProfile?.id ? String(data.userProfile.id) : null;
    const myUsername = data.userProfile?.username ?? 'You';
    const myAvatar = data.userProfile?.avatar || `https://robohash.org/${myUsername}`;

    async function scrollToBottom() {
        await tick();
        scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    }

    onMount(() => {
        scrollToBottom();
    });

    const host = import.meta.env.VITE_PARTYKIT_HOST ?? "https://calderra-party.em-codereever.partykit.dev";

    // No custom `id` here — each tab/connection should get its own unique
    // PartyKit connection id. Reusing the username would collapse multiple
    // simultaneous connections from the same user into one, which breaks the
    // server's broadcast-excludes-sender logic for anyone with 2+ tabs open.
    const partySocket = new PartySocket({
        host,
        room: data.room.code,
    });

    partySocket.addEventListener("message", (e) => {
        try {
            const payload = JSON.parse(e.data);
            if (payload.type === 'message') {
                messages = [
                    ...messages,
                    {
                        id: crypto.randomUUID(),
                        content: payload.content,
                        sentAt: payload.sentAt,
                        username: payload.username,
                        avatar: payload.avatar,
                        profileId: payload.profileId ?? '',
                    },
                ];
                scrollToBottom();
            }
        } catch {
            // ignore malformed payloads
        }
    });

    onDestroy(() => {
        partySocket.close();
    });

    function sendMessage() {
        const content = messageInput.trim();
        if (!content) return;

        const sentAt = new Date().toISOString();

        // optimistic local append
        messages = [
            ...messages,
            { id: crypto.randomUUID(), content, sentAt, username: myUsername, avatar: myAvatar, profileId: myProfileId ?? '' },
        ];
        scrollToBottom();

        partySocket.send(JSON.stringify({
            type: 'message',
            username: myUsername,
            avatar: myAvatar,
            content,
            sentAt,
            profileId: myProfileId,
        }));

        fetch(`/chat-room/${data.room.code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        }).catch(() => {});

        messageInput = '';
        inputEl?.focus();
    }
</script>

<section class="w-full h-fit flex flex-col">
    <div class="w-full flex justify-between items-center mb-3 gap-3">
        <div class="flex flex-col min-w-0">
            <p class="text-2xl font-bold text-base-content truncate">{data.room.name}</p>
            {#if !data.room.isGlobal}
            <span class="text-sm text-base-content/60 flex items-center gap-1 flex-wrap">
                Code: {data.room.code}
                <button class="btn btn-ghost btn-xs" onclick={copyRoomCode} title="Copy room code">
                    {#if codeCopied}
                    <Check size="14" class="text-success" />
                    {:else}
                    <Copy size="14" />
                    {/if}
                </button>
                {#if data.room.ownerUsername}• Owner: {data.room.ownerUsername}{/if}
            </span>
            {/if}
        </div>
        <div class="flex items-center gap-2 shrink-0">
            <button class="btn btn-ghost btn-sm" onclick={()=>{ goto('/chat-room') }}>
                <House size="16" />
                Chat Home
            </button>
            {#if !data.room.isGlobal}
            <form method="POST" action="?/leaveRoom" use:enhance>
                <button class="btn btn-error btn-sm" type="submit">
                    <LogOut size="16" />
                    Leave Room
                </button>
            </form>
            {/if}
        </div>
    </div>

    <div bind:this={scrollEl} class="bg-base-100 flex flex-col gap-3 px-3 py-2 rounded-xl overflow-y-auto w-full h-[calc(100vh-15.5rem)] border border-base-300">
        {#each messages as message (message.id)}
        <ChatMessage
            username={message.username}
            avatar={message.avatar}
            content={message.content}
            sentAt={message.sentAt}
            self={message.profileId === myProfileId}
        />
        {:else}
        <div class="flex-1 flex items-center justify-center text-base-content/50 text-sm">
            No messages yet — say hello!
        </div>
        {/each}
    </div>

    <form class="flex items-center relative mt-3" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <div class="join w-full">
            <label class="input w-full join-item">
                <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </g>
                </svg>
                <input bind:this={inputEl} class="w-full ring-0 focus:ring-0" type="text" placeholder="Type a message" bind:value={messageInput} />
            </label>
            <button type="submit" class="btn btn-primary btn-soft join-item">
                <SendHorizontal />
            </button>
        </div>
    </form>
</section>
