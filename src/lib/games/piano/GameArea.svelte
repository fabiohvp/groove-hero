<script lang="ts">
	import { gameState } from '$lib/games/piano/game.svelte';
	import Piano from './Piano.svelte';

	let {
		pianoLayout,
		lastTs,
		fallZoneHeight,
		fallZoneEl = $bindable(),
		onkeyDown,
		onkeyUp
	} = $props();

	const BASE_SPEED = 0.22;

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

	import type { KeyLayout } from '$lib/types';

	// Pre-index keys by MIDI for O(1) lookup
	const keyMap = $derived(
		new Map<number, KeyLayout>(pianoLayout.keys.map((k: KeyLayout) => [k.midi, k]))
	);

	// Calculate frame-wide constants once
	const elapsed = $derived(gameState.startTime
		? (lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase
		: gameState.elapsedBase);
	
	const pxPerMs = $derived(BASE_SPEED * gameState.speed);
	const currentTheme = $derived(themes[gameState.noteColor as keyof typeof themes] || themes.classic);

	// Derived: only the notes currently visible in the fall zone (Optimized O(log N + K))
	const visibleNotes = $derived.by(() => {
		const notes = gameState.currentSong?.notes;
		if (!notes || notes.length === 0) return [];
		
		// Buffer for "fall time" and Note duration
		// We want to include notes that ARE currently falling or about to fall
		// Fall time in ms = fallZoneHeight / pxPerMs
		const fallTimeMs = fallZoneHeight / pxPerMs;
		
		// Find first note that could be on screen
		// Binary search for note.t where note.t + note.d >= elapsed - buffer
		// For simplicity, let's look for notes starting within a window
		let start = 0;
		let low = 0;
		let high = notes.length - 1;
		
		const lookbehindLimit = elapsed - (1000 / pxPerMs); // approx 1000px check

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
		const lookaheadLimit = elapsed + fallTimeMs + 100; // time window
		
		for (let i = start; i < notes.length; i++) {
			const note = notes[i];
			if (note.t > lookaheadLimit) break;
			
			const blockH = Math.max(12, note.d * pxPerMs);
			const ty = (elapsed - note.t) * pxPerMs + (fallZoneHeight - blockH);
			
			if (ty > -blockH - 100 && ty < fallZoneHeight + 100) {
				result.push(note);
			}
		}
		return result;
	});
	let canvasEl = $state<HTMLCanvasElement>();
	
	function draw() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

		// Scaling for high DPI
		const dpr = window.devicePixelRatio || 1;
		
		visibleNotes.forEach(note => {
			const blockH = Math.max(12, note.d * pxPerMs);
			const ty = (elapsed - note.t) * pxPerMs + (fallZoneHeight - blockH);
			const key = keyMap.get(note.midi);
			if (!key) return;

			const x = (key.centerX - (key.width - 4) / 2) * dpr;
			const y = ty * dpr;
			const w = (key.width - 4) * dpr;
			const h = blockH * dpr;
			const radius = 4 * dpr;

			ctx.beginPath();
			ctx.roundRect(x, y, w, h, radius);
			
			// Fill style (mimicking gradients)
			let gradient = ctx.createLinearGradient(x, y, x, y + h);
			if (note.hit) {
				gradient.addColorStop(0, '#fde047');
				gradient.addColorStop(1, '#facc15');
				ctx.shadowColor = '#facc1588';
				ctx.strokeStyle = '#eab308';
			} else if (key.type === 'black') {
				// Rough approximation of the CSS gradient: #ff2d78bb, #ff2d78
				gradient.addColorStop(0, '#ff2d78bb'); 
				gradient.addColorStop(1, '#ff2d78');
				ctx.shadowColor = '#ff2d7888';
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
			} else {
				// Rough approximation of the CSS gradient: rgb(130 225 159), rgb(130 185 10)
				gradient.addColorStop(0, '#82e19f'); 
				gradient.addColorStop(1, '#82b90a');
				ctx.shadowColor = '#00f5ff88';
				ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
			}
			
			ctx.fillStyle = gradient;
			ctx.shadowBlur = 10 * dpr;
			ctx.fill();
			ctx.lineWidth = 1 * dpr;
			ctx.stroke();
			
			// Reset shadow for next note
			ctx.shadowBlur = 0;
		});
	}

	$effect(() => {
		if (canvasEl) {
			const dpr = window.devicePixelRatio || 1;
			canvasEl.width = (pianoLayout.totalWidth || 0) * dpr;
			canvasEl.height = fallZoneHeight * dpr;
			canvasEl.style.width = `${pianoLayout.totalWidth}px`;
			canvasEl.style.height = `${fallZoneHeight}px`;
		}
	});

	$effect(() => {
		// Trigger redraw on frame updates
		if (lastTs || visibleNotes) {
			draw();
		}
	});
</script>

<main class="z-5 flex-1 self-center overflow-x-auto overflow-y-hidden">
	<div class="relative h-full" style="width: {pianoLayout.totalWidth}px">
		<!-- Fall Zone -->
		<div
			bind:this={fallZoneEl}
			class="absolute inset-x-0 top-0 overflow-hidden {gameState.backgroundMode === 'light' ? 'bg-slate-100' : 'bg-transparent'} bg-gradient-to-b from-transparent to-cyan-500/5 transition-colors duration-500"
			style="bottom: {pianoLayout.whiteH}px"
		>
			<!-- Vertical Guides -->
			{#each pianoLayout.keys.filter((k: { type: string }) => k.type === 'white') as key (key)}
				<div
					class="absolute inset-y-0 border-r border-black/5"
					style="left: {key.left}px; width: {key.width}px"
				></div>
			{/each}

			<!-- Falling Notes - Canvas based for high performance -->
			<canvas bind:this={canvasEl} class="absolute inset-0 pointer-events-none"></canvas>

			<!-- Hit Line -->
			<div
				class="absolute bottom-0 h-[3px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f5ff]"
			></div>
		</div>

		<Piano {pianoLayout} {onkeyDown} {onkeyUp} />
	</div>
</main>
