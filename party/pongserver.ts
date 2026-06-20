/**
 * pongServer.ts  —  PartyKit room server for multiplayer Ping Pong
 *
 * Place this file at:  party/pongServer.ts
 * partykit.json entry: { "main": "party/pongServer.ts" }
 *
 * Room lifecycle
 * ──────────────
 * 1. First connection → becomes player1 (left paddle)
 * 2. Second connection → becomes player2 (right paddle)
 * 3. Any further connections → spectators (receive state only)
 * 4. Both players send { type: "ready" } → server starts countdown → game begins
 * 5. Server owns ball physics at ~60 Hz; clients own only their own paddle
 * 6. On disconnect the room resets so a new pair can play
 */

import type * as Party from "partykit/server";

// ── Constants ────────────────────────────────────────────────────────────────

const TICK_MS   = 1000 / 60;   // ~16.67 ms  (60 Hz server tick)
const CW        = 700;
const CH        = 437;
const BALL_R    = 6;
const PAD_W     = CW * 0.022;
const PAD_H     = CH * 0.28;
const PAD_X     = CW * 0.018;  // distance of paddle face from edge
const BASE_SPEED = 7;
const MAX_SPEED  = BASE_SPEED * 1.9;
const POINTS_TO_WIN = 5;

// ── Types ────────────────────────────────────────────────────────────────────

type RoomPhase =
  | "waiting"      // < 2 players connected
  | "ready_check"  // 2 players, waiting for both to ready-up
  | "countdown"    // 3-2-1
  | "playing"
  | "scoring"      // brief pause after a goal
  | "ended";

interface PlayerState {
  id:           string;
  role:         "player1" | "player2";
  ready:        boolean;
  wantsRematch: boolean;
  paddleY:      number;
  score:        number;
  username:     string;
}

interface BallState {
  x:  number;
  y:  number;
  vx: number;
  vy: number;
}

// Messages  client → server
interface CMsgReady     { type: "ready" }
interface CMsgRematch   { type: "rematch" }
interface CMsgPaddle    { type: "paddle"; y: number }
interface CMsgUsername  { type: "username"; username: string }
type ClientMsg = CMsgReady | CMsgRematch | CMsgPaddle | CMsgUsername;

// Messages  server → client
export interface SMsgState {
  type:      "state";
  phase:     RoomPhase;
  countdown: number;       // 3/2/1/0
  p1:        { paddleY: number; score: number; ready: boolean; wantsRematch: boolean; username: string } | null;
  p2:        { paddleY: number; score: number; ready: boolean; wantsRematch: boolean; username: string } | null;
  ball:      BallState;
  yourRole:  "player1" | "player2" | "spectator";
}

export interface SMsgGoal {
  type:   "goal";
  scorer: "player1" | "player2";
  p1Score: number;
  p2Score: number;
}

export interface SMsgEnd {
  type:   "end";
  winner: "player1" | "player2";
  p1Score: number;
  p2Score: number;
}

export interface SMsgPhase {
  type:      "phase";
  phase:     RoomPhase;
  countdown: number;
}

// ── Server ───────────────────────────────────────────────────────────────────

