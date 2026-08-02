function pick<T>(rng: () => number, options: T[]): T {
    return options[Math.floor(rng() * options.length)];
}

export function buildupLine(rng: () => number, team: string): string {
    return pick(rng, [
        `${team} patiently work the ball around midfield.`,
        `${team} are probing for an opening.`,
        `A period of possession for ${team}.`,
        `${team} circulate the ball, looking for a way through.`,
    ]);
}

export function runSuccessLine(rng: () => number, player: string): string {
    return pick(rng, [
        `${player} makes a smart run into space!`,
        `${player} times the run to perfection!`,
        `${player} finds a pocket of space in behind!`,
    ]);
}

export function runFailLine(rng: () => number, player: string, defender: string): string {
    return pick(rng, [
        `${player}'s run is snuffed out by ${defender}.`,
        `${defender} reads the run well and cuts it out.`,
        `${defender} stays goal-side and shuts down ${player}.`,
    ]);
}

export function dribbleSuccessLine(rng: () => number, player: string, defender: string): string {
    return pick(rng, [
        `${player} skips past ${defender} with ease!`,
        `Brilliant footwork from ${player} leaves ${defender} for dead!`,
        `${player} shifts the ball and goes past ${defender}!`,
    ]);
}

export function dribbleFailLine(rng: () => number, player: string, defender: string): string {
    return pick(rng, [
        `${defender} dispossesses ${player}.`,
        `${player} is crowded out by ${defender} and loses control.`,
        `Good defending from ${defender} to win the ball off ${player}.`,
    ]);
}

export function goalLine(rng: () => number, player: string): string {
    return pick(rng, [
        `GOAL! ${player} finishes clinically!`,
        `${player} slots it home! What a strike!`,
        `${player} buries it in the corner! GOAL!`,
    ]);
}

export function savedLine(rng: () => number, gk: string, player: string): string {
    return pick(rng, [
        `${gk} makes a fantastic save from ${player}'s effort!`,
        `Great stop by ${gk}!`,
        `${gk} gets down well to deny ${player}!`,
    ]);
}

export function blockedLine(rng: () => number, defender: string, player: string): string {
    return pick(rng, [
        `${defender} throws their body on the line to block ${player}'s shot!`,
        `Brave block from ${defender}!`,
        `${defender} gets in the way and blocks it behind for a corner.`,
    ]);
}

export function offTargetLine(rng: () => number, player: string): string {
    return pick(rng, [
        `${player} drags the shot wide!`,
        `${player} blazes it over the bar!`,
        `${player} just can't keep the effort down.`,
    ]);
}

export function offsideLine(rng: () => number, player: string): string {
    return pick(rng, [
        `${player} times the run wrong and is flagged offside!`,
        `The linesman's flag is up — ${player} strayed too early.`,
        `${player} beats the defense to it, but the flag cuts the run short. Offside.`,
    ]);
}

export function yellowCardLine(rng: () => number, player: string, victim: string): string {
    return pick(rng, [
        `${player} is booked for a rash challenge on ${victim}.`,
        `Yellow card for ${player} after a late tackle on ${victim}.`,
        `${player} goes in hard on ${victim} and picks up a caution.`,
    ]);
}

export function redCardLine(rng: () => number, player: string, victim: string): string {
    return pick(rng, [
        `${player} is sent off! A reckless challenge on ${victim}!`,
        `RED CARD for ${player}! No arguing with that one.`,
    ]);
}

export function subLine(playerOut: string, playerIn: string): string {
    return `${playerIn} comes on for ${playerOut} at halftime.`;
}

export function halftimeLine(homeScore: number, awayScore: number): string {
    return `Halftime! The score stands at ${homeScore}-${awayScore}.`;
}

export function fulltimeLine(homeScore: number, awayScore: number): string {
    return `Full time! The final score is ${homeScore}-${awayScore}.`;
}
