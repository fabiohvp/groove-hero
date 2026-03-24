<script lang="ts">
	import { gameState, getGuitarPosition } from '$lib/games/guitar/game.svelte';
	import Guitar from './Guitar.svelte';

	let {
		lastTs,
		fallZoneHeight,
		fallZoneEl = $bindable(),
		onkeyPress
	} = $props();

	const BASE_SPEED = 0.22;
	let fretsCount = $derived(Number(gameState.fretsCount) || 24);

	let currentElapsed = $derived(
		gameState.startTime 
			? ((lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase) 
			: gameState.elapsedBase
	);

	const visibleStrums = $derived.by(() => {
		const strums = gameState.strums;
		if (!strums || strums.length === 0) return [];
		
		const pxPerMs = BASE_SPEED * gameState.speed;
		const fallTimeMs = fallZoneHeight / pxPerMs;
		
		let start = 0;
		let low = 0;
		let high = strums.length - 1;
		const lookbehindLimit = currentElapsed - (1000 / pxPerMs);

		while (low <= high) {
			let mid = Math.floor((low + high) / 2);
			if (strums[mid].t < lookbehindLimit) {
				low = mid + 1;
				start = mid;
			} else {
				high = mid - 1;
			}
		}

		const result = [];
		const lookaheadLimit = currentElapsed + fallTimeMs + 100;
		
		for (let i = start; i < strums.length; i++) {
			const strum = strums[i];
			if (strum.t > lookaheadLimit) break;
			
			const yBottom = fallZoneHeight - (strum.t - currentElapsed) * pxPerMs;
			if (yBottom > -50 && yBottom < fallZoneHeight + 50) {
				result.push(strum);
			}
		}
		return result;
	});

	const visibleNotes = $derived.by(() => {
		const notes = gameState.currentSong?.notes;
		if (!notes || notes.length === 0) return [];
		
		const pxPerMs = BASE_SPEED * gameState.speed;
		const fallTimeMs = fallZoneHeight / pxPerMs;
		
		let start = 0;
		let low = 0;
		let high = notes.length - 1;
		const lookbehindLimit = currentElapsed - (1000 / pxPerMs);

		while (low <= high) {
			let mid = Math.floor((low + high) / 2);
			if (notes[mid].t < lookbehindLimit) {
				low = mid + 1;
				start = mid;
			} else {
				high = mid - 1;
			}
		}

		const result = [];
		const lookaheadLimit = currentElapsed + fallTimeMs + 100;
		
		for (let i = start; i < notes.length; i++) {
			const note = notes[i];
			if (note.t > lookaheadLimit) break;
			
			const noteStartMs = note.t;
			const noteEndMs = note.t + note.d;
			const yTop = fallZoneHeight - (noteEndMs - currentElapsed) * pxPerMs;
			const yBottom = fallZoneHeight - (noteStartMs - currentElapsed) * pxPerMs;
			
			if (yBottom > 0 && yTop < fallZoneHeight) {
				result.push(note);
			}
		}
		return result;
	});

	function getFretLeftPercentage(fretIndex: number) {
		return (fretIndex / fretsCount) * 100;
	}

	const themes = {
		classic: {
			white: { bg: 'linear-gradient(to bottom, rgb(130 225 159), rgb(130 185 10))', shadow: '#00f5ff88' },
			black: { bg: 'linear-gradient(to bottom, #ff2d78bb, #ff2d78)', shadow: '#ff2d7888' },
		},
		ocean: {
			white: { bg: 'linear-gradient(to bottom, #67e8f9, #06b6d4)', shadow: '#06b6d488' },
			black: { bg: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)', shadow: '#1d4ed888' },
		},
		sunset: {
			white: { bg: 'linear-gradient(to bottom, #fde047, #f59e0b)', shadow: '#f59e0b88' },
			black: { bg: 'linear-gradient(to bottom, #c084fc, #9333ea)', shadow: '#9333ea88' },
		},
		synthwave: {
			white: { bg: 'linear-gradient(to bottom, #f9a8d4, #db2777)', shadow: '#db277788' },
			black: { bg: 'linear-gradient(to bottom, #818cf8, #4f46e5)', shadow: '#4f46e588' },
		},
		monochrome: {
			white: { bg: 'linear-gradient(to bottom, #d1d5db, #6b7280)', shadow: '#6b728088' },
			black: { bg: 'linear-gradient(to bottom, #4b5563, #1f2937)', shadow: '#1f293788' },
		},
		forest: {
			white: { bg: 'linear-gradient(to bottom, #4ade80, #16a34a)', shadow: '#16a34a88' },
			black: { bg: 'linear-gradient(to bottom, #166534, #14532d)', shadow: '#14532d88' },
		}
	};

	let canvasEl = $state<HTMLCanvasElement>();

	function draw() {
		if (!canvasEl || !fallZoneEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

		const containerWidth = fallZoneEl.clientWidth;
		const strumWidth = 64 * dpr;
		const totalContainerWidthDpr = containerWidth * dpr;

		// 1. Draw Strums on the left spacer area
		visibleStrums.forEach(strum => {
			const yBottom = (fallZoneHeight - (strum.t - currentElapsed) * pxPerMs) * dpr;
			const isHit = strum.notes.some((n: any) => n.hit);
			const isPlaying = currentElapsed >= strum.t - 50 && currentElapsed <= strum.t + 100;
			
			const boxSize = 32 * dpr;
			let boxX = (strumWidth / 2) - (boxSize / 2);
			if (gameState.isLeftHanded) {
				boxX = totalContainerWidthDpr - strumWidth + (strumWidth / 2) - (boxSize / 2);
			}
			
			const boxY = yBottom - (boxSize / 2);
			
			ctx.beginPath();
			ctx.roundRect(boxX, boxY, boxSize, boxSize, 6 * dpr);
			
			if (isHit || isPlaying) {
				const color = strum.dir === 'up' ? '#ec4899' : '#06b6d4';
				ctx.fillStyle = color + '66';
				ctx.strokeStyle = color + '80';
				ctx.shadowColor = color;
				ctx.shadowBlur = 10 * dpr;
			} else {
				ctx.fillStyle = '#0d1520cc';
				ctx.strokeStyle = 'rgba(255,255,255,0.1)';
				ctx.shadowBlur = 0;
			}
			ctx.fill();
			ctx.stroke();
			
			ctx.font = `bold ${18 * dpr}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = (isHit || isPlaying) ? (strum.dir === 'up' ? '#f472b6' : '#22d3ee') : '#64748b';
			ctx.fillText(strum.dir === 'up' ? '↑' : '↓', boxX + boxSize/2, boxY + boxSize/2);
			ctx.shadowBlur = 0;
		});

		// 2. Draw Notes
		const notesAreaX = gameState.isLeftHanded ? 0 : strumWidth;
		const notesAreaWidth = (containerWidth - 64) * dpr;

		// To optimize performance: Draw in batches or simplify rendering
		visibleNotes.forEach(note => {
			const pos = note.guitarPos || getGuitarPosition(note.midi, fretsCount);
			const blockH = Math.max(12, note.d * pxPerMs);
			const yBottom = (fallZoneHeight - (note.t - currentElapsed) * pxPerMs) * dpr;
			const yTop = yBottom - (blockH * dpr);
			const height = yBottom - yTop;
			
			const fretWidthPct = 100 / fretsCount;
			const fretWidthPx = (notesAreaWidth * fretWidthPct) / 100;
			
			let xPct = getFretLeftPercentage(pos.fretIndex);
			if (gameState.isLeftHanded) {
				xPct = 100 - xPct - fretWidthPct;
			}
			const x = notesAreaX + (notesAreaWidth * xPct / 100);
			const y = yTop;
			const w = fretWidthPx;
			const h = height;

			ctx.beginPath();
			ctx.roundRect(x, y, w, h, 2 * dpr);
			
			if (note.hit) {
				const gradient = ctx.createLinearGradient(x, y, x, y + h);
				gradient.addColorStop(0, '#fde047');
				gradient.addColorStop(1, '#facc15');
				ctx.fillStyle = gradient;
				ctx.shadowColor = '#facc15cc';
				ctx.shadowBlur = 8 * dpr;
				ctx.strokeStyle = '#eab308';
				ctx.globalAlpha = 0.5;
			} else {
				// Classic theme gradient simulation
				const g = ctx.createLinearGradient(x, y, x, y + h);
				g.addColorStop(0, '#82e19f'); 
				g.addColorStop(1, '#82b90a');
				ctx.fillStyle = g;
				ctx.shadowBlur = 0;
				ctx.strokeStyle = 'rgba(255,255,255,0.4)';
				ctx.globalAlpha = 0.95;
			}
			
			ctx.fill();
			ctx.stroke();
			ctx.globalAlpha = 1.0;
			ctx.shadowBlur = 0;
		});
	}

	$effect(() => {
		if (canvasEl && fallZoneEl) {
			const dpr = window.devicePixelRatio || 1;
			canvasEl.width = fallZoneEl.clientWidth * dpr;
			canvasEl.height = fallZoneHeight * dpr;
			canvasEl.style.width = `${fallZoneEl.clientWidth}px`;
			canvasEl.style.height = `${fallZoneHeight}px`;
		}
	});

	$effect(() => {
		if (lastTs || visibleNotes || visibleStrums) {
			draw();
		}
	});

	const pxPerMs = $derived(BASE_SPEED * gameState.speed);
	const currentTheme = $derived(themes[gameState.noteColor as keyof typeof themes] || themes.classic);
</script>

<main class="z-5 flex-1 self-stretch flex flex-col overflow-hidden">
	<div bind:this={fallZoneEl} class="relative flex flex-1 {gameState.isLeftHanded ? 'flex-row-reverse' : 'flex-row'} mb-48">
		<!-- Left Spacer (Grid-only) -->
		<div class="relative z-20 w-16 flex-shrink-0 {gameState.isLeftHanded ? 'border-l-2' : 'border-r-2'} border-pink-500/10 bg-transparent flex-[0_0_64px] overflow-hidden">
		</div>

		<!-- Falling zone -->
		<div class="relative flex-1 {gameState.backgroundMode === 'light' ? 'bg-slate-100' : 'bg-transparent'} bg-gradient-to-b from-transparent to-pink-500/5 transition-colors duration-500">
			{#each Array.from({ length: fretsCount + 1 }) as _, i}
				<div
					class="absolute top-0 bottom-0 w-px bg-pink-500/10"
					style="{gameState.isLeftHanded ? 'right' : 'left'}: {getFretLeftPercentage(i)}%;"
				></div>
			{/each}
			<div class="absolute bottom-0 h-[3px] w-full bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_15px_#ec4899]"></div>
		</div>

		<canvas bind:this={canvasEl} class="absolute inset-0 pointer-events-none z-30"></canvas>
	</div>

	<Guitar {onkeyPress} {fretsCount} />
</main>
