<script lang="ts">
    import { fade } from 'svelte/transition';
      import type { LayoutData } from '../$types';
    let { supabase }: LayoutData = $props();
    import z from 'zod';
    import Github from '$components/svg/Github.svelte';
    let next = $state(false);
    let email = $state("");
    let password = $state("");
    let registerProcessing = $state(false)
    let confirmPassword = $state("");
    let errorText = $state("");

    function validate(){
        let {success} = z.string().email().safeParse(email)
        if(!success){
            errorText = "Please enter a valid email"
            registerProcessing = false
            return false
        }
        if(password !== confirmPassword){
            errorText = "Passwords do not match"
            registerProcessing = false
            return false
        }
        let {success: success2} = z.string().min(8).safeParse(password)
        if(!success2){
            errorText = "Password must be at least 8 characters long"
            registerProcessing = false
            return false
        }
        // registerProcessing = false
        return true
    }

    let githubSignUp = async () => {
        await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
        })
    }
    let emailSignup = async () => {
        // registerProcessing = true
        //     if(!validate()){
        //     return
        //     }
        //     await supabase.auth.signUp({
        //         email,
        //         password,
        //     })
        //     next = true
        //     registerProcessing = false
    }
</script>
<svelte:head>
    <title>Register</title>
</svelte:head>

<section class="bg-base-100 min-h-screen flex items-center justify-center w-full px-5 py-16">
    {#if !next}
    <div class="card bg-base-200 shadow-xl w-full max-w-md">
        <div class="card-body space-y-5">
            <h1 class="text-center text-3xl font-bold">Create your account</h1>
            <p class="text-center font-semibold">Create your Calderra account to access the dashboard and start building!</p>

            <button
                class="btn bg-base-content hover:bg-base-content/80 text-base-300 rounded-lg w-full"
                onclick={()=>{githubSignUp()}}
            >
                <Github classNames="w-5 h-5" />
                Continue with Github
            </button>

            <div class="divider">or</div>

            <p class="text-center font-semibold">Sign up with email</p>
            <div class="flex flex-col space-y-5 w-full">
                <label class="input input-primary w-full">
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </g>
                    </svg>
                    <input class="focus:ring-0 placeholder:text-base-content/50" type="email" placeholder="mail@site.com" bind:value={email} required />
                </label>

                <label class="input input-primary w-full">
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </g>
                    </svg>
                    <input class="focus:ring-0 placeholder:text-base-content/50" type="password" placeholder="Choose password" bind:value={password} required minlength="8" />
                </label>

                <label class="input input-primary w-full">
                    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        </g>
                    </svg>
                    <input class="focus:ring-0 placeholder:text-base-content/50" type="password" placeholder="Confirm password" bind:value={confirmPassword} required minlength="8" />
                </label>

                <p class="text-error text-sm min-h-5">{errorText}</p>
                <button class="btn btn-primary w-full" disabled={registerProcessing} onclick={()=>{ emailSignup() }}>
                    {#if registerProcessing}
                    <span class="loading loading-spinner"></span>
                    {/if}
                    Submit
                </button>
            </div>
        </div>
    </div>
    {/if}
    {#if next}
    <div in:fade={{ duration: 300, delay: 300 }} class="card bg-base-200 shadow-xl w-full max-w-md">
        <div class="card-body items-center text-center space-y-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-primary">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <h1 class="text-3xl font-bold">Verify your account</h1>
            <p class="font-semibold">
                Check your email for a link to complete your registration. You may close this tab upon successful verification.
            </p>
        </div>
    </div>
    {/if}
</section>
