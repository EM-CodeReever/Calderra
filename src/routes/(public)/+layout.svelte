<script>
    import { goto } from "$app/navigation";
    import { AppWindow, Menu, House, CircleQuestionMark, ClipboardPen} from "@lucide/svelte";
    let { children } = $props();
  </script>
  
  <nav class=" fixed w-full top-0 bg-base-300 px-3 flex justify-center h-20 z-50" >
    <div class="w-full max-w-6xl h-full flex justify-between">
        <div class="flex space-x-2 items-center pl-2 lg:p-0">
            <img src="/calderra_logo_rounded.png" alt="Calderra logo" class="w-9 h-9">
            <a href="/" class=" font-extrabold text-2xl lg:text-2xl text-base-content -mb-2">Calderra</a>
        </div>
        <ul class="hidden lg:flex text-base-content">
            <li class="h-full flex items-center px-5 duration-300 hover:text-secondary">
                <a href="/" class="font-bold">Home</a>
            </li>
            <li class="h-full flex items-center px-5 marker:duration-300 hover:text-secondary">
                <a href="/about" class="font-bold">About</a>
            </li>
            <li class="h-full flex items-center px-5 duration-300 hover:text-secondary">
                <a href="/register" class="font-bold">Register</a>
            </li>
        </ul>
        <div class="hidden lg:flex items-center">
            <button class="btn btn-primary" onclick={()=>{goto('dashboard')}}>
                <AppWindow size="20" />
                Open Application</button>
        </div>
        <div class="flex justify-center items-center lg:hidden">
            <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-soft m-1 btn-primary"><Menu size="20" /></div>
            <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm flex flex-col space-y-1">
                <li>
                    <a href="/" class="item text flex space-x-5 justify-center items-center" tabindex="-1">
                        <House size="20" />
                        Home
                    </a>
                </li>
                <li>
                    <a href="/about" class="item text flex space-x-5 justify-center items-center" tabindex="-1">
                        <CircleQuestionMark size="20" />
                        About
                    </a>
                </li>
                <li>
                    <a href="/register" class="item flex space-x-5 justify-center items-center" tabindex="-1">
                        <ClipboardPen size="20" />
                        Register
                    </a>
                </li>
                <!-- for mobile... i repeat FOR MOBILE.... ELLIOT THIS BUTTON IS ONLY SEEN ON MOBILE -->
                    <button class="btn btn-soft btn-primary" onclick={()=>{goto('dashboard')}}>
                        <AppWindow size="20" />
                        Open Application</button>
            </ul>
            </div>
        </div>
    </div>
</nav>
    {@render children()}

<footer class="h-fit w-full text-sm flex p-4 justify-between text-base-content bg-base-300">
    
    <span>
        Calderra &copy; 2026. All rights reserved.
    </span>
    <!-- <span class="space-x-3">
        <a href="/about" class="link">About</a>
        <a href="/contact" class="link">Contact</a>
        <a href="/register" class="link">Signup</a>
    </span> -->
    <span>
        <a href="https://elliotmorrisonbusiness.com/" target="_blank" class="link text-sm">Elliot Morrison Business</a>
    </span>
    
    
</footer>