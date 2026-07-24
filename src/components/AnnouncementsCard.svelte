<script lang="ts">
  type Announcement = { date: string; title: string; body: string };

  // Hand-edit this list whenever something new ships.
  const announcements: Announcement[] = [
      { date: "2026-07-24", title: "Collapsible sidebar", body: "The sidebar now collapses to icons-only and expands on hover or click — pick your favorite under Preferences." },
      { date: "2026-07-24", title: "Homepage & auth pages refresh", body: "Every theme now gets a seamless wave background on the homepage, plus a cleaner project showcase, About page, and matching login/register forms." },
      { date: "2026-07-24", title: "Dad jokes replace history facts", body: "Swapped the dashboard's \"on this day\" facts for a rotating dad joke — hit refresh for another." },
      { date: "2026-07-23", title: "New dashboard", body: "Rebuilt the dashboard with game shortcuts, a leaderboard teaser, and this announcements card." },
      { date: "2026-07-20", title: "Fresh theme backgrounds", body: "Added matching top/bottom backgrounds for the Silk theme, plus a few others." },
      { date: "2026-07-15", title: "Ping Pong now supports touch", body: "Fixed up Ping Pong and added touch controls for mobile/tablet play." },
      { date: "2026-07-05", title: "Skaros Rock chat room launched", body: "Global chat is live, with private rooms on the way." },
  ];
</script>

<div class="h-fit max-h-72 rounded-xl w-full p-5 flex flex-col text-base-content bg-base-200">
    <p class="text-2xl font-semibold mb-2">What's new</p>
    <ul class="space-y-3 overflow-y-auto">
        {#each announcements as { date, title, body }}
        <li>
            <p class="text-xs text-base-content/50">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            <p class="text-sm font-semibold">{title}</p>
            <p class="text-sm text-base-content/70">{body}</p>
        </li>
        {/each}
    </ul>
</div>
