<script lang="ts">
    import type { PageProps } from './$types';
    import Github from '$components/svg/Github.svelte';
    let { data }: PageProps = $props();
    let password: string = $state(''); 
    let email: string = $state('');
    let errorText: string = $state('');
    let loginProcessing: boolean = $state(false);

    function githubSignIn() {
        console.log('github sign in');
    }
    function emailSignIn() {
        console.log('email sign in');
    }
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>
<section
	class="misty-waves h-fit min-h-screen flex items-center justify-center w-full"
>
	<div
		class="w-full min-w-fit max-w-xl h-fit flex items-center flex-col space-y-5 my-32 mx-5 pt-10 pb-5 rounded-xl"
	>
		<h1 class="text-center text-3xl font-bold text-gray-200 mb-5">Log in to your account</h1>
		<div class="w-full px-5">
			<button
				class="btn bg-white hover:bg-accent rounded-lg text-gray-900 w-full"
				onclick={() => {
					githubSignIn();
				}}>Continue with Github
				<Github classNames="w-5 h-5" />
				</button
			>
		</div>
		<div class="divider px-5 info">or</div>
		<p class="text-center font-semibold text-gray-200">
			Enter your email and password to log in to your account
		</p>
		<form
			class="flex flex-col space-y-7 px-5 mt-10 w-full"
			method="post"
            
			onsubmit={(e) => {
                e.preventDefault();
				emailSignIn();
			}}
		>
			<label class="input validator w-full bg-black">
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
            <input class="focus:ring-0 bg-black" type="email" placeholder="mail@site.com" required />
            </label>
            <div class="validator-hint hidden">Enter valid email address</div>

            <label class="input bg-black w-full validator">
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
                class="focus:ring-0 bg-black"
                type="password"
                required
                placeholder="Password"
                minlength="8"
                title="Must be more than 8 characters, including number(s) and uppercase letter"
            />
            </label>
            <p class="validator-hint hidden">
            Must be more than 8 characters, including
            <br />At least one number <br />At least one uppercase letter
            </p>

			<div class="flex justify-between items-center">
				<p class="text-red-600 text-sm">{errorText}</p>
				<button
					class="btn morningGreen solid ml-auto {loginProcessing
						? 'is-loading'
						: ''}">Login</button
				>
			</div>
		</form>
	</div>
</section>