export default class PongServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // ── Room state ──────────────────────────────────────────────────────────

  phase:     RoomPhase = "waiting";
  countdown: number    = 0;

  players: Map<string, PlayerState> = new Map();
  ball: BallState = { x: CW / 2, y: CH / 2, vx: 0, vy: 0 };

  tickInterval:     ReturnType<typeof setInterval>  | null = null;
  countdownTimeout: ReturnType<typeof setTimeout>   | null = null;
  scoringTimeout:   ReturnType<typeof setTimeout>   | null = null;

  // ── Connection ──────────────────────────────────────────────────────────

  onConnect(conn: Party.Connection): void {
    const existing = [...this.players.values()];
    const takenRoles = existing.map(p => p.role);

    let role: PlayerState["role"] | "spectator";
    if (!takenRoles.includes("player1")) {
      role = "player1";
    } else if (!takenRoles.includes("player2")) {
      role = "player2";
    } else {
      role = "spectator";
    }

    if (role !== "spectator") {
      this.players.set(conn.id, {
        id:           conn.id,
        role,
        ready:        false,
        wantsRematch: false,
        paddleY:      CH / 2 - PAD_H / 2,
        score:        0,
        username:     role === "player1" ? "Player 1" : "Player 2",
      });
    }

    // Send current state immediately so the new client can render
    this.sendStateTo(conn, role === "spectator" ? "spectator" : role);

    // If we just got our second player, move to ready_check
    if (this.players.size === 2 && this.phase === "waiting") {
      this.setPhase("ready_check");
    }
  }

  onClose(conn: Party.Connection): void {
    if (this.players.has(conn.id)) {
      this.players.delete(conn.id);
      this.stopTick();
      if (this.countdownTimeout) { clearTimeout(this.countdownTimeout); this.countdownTimeout = null; }
      if (this.scoringTimeout)   { clearTimeout(this.scoringTimeout);   this.scoringTimeout   = null; }
      this.phase = "waiting";
      this.resetScores();
      this.broadcastState();
    }
  }

  // ── Messages ────────────────────────────────────────────────────────────

  onMessage(raw: string, sender: Party.Connection): void {
    let msg: ClientMsg;
    try { msg = JSON.parse(raw) as ClientMsg; } catch { return; }

    const player = this.players.get(sender.id);

    if (msg.type === "username" && player) {
      player.username = (msg as CMsgUsername).username.slice(0, 20);
      this.broadcastState();
      return;
    }

    // Rematch handshake: each player signals intent independently while the
    // "ended" screen is showing. Only once BOTH have requested it does the
    // room actually move to ready_check — neither player is surprised by a
    // sudden phase change from a single click.
    if (msg.type === "rematch" && player && this.phase === "ended") {
      player.wantsRematch = true;
      const both = [...this.players.values()].every(p => p.wantsRematch);
      if (both && this.players.size === 2) {
        this.resetScores();
        for (const p of this.players.values()) p.wantsRematch = false;
        this.setPhase("ready_check");
      } else {
        this.broadcastState();
      }
      return;
    }

    if (msg.type === "ready" && player && this.phase === "ready_check") {
      player.ready = true;
      this.broadcastState();
      const both = [...this.players.values()].every(p => p.ready);
      if (both) this.startCountdown();
      return;
    }

    if (msg.type === "paddle" && player && this.phase === "playing") {
      const y = (msg as CMsgPaddle).y;
      player.paddleY = Math.max(0, Math.min(CH - PAD_H, y));
      // No need to broadcast immediately — the tick loop broadcasts state
    }
  }

  // ── Phase management ────────────────────────────────────────────────────

  setPhase(phase: RoomPhase): void {
    this.phase = phase;
    this.broadcastState();
  }

  startCountdown(): void {
    this.setPhase("countdown");
    this.countdown = 3;
    this.broadcastState();
    const tick = (): void => {
      this.countdown--;
      this.broadcastState();
      if (this.countdown > 0) {
        this.countdownTimeout = setTimeout(tick, 1000);
      } else {
        this.startPlaying();
      }
    };
    this.countdownTimeout = setTimeout(tick, 1000);
  }

  startPlaying(): void {
    this.resetBall(Math.random() < 0.5 ? 1 : -1);
    this.setPhase("playing");
    this.startTick();
  }

  // ── Physics tick ────────────────────────────────────────────────────────

  startTick(): void {
    this.stopTick();
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }

  stopTick(): void {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
  }

  tick(): void {
    if (this.phase !== "playing") return;
    this.moveBall();
    this.broadcastState();
  }

  moveBall(): void {
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Wall bounce
    if (this.ball.y - BALL_R < 0)  { this.ball.y = BALL_R;        this.ball.vy =  Math.abs(this.ball.vy); }
    if (this.ball.y + BALL_R > CH) { this.ball.y = CH - BALL_R;   this.ball.vy = -Math.abs(this.ball.vy); }

    const p1 = this.getPlayer("player1");
    const p2 = this.getPlayer("player2");
    if (!p1 || !p2) return;

    // Paddle collision helper
    const resolveHit = (paddleY: number, side: "left" | "right"): void => {
      const rel   = (this.ball.y - (paddleY + PAD_H / 2)) / (PAD_H / 2);
      const angle = rel * (Math.PI / 3.5);
      const spd   = Math.min(Math.hypot(this.ball.vx, this.ball.vy) * 1.04, MAX_SPEED);
      this.ball.vx = (side === "left" ? 1 : -1) * spd * Math.cos(angle);
      this.ball.vy = spd * Math.sin(angle);
    };

    // Left (player1) paddle
    const p1PaddleRight = PAD_X + PAD_W;
    if (
      this.ball.vx < 0 &&
      this.ball.x - BALL_R < p1PaddleRight &&
      this.ball.x + BALL_R > PAD_X &&
      this.ball.y > p1.paddleY - BALL_R &&
      this.ball.y < p1.paddleY + PAD_H + BALL_R
    ) {
      this.ball.x = p1PaddleRight + BALL_R;
      resolveHit(p1.paddleY, "left");
    }

    // Right (player2) paddle
    const p2PaddleLeft = CW - PAD_X - PAD_W;
    if (
      this.ball.vx > 0 &&
      this.ball.x + BALL_R > p2PaddleLeft &&
      this.ball.x - BALL_R < CW - PAD_X &&
      this.ball.y > p2.paddleY - BALL_R &&
      this.ball.y < p2.paddleY + PAD_H + BALL_R
    ) {
      this.ball.x = p2PaddleLeft - BALL_R;
      resolveHit(p2.paddleY, "right");
    }

    // Scoring
    if (this.ball.x < -20) {
      this.onGoal("player2");
    } else if (this.ball.x > CW + 20) {
      this.onGoal("player1");
    }
  }

  onGoal(scorer: "player1" | "player2"): void {
    this.stopTick();
    const p = this.getPlayer(scorer);
    if (!p) return;
    p.score++;

    const goalMsg: SMsgGoal = { type: "goal", scorer, p1Score: this.getPlayer("player1")?.score ?? 0, p2Score: this.getPlayer("player2")?.score ?? 0 };
    this.room.broadcast(JSON.stringify(goalMsg));

    if (p.score >= POINTS_TO_WIN) {
      this.endGame(scorer);
      return;
    }

    this.phase = "scoring";
    this.ball = { x: -100, y: -100, vx: 0, vy: 0 };
    this.broadcastState();

    this.scoringTimeout = setTimeout(() => {
      this.resetBall(scorer === "player1" ? -1 : 1);
      this.setPhase("playing");
      this.startTick();
    }, 1800);
  }

  endGame(winner: "player1" | "player2"): void {
    this.phase = "ended";
    const endMsg: SMsgEnd = {
      type:    "end",
      winner,
      p1Score: this.getPlayer("player1")?.score ?? 0,
      p2Score: this.getPlayer("player2")?.score ?? 0,
    };
    this.room.broadcast(JSON.stringify(endMsg));
    this.broadcastState();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  getPlayer(role: "player1" | "player2"): PlayerState | undefined {
    return [...this.players.values()].find(p => p.role === role);
  }

  resetBall(dir: 1 | -1): void {
    const angle = (Math.random() * 0.6 - 0.3);
    this.ball = {
      x:  CW / 2,
      y:  CH / 2,
      vx: BASE_SPEED * dir * Math.cos(angle),
      vy: BASE_SPEED * Math.sin(angle),
    };
  }

  resetScores(): void {
    for (const p of this.players.values()) {
      p.score = 0;
      p.ready = false;
      p.wantsRematch = false;
    }
  }

  buildStateMsg(yourRole: "player1" | "player2" | "spectator"): SMsgState {
    const p1 = this.getPlayer("player1");
    const p2 = this.getPlayer("player2");
    return {
      type:      "state",
      phase:     this.phase,
      countdown: this.countdown,
      yourRole,
      p1: p1 ? { paddleY: p1.paddleY, score: p1.score, ready: p1.ready, wantsRematch: p1.wantsRematch, username: p1.username } : null,
      p2: p2 ? { paddleY: p2.paddleY, score: p2.score, ready: p2.ready, wantsRematch: p2.wantsRematch, username: p2.username } : null,
      ball: { ...this.ball },
    };
  }

  sendStateTo(conn: Party.Connection, role: "player1" | "player2" | "spectator"): void {
    conn.send(JSON.stringify(this.buildStateMsg(role)));
  }

  broadcastState(): void {
    for (const conn of this.room.getConnections()) {
      const player = this.players.get(conn.id);
      const role   = player ? player.role : "spectator";
      conn.send(JSON.stringify(this.buildStateMsg(role)));
    }
  }
}