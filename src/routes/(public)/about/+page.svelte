<script lang="ts">
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { goto } from "$app/navigation";
    import { DiamondPercent, LogIn, MessageSquareMore, Sticker, UserPlus } from "@lucide/svelte";

    let showContent = $state(false);
    onMount(() => {
        showContent = true;
    });

    const features = [
        {
            title: "Memory Cards",
            description: "A classic flip-and-match game with a live leaderboard for the fastest, most efficient runs.",
            icon: Sticker,
        },
        {
            title: "Ping Pong",
            description: "Play solo against the CPU or challenge a friend in real time.",
            icon: DiamondPercent,
        },
        {
            title: "Skaros Rock",
            description: "A chat room for hanging out with friends while you play.",
            icon: MessageSquareMore,
        },
    ];
</script>
<svelte:head>
    <title>About</title>
</svelte:head>

<div class="w-full min-h-screen bg-base-100 text-base-content flex flex-col items-center px-5 py-20 space-y-20">
    {#if showContent}
    <div class="w-full max-w-2xl" in:fly={{duration:800,y:-40,opacity:0,easing:cubicOut}}>
        <h1 class="text-4xl text-center font-bold mb-5">About Calderra</h1>
        <p class="text-center">
            Calderra is a collection of hobby projects and experiments built for fun and to share with friends. It started as a way to try out new ideas in web development, and has slowly grown into a small handful of games and tools all living under one roof.
        </p>
        <p class="text-center mt-3">
            This version is a ground-up rebuild of an earlier attempt, upgraded to a newer stack from scratch.
        </p>
    </div>

    <div class="w-full max-w-4xl" in:fade={{duration:600,delay:150}}>
        <h2 class="text-2xl lg:text-3xl font-bold text-center mb-10">What's inside</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {#each features as feature}
            <div class="card bg-base-200 rounded-xl p-5 flex flex-col items-start space-y-2">
                <div class="w-10 h-10 flex items-center justify-center text-primary">
                    <feature.icon />
                </div>
                <p class="text-lg font-semibold">{feature.title}</p>
                <p class="text-sm text-base-content/70">{feature.description}</p>
            </div>
            {/each}
        </div>
    </div>

    <div class="w-full max-w-xl flex flex-col items-center space-y-6" in:fade={{duration:600,delay:300}}>
        <p class="text-center">
            Built with SvelteKit, Tailwind and daisyUI on the frontend, Prisma and Postgres for data, and Supabase for auth — with a bit of PartyKit sprinkled in for anything real-time.
        </p>
        <span class="flex space-x-3">
            <button class="btn btn-outline btn-lg rounded-lg" onclick={() => { goto("/register"); }}>
                Create an account
                <UserPlus />
            </button>
            <button class="btn btn-lg btn-primary rounded-lg" onclick={() => { goto("/login"); }}>
                Log in
                <LogIn size="24" />
            </button>
        </span>
    </div>
    {/if}
</div>
