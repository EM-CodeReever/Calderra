<script lang="ts">
    import { Goal } from '@lucide/svelte';
    import BackToFootballHome from '$components/football/BackToFootballHome.svelte';
</script>

<svelte:head>
    <title>How to Play - Football - Calderra</title>
</svelte:head>

<section class="w-full max-w-2xl mx-auto flex flex-col space-y-6">
    <div class="flex items-center justify-between">
        <BackToFootballHome />
    </div>

    <div>
        <h1 class="text-3xl font-bold flex items-center gap-2"><Goal /> How to Play</h1>
        <p class="text-base-content/70">Everything you need to know to build a squad and start winning matches.</p>
    </div>

    <div class="card bg-base-200 p-5 space-y-2">
        <h2 class="text-lg font-semibold">What is this?</h2>
        <p class="text-sm text-base-content/80">
            A stat-based 7-a-side football manager. You build a squad of fictional players, pick a formation,
            and set matches in motion — each one simulates automatically with a live pitch view and text
            commentary, like watching a match unfold rather than controlling it directly. You still get a say:
            you can make a substitution at halftime before the second half plays out.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Your Squad</h2>
        <p class="text-sm text-base-content/80">
            When you create a team you design one custom "star" player from scratch — name, position, personality,
            and 20 points to distribute across their attributes. The other 14 players in your 15-man squad are
            generated automatically so you can kick off right away; you can replace them over time via the
            transfer market.
        </p>
        <p class="text-sm text-base-content/80">Every player has exactly 3 attributes, based on position:</p>
        <ul class="text-sm text-base-content/80 list-disc list-inside space-y-1">
            <li><b>Forwards:</b> Finishing, Trickery, Timing</li>
            <li><b>Midfielders:</b> Control, Passing, Vision</li>
            <li><b>Defenders:</b> Tackling, Disruption, Positioning</li>
            <li><b>Goalkeepers:</b> Reflexes, Handling, Distribution</li>
        </ul>
        <p class="text-sm text-base-content/80">
            Every player also has a <b>personality</b> — Focused, Inconsistent, Rash, Overconfident, Clutch, or Leader.
            It doesn't change their raw stats, but it shapes how their performance swings from match to match
            (see Form below) and how often they pick up cards.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Formation & Lineup</h2>
        <p class="text-sm text-base-content/80">
            It's 7-a-side: 1 goalkeeper plus 6 outfield players, split across defense, midfield, and attack
            however you like (e.g. 3-2-1, 2-2-2, 1-2-3). Pick your formation on the Squad page, then tap each
            slot on the pitch to assign a player to it. Anyone not in your starting 7 sits on the bench and is
            available to sub on at halftime.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Playing a Match</h2>
        <p class="text-sm text-base-content/80">
            Kick off against a pre-built AI team or challenge another manager. The first half plays out
            automatically the moment the match starts — watch the pitch and commentary feed to follow along,
            or hit Skip Ahead to jump to the end.
        </p>
        <p class="text-sm text-base-content/80">
            At halftime you can make one substitution (or leave your lineup as it is) before the second half
            kicks off. Against an AI opponent, they respond instantly and the second half starts right away.
            Against another manager, the second half only kicks off once <b>both</b> of you have made your
            halftime move — if you're waiting on them, the match page will let you know and pick it up
            automatically once they've moved.
        </p>
        <p class="text-sm text-base-content/80">
            Watch for goals — they get a big on-screen celebration — and for yellow/red cards, which are more
            common for Rash players.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Form &amp; Stamina</h2>
        <p class="text-sm text-base-content/80">
            Every player gets a random <b>form</b> roll at the start of each match (poor / normal / on fire),
            which modestly boosts or dampens their attributes for that game. Personality shapes how consistent
            that roll tends to be — Focused players are steadier, Inconsistent players swing harder.
        </p>
        <p class="text-sm text-base-content/80">
            <b>Stamina</b> only exists during a match — it starts full and drains as the game goes on, softly
            reducing a tired player's effectiveness. It has no effect outside of matches and doesn't carry over
            between games.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Progression</h2>
        <p class="text-sm text-base-content/80">
            Players earn XP for playing, with bonuses for goals, assists, and clean sheets. Leveling up grants
            stat points you can spend on that player's attributes from the Squad page. Matches against other
            managers award full XP; AI matches award half — a lower-stakes way to grind without needing to
            find an opponent.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Transfer Market</h2>
        <p class="text-sm text-base-content/80">
            Every team starts with a credit budget. Sign free-agent players (including ones added by admins)
            from the Transfer Market to strengthen your squad.
        </p>
        <p class="text-sm text-base-content/80">
            You can also sell your own players — including your original star, if you want a change. List a
            player at a price of your choosing (you can edit it or take it off the market any time before
            someone buys), <b>Quick Sell</b> for an instant but lower guaranteed payout, or <b>Release</b> them
            for free. Any of these free up a squad slot for a new signing. A player has to be off your starting
            lineup before you can sell or release them.
        </p>
    </div>

    <div class="card bg-base-200 p-5 space-y-3">
        <h2 class="text-lg font-semibold">Multiplayer</h2>
        <p class="text-sm text-base-content/80">
            Head to Challenges to send a match request to another manager, or respond to one you've received.
            Once accepted, the match kicks off immediately — same flow as an AI match, except halftime waits
            for both of you.
        </p>
        <p class="text-sm text-base-content/80">
            A full League mode (round-robin, up to 10 teams) is coming soon — for now, Challenges are the way
            to play other managers.
        </p>
    </div>
</section>
