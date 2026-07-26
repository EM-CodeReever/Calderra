<script lang="ts">
  let {
      username,
      avatar,
      content,
      sentAt,
      self = false,
  }: {
      username: string;
      avatar?: string | null;
      content: string;
      sentAt: string | Date;
      self?: boolean;
  } = $props();

  let time = $derived(
      new Date(sentAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  );
</script>

<div class="flex items-end gap-2 max-w-[85%] sm:max-w-[70%] {self ? 'self-end flex-row-reverse' : 'self-start'}">
    <div class="avatar shrink-0">
        <div class="w-8 h-8 rounded-full">
            <img src={avatar || `https://robohash.org/${username}`} alt="{username} avatar" />
        </div>
    </div>
    <div class="flex flex-col {self ? 'items-end' : 'items-start'}">
        {#if !self}
        <p class="text-xs text-base-content/50 mb-0.5 px-1">{username}</p>
        {/if}
        <div class="rounded-2xl px-4 py-2 {self ? 'bg-primary text-primary-content rounded-br-sm' : 'bg-base-200 rounded-bl-sm'}">
            <p class="text-sm wrap-break-word whitespace-pre-wrap">{content}</p>
        </div>
        <p class="text-[10px] text-base-content/40 mt-0.5 px-1">{time}</p>
    </div>
</div>
