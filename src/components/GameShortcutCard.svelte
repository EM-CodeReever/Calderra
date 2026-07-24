<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Snippet } from "svelte";

  let { title = "", description = "", href = "", children }: { title?: string; description?: string; href?: string; children?: Snippet } = $props();
</script>

<button
    class="card bg-base-200 border border-base-300 hover:border-primary hover:-translate-y-0.5 transition-all duration-200 rounded-xl p-5 flex flex-col items-start space-y-2 w-full text-left cursor-pointer"
    onclick={()=>{ goto(href) }}
>
    <div class="w-10 h-10 flex items-center justify-center text-primary">
        {@render children?.()}
    </div>
    <p class="text-lg font-semibold text-base-content">{title}</p>
    <p class="text-sm text-base-content/70">{description}</p>
</button>
