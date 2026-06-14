<script lang="ts">
	import { browser } from '$app/environment';
	import { fly, fade } from 'svelte/transition';
	import type { LayoutData } from '../$types';
	import type { SMsgState, SMsgGoal, SMsgEnd } from '../../../../party/pongserver';

	let { data }: { data: LayoutData } = $props();

	// ── Types ────────────────────────────────────────────────────────────────

	type Difficulty   = 'easy' | 'medium' | 'hard' | 'unfair';
	type GameState    = 'menu' | 'playing' | 'scoring' | 'paused' | 'end';
	type MultiPhase   = 'lobby' | 'waiting' | 'ready_check' | 'countdown' | 'playing' | 'scoring' | 'ended';
	type PlayerRole   = 'player1' | 'player2' | 'spectator';

	interface DiffSettings { speed: number; cpuSpeed: number; cpuError: number; jitter: number; }
	interface Particle     { x: number; y: number; vx: number; vy: number; life: number; color: string; }
	interface TrailPoint   { x: number; y: number; }

	// ── Constants ────────────────────────────────────────────────────────────

	const ASPECT   = 16 / 10;
	const CW_LOGIC = 700;
	const CH_LOGIC = 437;

	const DIFF_SETTINGS: Record<Difficulty, DiffSettings> = {
		easy:   { speed: 6,  cpuSpeed: 2.8, cpuError: 40, jitter: 0.3 },
		medium: { speed: 8,  cpuSpeed: 4.0, cpuError: 22, jitter: 0.5 },
		hard:   { speed: 10, cpuSpeed: 5.5, cpuError: 10, jitter: 0.7 },
		unfair: { speed: 12, cpuSpeed: 99,  cpuError: 0,  jitter: 0.2 },
	};

	// ── Reactive UI state ────────────────────────────────────────────────────

	let uiMode:    'main_menu' | 'solo' | 'multi' = $state('main_menu');
	let gameState: GameState = $state('menu');
	let showOptions = $state(false);

	// Solo scores
	let p1Score = $state(0);
	let p2Score = $state(0);
	let winner  = $state('');

	// Solo options
	let difficulty:  Difficulty = $state('easy');
	let pointsToWin: number     = $state(5);
	let colP1    = $state('#4dabf7');
	let colP2    = $state('#f76808');
	let colBall  = $state('#ffffff');
	let tempDifficulty:  Difficulty = $state('easy');
	let tempPointsToWin: number     = $state(5);
	let tempColP1   = $state('#4dabf7');
	let tempColP2   = $state('#f76808');
	let tempColBall = $state('#ffffff');

	// Solo scoring animation
	let scoringPhase: 'in' | 'hold' | 'out' = 'in';
	let scoringProgress = 0;
	let scoringTimer: ReturnType<typeof setTimeout> | null = null;
	let pendingLaunchDir: 1 | -1 = 1;

	// ── Multiplayer state ────────────────────────────────────────────────────

	let multiPhase    = $state<MultiPhase>('lobby');
	let myRole        = $state<PlayerRole>('spectator');
	let roomCode      = $state('');
	let roomCodeInput = $state('');
	let multiReady    = $state(false);
	let multiCountdown = $state(0);
	let multiP1 = $state<{ paddleY: number; score: number; ready: boolean; username: string } | null>(null);
	let multiP2 = $state<{ paddleY: number; score: number; ready: boolean; username: string } | null>(null);
	let multiBall = $state({ x: CW_LOGIC / 2, y: CH_LOGIC / 2, vx: 0, vy: 0 });
	let renderBall  = { x: CW_LOGIC / 2, y: CH_LOGIC / 2 };
	let copyFeedback = $state(false);
	let ws: WebSocket | null = null;
	let wsConnecting = $state(false);
	let wsError      = $state('');

	// ── Game loop ────────────────────────────────────────────────────────────

	let rafId = 0;

	// ── Canvas ───────────────────────────────────────────────────────────────

	let canvas: HTMLCanvasElement;
	let ctx:    CanvasRenderingContext2D;
	let PW = 0, PH = 0, PAD = 0;
	let p1y = 0, p2y = 0;
	let bx = 0, by = 0, bvx = 0, bvy = 0;
	let targetCpuY = 0;
	let particles: Particle[]   = [];
	let trailPts:  TrailPoint[] = [];
	let mouseY = -1;
	let lastTouchY: number | null = null;

	// ── Helpers ───────────────────────────────────────────────────────────────

	function cw(): number { return canvas?.width  ?? CW_LOGIC; }
	function ch(): number { return canvas?.height ?? CH_LOGIC; }

	function initDimensions(): void {
		PW  = cw() * 0.022;
		PH  = ch() * 0.28;
		PAD = cw() * 0.018;
		p1y = ch() / 2 - PH / 2;
		p2y = ch() / 2 - PH / 2;
		targetCpuY = ch() / 2;
	}

	function launchBall(dir: 1 | -1 = 1): void {
		bx = cw() / 2; by = ch() / 2;
		const ds    = DIFF_SETTINGS[difficulty];
		const angle = Math.random() * 0.6 - 0.3;
		bvx = ds.speed * dir * Math.cos(angle);
		bvy = ds.speed * Math.sin(angle);
		trailPts = [];
	}

	function updateCanvasSize(): void {
		if (!browser || !canvas) return;
		const w = Math.min(canvas.parentElement?.clientWidth ?? CW_LOGIC, CW_LOGIC);
		canvas.style.width  = `${w}px`;
		canvas.style.height = `${w / ASPECT}px`;
		canvas.width  = CW_LOGIC;
		canvas.height = CW_LOGIC / ASPECT;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	function init(): void {
		if (!browser) return;
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		updateCanvasSize();
		window.addEventListener('resize', updateCanvasSize);
		canvas.addEventListener('mousemove',  onMouseMove);
		canvas.addEventListener('touchstart', onTouchStart, { passive: false });
		canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
		canvas.addEventListener('touchend',   onTouchEnd);
		rafId = requestAnimationFrame(loop);
	}

	function destroy(): void {
		if (!browser) return;
		cancelAnimationFrame(rafId);
		if (scoringTimer) clearTimeout(scoringTimer);
		window.removeEventListener('resize', updateCanvasSize);
		canvas?.removeEventListener('mousemove',  onMouseMove);
		canvas?.removeEventListener('touchstart', onTouchStart);
		canvas?.removeEventListener('touchmove',  onTouchMove);
		canvas?.removeEventListener('touchend',   onTouchEnd);
		disconnectWs();
	}

	// ── Input ─────────────────────────────────────────────────────────────────

	function onMouseMove(e: MouseEvent): void {
		const rect   = canvas.getBoundingClientRect();
		const scaleY = ch() / rect.height;
		mouseY = (e.clientY - rect.top) * scaleY;
		if (uiMode === 'multi' && multiPhase === 'playing' && ws?.readyState === WebSocket.OPEN) {
			const newY = Math.max(0, Math.min(ch() - PH, mouseY - PH / 2));
			ws.send(JSON.stringify({ type: 'paddle', y: newY }));
		}
	}

	function onTouchStart(e: TouchEvent): void {
		e.preventDefault();
		lastTouchY = e.touches[0].clientY;
	}

	function onTouchMove(e: TouchEvent): void {
		e.preventDefault();
		if (lastTouchY === null) return;
		const rect   = canvas.getBoundingClientRect();
		const scaleY = ch() / rect.height;
		const dy     = (e.touches[0].clientY - lastTouchY) * scaleY;
		if (uiMode === 'solo' && gameState === 'playing') {
			p1y = Math.max(0, Math.min(ch() - PH, p1y + dy));
		}
		if (uiMode === 'multi' && multiPhase === 'playing' && ws?.readyState === WebSocket.OPEN) {
			const base = myRole === 'player1' ? (multiP1?.paddleY ?? ch()/2 - PH/2) : (multiP2?.paddleY ?? ch()/2 - PH/2);
			const newY = Math.max(0, Math.min(ch() - PH, base + dy));
			ws.send(JSON.stringify({ type: 'paddle', y: newY }));
		}
		lastTouchY = e.touches[0].clientY;
	}

	function onTouchEnd(): void { lastTouchY = null; }

	// ── Solo ──────────────────────────────────────────────────────────────────

	function startSolo(): void {
		uiMode = 'solo';
		initDimensions();
		p1Score = 0; p2Score = 0; winner = '';
		particles = []; trailPts = [];
		gameState = 'playing';
		launchBall(Math.random() < 0.5 ? 1 : -1);
	}

	function togglePause(): void {
		if (gameState === 'playing') gameState = 'paused';
		else if (gameState === 'paused') gameState = 'playing';
	}

	function beginScoreDisplay(scoringDir: 1 | -1): void {
		gameState = 'scoring';
		pendingLaunchDir = scoringDir;
		scoringPhase = 'in';
		scoringProgress = 0;
		bx = -100; by = -100;
		trailPts = [];
		spawnParticles(scoringDir === -1 ? cw() * 0.25 : cw() * 0.75, ch() / 2, scoringDir === -1 ? colP2 : colP1);
		spawnParticles(cw() / 2, ch() / 2, '#ffffff');
		scoringTimer = setTimeout(() => {
			scoringPhase = 'hold';
			scoringTimer = setTimeout(() => {
				scoringPhase = 'out';
				scoringProgress = 1;
				scoringTimer = setTimeout(() => { launchBall(pendingLaunchDir); gameState = 'playing'; }, 500);
			}, 900);
		}, 400);
	}

	function openOptions():  void { tempDifficulty = difficulty; tempPointsToWin = pointsToWin; tempColP1 = colP1; tempColP2 = colP2; tempColBall = colBall; showOptions = true; }
	function cancelOptions():void { showOptions = false; }
	function saveOptions():  void { difficulty = tempDifficulty; pointsToWin = tempPointsToWin; colP1 = tempColP1; colP2 = tempColP2; colBall = tempColBall; showOptions = false; }

	// ── Multiplayer ───────────────────────────────────────────────────────────

	function generateRoomCode(): string { return Math.random().toString(36).slice(2, 7).toUpperCase(); }

	function buildWsUrl(code: string): string {
		const host  = 'calderra-party.em-codereever.partykit.dev';
		const proto = host.startsWith('localhost') ? 'ws' : 'wss';
		return `${proto}://${host}/parties/pongserver/${code.toLowerCase()}`;
	}

	function createRoom(): void { roomCode = generateRoomCode(); connectToRoom(roomCode); }

	function joinRoom(): void {
		const code = roomCodeInput.trim().toUpperCase();
		if (code.length < 4) { wsError = 'Enter a valid room code.'; return; }
		roomCode = code; connectToRoom(code);
	}

	function connectToRoom(code: string): void {
		if (!browser) return;
		wsError = ''; wsConnecting = true; uiMode = 'multi'; multiPhase = 'waiting';
		initDimensions();
		ws = new WebSocket(buildWsUrl(code));
		ws.onopen = () => {
			wsConnecting = false;
			ws?.send(JSON.stringify({ type: 'username', username: data.userProfile?.username ?? 'Player' }));
		};
		ws.onmessage = (ev: MessageEvent) => { handleServerMessage(JSON.parse(ev.data as string)); };
		ws.onerror = () => { wsError = 'Connection failed. Check your room code.'; wsConnecting = false; uiMode = 'main_menu'; };
		ws.onclose = () => {
			wsConnecting = false;
			if (multiPhase !== 'ended') { wsError = 'Disconnected from room.'; uiMode = 'main_menu'; multiPhase = 'lobby'; }
		};
	}

	function disconnectWs(): void { ws?.close(); ws = null; }

	function sendReady(): void { ws?.send(JSON.stringify({ type: 'ready' })); multiReady = true; }

	async function copyRoomCode(): Promise<void> {
		if (!browser) return;
		await navigator.clipboard.writeText(roomCode);
		copyFeedback = true;
		setTimeout(() => { copyFeedback = false; }, 1800);
	}

	function handleServerMessage(msg: SMsgState | SMsgGoal | SMsgEnd): void {
		if (msg.type === 'goal') {
			const m = msg as SMsgGoal;
			spawnParticles(m.scorer === 'player1' ? cw() * 0.75 : cw() * 0.25, ch() / 2, m.scorer === 'player1' ? colP1 : colP2);
			spawnParticles(cw() / 2, ch() / 2, '#ffffff');
			scoringPhase = 'in'; scoringProgress = 0;
			pendingLaunchDir = m.scorer === 'player1' ? -1 : 1;
			return;
		}
		if (msg.type === 'end') {
			const m = msg as SMsgEnd;
			winner = m.winner === 'player1' ? (multiP1?.username ?? 'Player 1') : (multiP2?.username ?? 'Player 2');
			multiPhase = 'ended'; return;
		}
		if (msg.type === 'state') {
			const m = msg as SMsgState;
			myRole = m.yourRole; multiP1 = m.p1; multiP2 = m.p2; multiBall = m.ball; multiCountdown = m.countdown;
			if      (m.phase === 'waiting')    multiPhase = 'waiting';
			else if (m.phase === 'ready_check') multiPhase = 'ready_check';
			else if (m.phase === 'countdown')   multiPhase = 'countdown';
			else if (m.phase === 'playing')     multiPhase = 'playing';
			else if (m.phase === 'scoring')     multiPhase = 'scoring';
			else if (m.phase === 'ended')       multiPhase = 'ended';
			renderBall.x += (m.ball.x - renderBall.x) * 0.4;
			renderBall.y += (m.ball.y - renderBall.y) * 0.4;
		}
	}

	function leaveRoom(): void {
		disconnectWs(); uiMode = 'main_menu'; multiPhase = 'lobby';
		roomCode = ''; roomCodeInput = ''; multiReady = false; winner = '';
		particles = []; trailPts = [];
	}

	// ── Solo AI & Physics ─────────────────────────────────────────────────────

	function moveCpu(): void {
		const ds = DIFF_SETTINGS[difficulty];
		targetCpuY += (by - targetCpuY) * ds.jitter * 0.1;
		const err = (Math.random() * 2 - 1) * ds.cpuError;
		const aim = targetCpuY + err;
		const mid = p2y + PH / 2;
		if (mid < aim - 4) p2y += Math.min(ds.cpuSpeed, aim - mid);
		else if (mid > aim + 4) p2y -= Math.min(ds.cpuSpeed, mid - aim);
		p2y = Math.max(0, Math.min(ch() - PH, p2y));
	}

	function spawnParticles(x: number, y: number, color: string): void {
		for (let i = 0; i < 20; i++) {
			const angle = Math.random() * Math.PI * 2;
			const spd   = 2 + Math.random() * 5;
			particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, color });
		}
	}

	function updateBall(): void {
		if (gameState !== 'playing') return;
		trailPts.unshift({ x: bx, y: by });
		if (trailPts.length > 14) trailPts.pop();
		bx += bvx; by += bvy;
		const ballR = 6;
		const ds    = DIFF_SETTINGS[difficulty];
		const MAX_SPEED = ds.speed * 1.9;
		if (by - ballR < 0)    { by = ballR;        bvy =  Math.abs(bvy); }
		if (by + ballR > ch()) { by = ch() - ballR; bvy = -Math.abs(bvy); }
		const resolveHit = (paddleX: number, paddleY: number, side: 'left' | 'right'): void => {
			const rel   = (by - (paddleY + PH / 2)) / (PH / 2);
			const angle = rel * (Math.PI / 3.5);
			const spd   = Math.min(Math.hypot(bvx, bvy) * 1.04, MAX_SPEED);
			bvx = (side === 'left' ? 1 : -1) * spd * Math.cos(angle);
			bvy = spd * Math.sin(angle);
			spawnParticles(side === 'left' ? paddleX + PW : paddleX - PW, by, side === 'left' ? colP1 : colP2);
		};
		if (bvx < 0 && bx - ballR < PAD + PW && bx + ballR > PAD && by > p1y - ballR && by < p1y + PH + ballR) {
			bx = PAD + PW + ballR; resolveHit(PAD, p1y, 'left');
		}
		if (bvx > 0 && bx + ballR > cw() - PAD - PW && bx - ballR < cw() - PAD && by > p2y - ballR && by < p2y + PH + ballR) {
			bx = cw() - PAD - PW - ballR; resolveHit(cw() - PAD, p2y, 'right');
		}
		if (bx < -20) { p2Score++; if (p2Score >= pointsToWin) endGameSolo('CPU'); else beginScoreDisplay(1); }
		if (bx > cw() + 20) { p1Score++; if (p1Score >= pointsToWin) endGameSolo(data.userProfile?.username ?? 'Player'); else beginScoreDisplay(-1); }
	}

	function endGameSolo(winnerName: string): void { gameState = 'end'; winner = winnerName; bx = -100; by = -100; }

	// ── Drawing ───────────────────────────────────────────────────────────────

	function drawPaddle(x: number, y: number, color: string): void {
		const r = PW / 2;
		ctx.fillStyle = color;
		ctx.beginPath(); ctx.roundRect(x, y, PW, PH, r); ctx.fill();
		ctx.fillStyle = 'rgba(255,255,255,0.13)';
		ctx.beginPath(); ctx.roundRect(x + PW * 0.2, y + 6, PW * 0.3, PH - 12, r * 0.4); ctx.fill();
	}

	function drawScoringOverlay(lp1Score: number, lp2Score: number, scorerIsP1: boolean): void {
		if (scoringPhase === 'in')  scoringProgress = Math.min(scoringProgress + 0.055, 1);
		if (scoringPhase === 'out') scoringProgress = Math.max(scoringProgress - 0.055, 0);
		const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
		const easeIn  = (t: number): number => t * t * t;
		const t = scoringPhase === 'out' ? easeIn(scoringProgress) : easeOut(scoringProgress);

		ctx.fillStyle = `rgba(0,0,0,${t * 0.72})`; ctx.fillRect(0, 0, cw(), ch());

		if (scoringPhase === 'in' || scoringPhase === 'hold') {
			const scanY = scoringProgress * ch();
			const grad  = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
			grad.addColorStop(0, 'rgba(255,255,255,0)');
			grad.addColorStop(0.5, `rgba(255,255,255,${(1 - scoringProgress) * 0.12})`);
			grad.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.fillStyle = grad; ctx.fillRect(0, scanY - 40, cw(), 80);
		}

		const scorerColor = scorerIsP1 ? colP1 : colP2;
		const scoreSize   = ch() * 0.30;
		const labelSize   = ch() * 0.048;
		const aberration  = scoringPhase === 'in' ? (1 - scoringProgress) * 10 : 0;

		ctx.save();
		ctx.translate(cw() / 2, ch() / 2);
		ctx.globalAlpha = t;
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

		const labelY = -ch() * 0.20;
		ctx.font = `400 ${labelSize * (0.7 + t * 0.3)}px sans-serif`;
		ctx.letterSpacing = `${t * 8}px`;
		ctx.fillStyle = `rgba(255,255,255,${t * 0.55})`;
		ctx.fillText('GOAL', 0, labelY);
		ctx.letterSpacing = '0px';

		const nameSize = ch() * 0.052;
		ctx.font = `400 ${nameSize}px sans-serif`;
		ctx.fillStyle = scorerColor + Math.round(t * 200).toString(16).padStart(2, '0');
		const scorerLabel = uiMode === 'multi'
			? (scorerIsP1 ? (multiP1?.username ?? 'Player 1') : (multiP2?.username ?? 'Player 2'))
			: (scorerIsP1 ? (data.userProfile?.username ?? 'Player') : 'CPU');
		ctx.fillText(scorerLabel.toUpperCase(), 0, labelY + labelSize * 1.6);

		ctx.font = `500 ${scoreSize}px sans-serif`;
		const drawNum = (value: number, offsetX: number, isScorer: boolean): void => {
			const str = String(value);
			if (isScorer && aberration > 0) {
				ctx.globalAlpha = t * 0.35;
				ctx.fillStyle = '#ff3b3b'; ctx.fillText(str, offsetX - aberration, 0);
				ctx.fillStyle = '#3bffee'; ctx.fillText(str, offsetX + aberration, 0);
				ctx.globalAlpha = t;
			}
			ctx.fillStyle = isScorer ? scorerColor : 'rgba(255,255,255,0.35)';
			if (isScorer) {
				ctx.save(); ctx.translate(offsetX, 0);
				const punch = scoringPhase === 'in' ? 1 + (1 - t) * 0.25 : 1;
				ctx.scale(punch, punch); ctx.fillText(str, 0, 0); ctx.restore();
			} else { ctx.fillText(str, offsetX, 0); }
		};
		drawNum(lp1Score, -cw() * 0.13, scorerIsP1);
		ctx.globalAlpha = t * 0.25; ctx.fillStyle = '#ffffff';
		ctx.font = `300 ${scoreSize * 0.4}px sans-serif`; ctx.fillText('—', 0, 0);
		ctx.font = `500 ${scoreSize}px sans-serif`;
		drawNum(lp2Score, cw() * 0.13, !scorerIsP1);
		ctx.restore(); ctx.globalAlpha = 1;
	}

	function renderParticles(): void {
		for (let i = particles.length - 1; i >= 0; i--) {
			const p = particles[i];
			ctx.beginPath(); ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
			const alpha = Math.round(p.life * 255).toString(16).padStart(2, '0');
			ctx.fillStyle = p.color + alpha; ctx.fill();
			p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.035;
			if (p.life <= 0) particles.splice(i, 1);
		}
	}

	function render(): void {
		if (!ctx) return;
		ctx.clearRect(0, 0, cw(), ch());
		ctx.fillStyle = '#0d0d0f'; ctx.fillRect(0, 0, cw(), ch());

		ctx.setLineDash([8, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5;
		ctx.beginPath(); ctx.moveTo(cw() / 2, 0); ctx.lineTo(cw() / 2, ch()); ctx.stroke();
		ctx.setLineDash([]);
		ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.arc(cw() / 2, ch() / 2, ch() * 0.3, 0, Math.PI * 2); ctx.stroke();

		if (uiMode === 'solo') {
			// Ball trail
			for (let i = trailPts.length - 1; i >= 0; i--) {
				const a = (1 - i / trailPts.length) * 0.3;
				const r = 3 * (1 - i / trailPts.length);
				ctx.beginPath(); ctx.arc(trailPts[i].x, trailPts[i].y, r, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
			}
			renderParticles();
			drawPaddle(PAD, p1y, colP1);
			drawPaddle(cw() - PAD - PW, p2y, colP2);
			if (gameState === 'playing') {
				ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fillStyle = colBall; ctx.fill();
			}
			if (gameState === 'scoring') drawScoringOverlay(p1Score, p2Score, pendingLaunchDir === -1);
		}

		if (uiMode === 'multi') {
			renderBall.x += (multiBall.x - renderBall.x) * 0.35;
			renderBall.y += (multiBall.y - renderBall.y) * 0.35;
			const lp1y = multiP1?.paddleY ?? ch() / 2 - PH / 2;
			const lp2y = multiP2?.paddleY ?? ch() / 2 - PH / 2;
			renderParticles();
			drawPaddle(PAD, lp1y, colP1);
			drawPaddle(cw() - PAD - PW, lp2y, colP2);
			// Ownership highlight ring
			if (myRole === 'player1' || myRole === 'player2') {
				const ownX = myRole === 'player1' ? PAD : cw() - PAD - PW;
				const ownY = myRole === 'player1' ? lp1y : lp2y;
				ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
				ctx.beginPath(); ctx.roundRect(ownX - 2, ownY - 2, PW + 4, PH + 4, PW / 2 + 2); ctx.stroke();
			}
			if (multiPhase === 'playing' || multiPhase === 'scoring') {
				ctx.beginPath(); ctx.arc(renderBall.x, renderBall.y, 6, 0, Math.PI * 2);
				ctx.fillStyle = colBall; ctx.fill();
			}
			if (multiPhase === 'scoring') {
				drawScoringOverlay(multiP1?.score ?? 0, multiP2?.score ?? 0, pendingLaunchDir === -1);
			}
			if (multiPhase === 'countdown' && multiCountdown > 0) {
				ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, cw(), ch());
				ctx.fillStyle = '#ffffff'; ctx.font = `500 ${ch() * 0.28}px sans-serif`;
				ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				ctx.fillText(String(multiCountdown), cw() / 2, ch() / 2);
			}
		}
	}

	function loop(): void {
		if (uiMode === 'solo' && gameState === 'playing') {
			if (mouseY > 0) p1y = Math.max(0, Math.min(ch() - PH, mouseY - PH / 2));
			moveCpu(); updateBall();
		}
		render();
		rafId = requestAnimationFrame(loop);
	}

	function bindCanvas(node: HTMLCanvasElement): void { canvas = node; init(); }

	import { onDestroy } from 'svelte';
	onDestroy(destroy);
</script>

<svelte:head>
	<title>Ping Pong</title>
</svelte:head>

<section class="flex flex-col items-center space-y-4 px-2 py-4">

	<!-- HUD -->
	{#if uiMode !== 'main_menu'}
	<div class="w-full max-w-175 flex items-center justify-between px-4 py-2 rounded-xl
		bg-white/5 border border-white/10 backdrop-blur-sm text-white">
		<div class="flex flex-col items-center min-w-22.5">
			<span class="text-[10px] uppercase tracking-widest text-base-content/60 font-bold">
				{uiMode === 'multi' ? (multiP1?.username ?? '—') : (data.userProfile?.username ?? 'You')}
			</span>
			<span class="text-3xl font-medium tabular-nums text-base-content">
				{uiMode === 'multi' ? (multiP1?.score ?? 0) : p1Score}
			</span>
		</div>
		<div class="flex flex-col items-center gap-1">
			{#if uiMode === 'solo'}
			<button onclick={togglePause}
				disabled={gameState === 'menu' || gameState === 'end' || gameState === 'scoring'}
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-base-content/20
					text-base-content/80 hover:bg-base-content/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
				{#if gameState === 'paused'}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
					</svg> Resume
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd"/>
					</svg> Pause
				{/if}
			</button>
			<span class="text-[10px] tracking-widest text-base-content/60 capitalize">{difficulty}</span>
			{:else}
			<div class="flex flex-col items-center gap-0.5">
				<span class="text-[10px] uppercase tracking-widest text-base-content/40">
					{myRole === 'player1' ? '← Your side' : myRole === 'player2' ? 'Your side →' : 'Spectating'}
				</span>
				<span class="font-mono text-xs text-base-content/50 tracking-widest">{roomCode}</span>
			</div>
			{/if}
		</div>
		<div class="flex flex-col items-center min-w-22.5">
			<span class="text-[10px] uppercase tracking-widest text-base-content/60 font-bold">
				{uiMode === 'multi' ? (multiP2?.username ?? '—') : 'CPU'}
			</span>
			<span class="text-3xl font-medium tabular-nums text-base-content">
				{uiMode === 'multi' ? (multiP2?.score ?? 0) : p2Score}
			</span>
		</div>
	</div>
	{/if}

	<!-- Canvas wrapper -->
	<div class="relative w-full max-w-175">
		<canvas use:bindCanvas id="pingPongCanvas" width="700" height="437"
			class="w-full rounded-xl border border-white/10 block"
			style="background:#0d0d0f; aspect-ratio:16/10;"></canvas>

		<!-- MAIN MENU -->
		{#if uiMode === 'main_menu'}
		<div in:fly={{ y: 30, duration: 400 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-xl bg-black/80">
			<h1 class="text-5xl font-medium text-white tracking-tight">Ping Pong</h1>
			<p class="text-sm text-white/40">Choose a mode to play</p>
			<div class="flex flex-col gap-3 w-48">
				<button onclick={startSolo}
					class="px-6 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
					Solo vs CPU
				</button>
				<button onclick={() => { uiMode = 'multi'; multiPhase = 'lobby'; }}
					class="px-6 py-3 rounded-lg border border-white/25 text-white text-sm hover:bg-white/10 transition-colors">
					Multiplayer
				</button>
			</div>
			<button onclick={openOptions}
				class="text-xs text-white/30 hover:text-white/60 transition-colors mt-1">Options</button>
		</div>
		{/if}

		<!-- MULTIPLAYER LOBBY -->
		{#if uiMode === 'multi' && multiPhase === 'lobby'}
		<div transition:fade={{ duration: 200 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-xl bg-black/90 px-8">
			<h2 class="text-2xl font-medium text-white">Multiplayer</h2>
			<div class="flex flex-col gap-3 w-full max-w-xs">
				<button onclick={createRoom}
					class="px-6 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
					Create Room
				</button>
				<div class="flex items-center gap-2 my-1">
					<div class="flex-1 h-px bg-white/10"></div>
					<span class="text-xs text-white/30">or join</span>
					<div class="flex-1 h-px bg-white/10"></div>
				</div>
				<div class="flex gap-2">
					<input bind:value={roomCodeInput} placeholder="Room code" maxlength="8"
						class="flex-1 bg-white/10 text-white placeholder-white/30 border border-white/20
							rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-white/50"/>
					<button onclick={joinRoom}
						class="px-4 py-2 rounded-lg bg-white/15 text-white text-sm hover:bg-white/25 transition-colors border border-white/20">
						Join
					</button>
				</div>
				{#if wsError}<p class="text-red-400 text-xs text-center">{wsError}</p>{/if}
			</div>
			<button onclick={() => { uiMode = 'main_menu'; wsError = ''; }}
				class="text-xs text-white/30 hover:text-white/60 transition-colors">← Back</button>
		</div>
		{/if}

		<!-- WAITING FOR OPPONENT -->
		{#if uiMode === 'multi' && multiPhase === 'waiting'}
		<div transition:fade={{ duration: 200 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-xl bg-black/88 px-8">
			<div class="flex flex-col items-center gap-2">
				<div class="flex gap-1.5">
					{#each [0,1,2] as i (i)}
					<div class="w-2 h-2 rounded-full bg-white/60 animate-bounce" style="animation-delay:{i*0.15}s"></div>
					{/each}
				</div>
				<p class="text-white/70 text-sm">Waiting for opponent…</p>
			</div>
			<div class="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-6 py-4 w-full max-w-xs">
				<span class="text-[10px] uppercase tracking-widest text-white/40">Room Code</span>
				<span class="font-mono text-3xl font-bold tracking-[0.2em] text-white">{roomCode}</span>
				<button onclick={copyRoomCode}
					class="mt-1 text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5">
					{#if copyFeedback}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-green-400">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
					</svg>
					<span class="text-green-400">Copied!</span>
					{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
						<path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/>
						<path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/>
					</svg>
					Copy to share
					{/if}
				</button>
			</div>
			<button onclick={leaveRoom}
				class="text-xs text-white/30 hover:text-white/60 transition-colors">Cancel</button>
		</div>
		{/if}

		<!-- READY CHECK -->
		{#if uiMode === 'multi' && multiPhase === 'ready_check'}
		<div transition:fade={{ duration: 200 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-xl bg-black/82 px-8">
			<h2 class="text-xl font-medium text-white">Opponent found!</h2>
			<div class="flex gap-4">
				{#each [
					{ label: multiP1?.username ?? 'Player 1', ready: multiP1?.ready ?? false, isYou: myRole === 'player1' },
					{ label: multiP2?.username ?? 'Player 2', ready: multiP2?.ready ?? false, isYou: myRole === 'player2' },
				] as p (p.label)}
				<div class="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border transition-colors duration-300
					{p.ready ? 'border-green-500/50 bg-green-500/10' : 'border-white/15 bg-white/5'}">
					<span class="text-xs text-white/60">{p.label}{p.isYou ? ' (you)' : ''}</span>
					<span class="text-sm font-medium {p.ready ? 'text-green-400' : 'text-white/30'}">
						{p.ready ? '✓ Ready' : 'Not ready'}
					</span>
				</div>
				{/each}
			</div>
			{#if !multiReady && myRole !== 'spectator'}
			<button onclick={sendReady}
				class="px-8 py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
				I'm Ready
			</button>
			{:else if myRole !== 'spectator'}
			<p class="text-sm text-white/40 animate-pulse">Waiting for opponent…</p>
			{/if}
			<button onclick={leaveRoom}
				class="text-xs text-white/30 hover:text-white/60 transition-colors">Leave room</button>
		</div>
		{/if}

		<!-- PAUSED (solo) -->
		{#if uiMode === 'solo' && gameState === 'paused'}
		<div transition:fade={{ duration: 200 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/60">
			<p class="text-2xl font-medium text-white">Paused</p>
			<button onclick={togglePause}
				class="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
				Resume
			</button>
		</div>
		{/if}

		<!-- GAME OVER -->
		{#if (uiMode === 'solo' && gameState === 'end') || (uiMode === 'multi' && multiPhase === 'ended')}
		<div in:fly={{ y: 30, duration: 400 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/85">
			<h2 class="text-4xl font-medium text-white">{winner} Wins!</h2>
			<p class="text-5xl font-bold text-white/50 tabular-nums">
				{uiMode === 'multi' ? (multiP1?.score ?? 0) : p1Score} — {uiMode === 'multi' ? (multiP2?.score ?? 0) : p2Score}
			</p>
			<div class="flex gap-3 mt-2">
				{#if uiMode === 'solo'}
				<button onclick={startSolo}
					class="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
					Play Again
				</button>
				<button onclick={openOptions}
					class="px-6 py-2.5 rounded-lg border border-white/25 text-white text-sm hover:bg-white/10 transition-colors">
					Options
				</button>
				{:else}
				<button onclick={leaveRoom}
					class="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
					Leave Room
				</button>
				{/if}
			</div>
		</div>
		{/if}

		<!-- OPTIONS (solo) -->
		{#if showOptions}
		<div transition:fade={{ duration: 180 }}
			class="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/90 px-8 py-6">
			<h2 class="text-lg font-medium text-white mb-1">Options</h2>
			<div class="flex flex-col gap-3 w-full max-w-xs">
				<div class="flex items-center justify-between">
					<label class="text-sm text-white/60" for="diff-sel">Difficulty</label>
					<select id="diff-sel" bind:value={tempDifficulty}
						class="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm">
						<option value="easy">Easy</option><option value="medium">Medium</option>
						<option value="hard">Hard</option><option value="unfair">Unfair</option>
					</select>
				</div>
				<div class="flex items-center justify-between">
					<label class="text-sm text-white/60" for="pts-win">Points to win</label>
					<input id="pts-win" type="number" bind:value={tempPointsToWin} min="1" max="21"
						class="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm w-20 text-center"/>
				</div>
				<div class="flex items-center justify-between">
					<label class="text-sm text-white/60" for="col-p1">Your paddle</label>
					<input id="col-p1" type="color" bind:value={tempColP1} class="w-12 h-8 rounded border-0 bg-transparent cursor-pointer"/>
				</div>
				<div class="flex items-center justify-between">
					<label class="text-sm text-white/60" for="col-p2">CPU paddle</label>
					<input id="col-p2" type="color" bind:value={tempColP2} class="w-12 h-8 rounded border-0 bg-transparent cursor-pointer"/>
				</div>
				<div class="flex items-center justify-between">
					<label class="text-sm text-white/60" for="col-ball">Ball color</label>
					<input id="col-ball" type="color" bind:value={tempColBall} class="w-12 h-8 rounded border-0 bg-transparent cursor-pointer"/>
				</div>
			</div>
			<div class="flex gap-3 mt-3">
				<button onclick={cancelOptions}
					class="px-5 py-2 rounded-lg border border-white/25 text-white text-sm hover:bg-white/10 transition-colors">Cancel</button>
				<button onclick={saveOptions}
					class="px-5 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">Save</button>
			</div>
		</div>
		{/if}

	</div>
</section>

<style>
	canvas { touch-action: none; user-select: none; }
</style>
