<script lang="ts">
    import type { PageProps } from './$types';
    import Github from '$components/svg/Github.svelte';
  import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
  import { goto } from '$app/navigation';
    let { data }: PageProps = $props();
    let password: string = $state('');
    let email: string = $state('');
    let errorText: string = $state('');
    let loginProcessing: boolean = $state(false);

    function githubSignIn() {
        console.log('github sign in');
    }

    let supabase = $derived(data.supabase);
    // ---cut---
    async function signInWithEmail() {
        loginProcessing = true;
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) {
            errorText = error.message;
            console.error('Error signing in:', error);
            loginProcessing = false;
        } else {
            console.log('Successfully signed in');
            goto("/dashboard");
        }
    }
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>
<section class="bg-base-100 min-h-screen flex items-center justify-center w-full px-5 py-16">
	<div class="card bg-base-200 shadow-xl w-full max-w-md">
		<div class="card-body space-y-5">
			<h1 class="text-center text-3xl font-bold">Log in to your account</h1>

			<button
				class="btn bg-base-content hover:bg-base-content/80 text-base-300 rounded-lg w-full"
				onclick={() => {
					githubSignIn();
				}}>
				<Github classNames="w-5 h-5" />
				Continue with Github
			</button>

			<div class="divider">or</div>

			<p class="text-center font-semibold">
				Enter your email and password to log in
			</p>
			<form
				class="flex flex-col space-y-5 w-full"
				method="post"
				onsubmit={(e) => {
                e.preventDefault();
					signInWithEmail();
				}}
			>
				<label class="input input-primary validator w-full">
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
            <input class="focus:ring-0 placeholder:text-base-content/50" type="email" placeholder="mail@site.com" bind:value={email} required />
            </label>
            <div class="validator-hint hidden -mt-4">Enter valid email address</div>

            <label class="input input-primary w-full">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="currentColor"
                >
                <path
                    d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
                ></path>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                </g>
            </svg>
            <input
                class="focus:ring-0 placeholder:text-base-content/50"
                type="password"
                required
                placeholder="Password"
                minlength="8"
                bind:value={password}
            />
            </label>

				<p class="text-error text-sm min-h-5">{errorText}</p>
				<button class="btn btn-primary w-full" disabled={loginProcessing}>
                    {#if loginProcessing}
                    <span class="loading loading-spinner"></span>
                    {/if}
                    {loginProcessing ? 'Logging in...' : 'Log In'}
                </button>
			</form>
	</div>
	</div>
</section>
