<script lang="ts">
    import { fade, fly } from 'svelte/transition';
      import type { LayoutData } from '../$types';
    let { supabase }: LayoutData = $props();
    import z from 'zod';
    import { Gift } from '@lucide/svelte';
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

<section class="h-screen flex px-5 items-center justify-center">
    <!-- initail box -->
    {#if !next}
    <div class="w-full max-w-xl h-fit flex items-center flex-col space-y-5 px-3 pt-40 pb-10">
        <h1 class="text-center text-3xl font-bold text-base-content">Account Creation</h1>
        <p class="text-center font-semibold text-base-content">Create your Calderra account to access the dashboard and start building!</p>
        <div class="grid gap-3 grid-cols-4 px-5 w-full min-w-fit">
            <button class="btn btn-secondary text-secondary-content border-black grow w-full col-span-full" onclick={()=>{githubSignUp()}}>
                <svg aria-label="GitHub logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"></path></svg>
                Login with GitHub
            </button>
            <div class="divider col-span-full text-base-content">or</div>
                <p class="text-center font-semibold text-base-content col-span-full">Sign up with Email</p>
                <input class="focus:ring-0 placeholder:text-base-content/50! input text-base-content w-full col-span-full" type="email" placeholder="mail@site.com" bind:value={email} required />
                <input class="focus:ring-0 placeholder:text-base-content/50! input text-base-content w-full col-span-full" type="password" placeholder="Choose password" bind:value={password} required />
                <input class="focus:ring-0 placeholder:text-base-content/50!  input text-base-content w-full col-span-full" type="password" placeholder="Confirm password" bind:value={confirmPassword} required />

                <div class="flex col-span-4 justify-between items-center">
                    <p class="text-red-700">{errorText}</p>
                    <button class="btn btn-primary col-span-1 justify-self-end {registerProcessing
                        ? 'is-loading'
                        : ''}"
                    onclick={()=>{
                        emailSignup()
                        }}>Submit</button>
                </div>
        </div>
    </div>
    {/if}
    {#if next}
    <!-- next box -->
    <div in:fade={{ duration : 300, delay : 300 }} class="sm:w-full min-w-fit max-w-xl mx-3 h-fit flex items-center flex-col space-y-2 px-5 py-10 relative">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>          
        <h1 class="text-center text-3xl font-bold text-base-content m-0">Verify your account</h1>
        <p class="font-semibold text-center sm:w-96 text-base-content"> 
            Check your email for a link to complete your registration. you may close ths tab upon successfull verification
        </p>
        </div>
    {/if}
    </section>

    <style>
        input::placeholder {
      color: #e5e7ebbb;
      opacity: 1; /* Firefox */
    }
    </style>
