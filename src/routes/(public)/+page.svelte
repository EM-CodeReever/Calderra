<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { cubicIn, cubicOut } from "svelte/easing";
  import { fly, blur, fade } from "svelte/transition";
  import { waveBgClass, showcaseBgClass, isBespokeWaveTheme } from '$lib/state/theme.svelte.js';
  import { inview } from "svelte-inview";
  import type {
    ObserverEventDetails,
    ScrollDirection,
    Options,
  } from "svelte-inview";
    import Svelte from "$components/svg/Svelte.svelte";
    import Tailwind from "$components/svg/Tailwind.svelte";
    import Typescript from "$components/svg/Typescript.svelte";
    import Supabase from "$components/svg/Supabase.svelte";
    import Haikei from "$components/svg/Haikei.svelte";
    import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
    import '@splidejs/splide/dist/css/themes/splide-default.min.css';
  import { DiamondPercent, LogIn, MessageSquareMore, Sticker, UserPlus } from "@lucide/svelte";

  let sectionOneINVIEW = $state(false);
  let sectionTwoINVIEW = $state(false);

  // Add more entries here to feature more projects in the showcase carousel.
  const showcaseProjects = [
    {
      title: "Ping-Pong",
      description: "A simple game of ping pong, built with HTML Canvas. Play solo against the CPU or grab a friend for real-time matches.",
      icon: DiamondPercent,
      href: "/ping-pong",
    },
    {
      title: "Memory Cards",
      description: "Flip cards to find matching pairs. Clear the board as fast as you can and climb the leaderboard.",
      icon: Sticker,
      href: "/memory-card",
    },
    {
      title: "Skaros Rock",
      description: "A chat room for hanging out with friends. Global chat is up and running, with private rooms on the way.",
      icon: MessageSquareMore,
      href: "/chat-room",
    },
  ];

  let show = $state(false);
  onMount(() => {
    show = true;
  });

  const options: Options = {
    rootMargin: "-20%",
    unobserveOnEnter: true,
  };

  function handleSectionOneInviewChange(event: CustomEvent<ObserverEventDetails>) {
    sectionOneINVIEW = event.detail.inView;
  }

  function handleSectionTwoInviewChange(event: CustomEvent<ObserverEventDetails>) {
    sectionTwoINVIEW = event.detail.inView;
  }
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>
<div class="relative isolate">
{#if !isBespokeWaveTheme()}
<div class="absolute inset-0 -z-10 wave-fallback-gradient"></div>
{/if}
<section class="w-full relative isolate {isBespokeWaveTheme() ? 'text-base-content' : 'text-primary-content'} h-screen">
  <div class="absolute inset-0 z-0 {isBespokeWaveTheme() ? waveBgClass('top') : 'page-mask-below'}"></div>
  {#if show}
    <div
      class="relative z-10 flex space-y-8 justify-center items-center flex-col h-screen"
      in:fly={{ duration: 1000, y: 100, opacity: 0.3, easing: cubicOut }}
    >
      <h1 class="font-bold lg:text-4xl xl:text-5xl text-3xl">
        Work in Progress!
      </h1>
      <p class="px-5 max-w-lg text-center text-sm lg:text-base">
        This website is currently a work in progress, and will be fully functional by the end of the year. In the meantime, feel free to check out the github repo and explore the codebase! <br /> https://github.com/EM-CodeReever/Calderra
      </p>
      <span
        class="flex space-x-3"
        in:fade={{ duration: 800, easing: cubicOut, delay: 500 }}
      >
        <button
          class="btn btn-base-100 btn-lg  rounded-lg"
          onclick={() => {
            goto("register");
          }}>Create an account
          <UserPlus />
          </button
        >
        <button
          class="btn btn-lg {isBespokeWaveTheme() ? 'btn-primary' : 'btn-accent'} rounded-lg"
          onclick={() => {
            goto("login");
          }}>
          Log in
          <LogIn size="24" />
          </button
        >
      </span>
    </div>
  {/if}
</section>

<section
  use:inview={options}
  oninview_change={handleSectionOneInviewChange}
  class="w-full flex flex-col space-y-5 justify-center items-center {showcaseBgClass()} {isBespokeWaveTheme() ? 'text-primary-content' : 'text-primary-content'} relative isolate"
  style="height: 30rem;"
>
  {#if sectionOneINVIEW}
    <p
      in:fly={{ duration: 1000, y: 500, opacity: 0.3, easing: cubicOut }}
      class="lg:text-4xl text-2xl px-5 font-bold text-center"
    >
      Calderra Project Showcase
    </p>
    <Splide options={ {
      rewind  : true,
      pauseOnHover: false,
      gap     : '1rem',
      autoplay: true,
      arrows  : false,
      height  : '22rem',
      

      // width   : '100%',

    } } hasTrack={ false } class="md:rounded-lg p-1 w-full md:max-w-2xl lg:max-w-4xl">
      <div style="position: relative">
        <SplideTrack >
            {#each showcaseProjects as project}
            <SplideSlide class="flex justify-center items-center p-3">
                <div class="flex flex-col items-center text-center space-y-3 max-w-md">
                    <div class="w-16 h-16 rounded-full bg-primary-content/15 flex items-center justify-center">
                        <project.icon size={32} />
                    </div>
                    <p class="text-2xl font-bold">{project.title}</p>
                    <p class="text-sm">{project.description}</p>
                    <button class="btn {isBespokeWaveTheme() ? 'btn-primary' : 'btn-accent'} rounded-lg" onclick={() => goto(project.href)}>
                        Check it out
                    </button>
                </div>
            </SplideSlide>
            {/each}
        </SplideTrack>
      </div>
  
      <div class="splide__progress mt-3">
        <div class="splide__progress__bar">
        </div>
      </div>
    </Splide>

    
    
    
  {/if}
</section>

<section
  use:inview={options}
  oninview_change={handleSectionTwoInviewChange}
  class="{isBespokeWaveTheme() ? 'text-base-content' : 'text-primary-content'} w-full flex flex-col space-y-10 justify-center items-center relative isolate"
  style="height: 60rem;"
>
  <div class="absolute inset-0 -z-10 {isBespokeWaveTheme() ? waveBgClass('below') : 'page-mask-top'}"></div>
  {#if sectionTwoINVIEW}
    <p
      in:fly={{ duration: 2000, y: 100, opacity: 0.3, easing: cubicOut }}
      class="lg:text-3xl text-lg px-5 font-bold text-center "
    >
      Tools used to build this website
    </p>
    <p
      in:fly={{ duration: 2000, y: 100, opacity: 0.3, easing: cubicOut }}
      class="max-w-3xl text-center mx-3"
    >
     Svelte is cool, Tailwind is super-cool, Typescript is cool, Supabase is cool, but I will always say Haikei is a slept on frontend design tool. 
     Daisy UI is the best CSS framework for rapid development, all the themes are gorgeous and it's so easy to customize and extend. 
     I used all of these tools to build this website, and I highly recommend checking them out if you're interested in web development!

    </p>
    <div class="md:flex md:justify-between gap-y-5 xs:gap-y-10 grid grid-rows-2 grid-cols-3 w-full max-w-3xl">
      <!-- svelte logo -->
      <div class="md:hover:scale-125 duration-100 flex justify-center items-center cursor-pointer" in:fly={{duration:800,opacity:0,y:200,easing:cubicOut}}>
        <Svelte />
      </div>
      <!-- tailwind logo -->
      <div class="md:hover:scale-125 duration-100 flex justify-center items-center cursor-pointer"  in:fly={{duration:800,opacity:0,y:200,easing:cubicOut,delay:100}}>
        <Tailwind />
      </div>
      <!-- typeScript logo -->
      <div class="md:hover:scale-125 duration-100 flex justify-center items-center cursor-pointer" in:fly={{duration:800,opacity:0,y:200,easing:cubicOut,delay:200}}>
        <Typescript />
      </div>
      <!-- supabase logo -->
      <div class="md:hover:scale-125 duration-100 flex justify-center items-center cursor-pointer" in:fly={{duration:800,opacity:0,y:200,easing:cubicOut,delay:300}}>
        <Supabase />
      </div>
      <!-- haikei logo -->
      <div class="md:hover:scale-125 duration-100 flex justify-center items-center cursor-pointer" in:fly={{duration:800,opacity:0,y:200,easing:cubicOut,delay:400}}>
        <Haikei />
      </div>
      <!-- Sira ui logo -->
      <div class="md:hover:scale-125 duration-100 flex justify-center items-center cursor-pointer" in:fly={{duration:800,opacity:0,y:200,easing:cubicOut,delay:500}}>
        <img src="https://img.daisyui.com/images/daisyui/mark-rotating.svg" alt="Daisy UI logo" class="w-20 h-20">
      </div>
    </div>
  {/if}

</section>
</div>

<style>
  .splide__progress__bar{
    background-color: #000;
  }
</style>
