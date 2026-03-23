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

	let strums = $derived.by(() => {
		if (!gameState.currentSong?.notes) return [];
		// Extract unique strum/hit attack times from all notes
		const uniqueTimes = Array.from(new Set(gameState.currentSong.notes.map(n => n.t))).sort((a,b) => a-b);
		
		return uniqueTimes.map((t, index) => {
			const notes = gameState.currentSong!.notes.filter(n => n.t === t);
			return {
				t,
				// Alternate up and down arrows for consecutive guitar strums
				dir: index % 2 === 0 ? 'down' : 'up',
				notes,
			};
		});
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
</script>

<main class="z-5 flex-1 self-stretch flex flex-col overflow-hidden">
	<!-- Top Area: Falling Notes container -->
	<div class="relative flex flex-1 flex-row mb-48" bind:this={fallZoneEl}>
		
		<!-- Left Spacer matching Guitar strumming patterns width: 32 tailwind width units (128px) -->
		<div class="relative z-20 w-32 flex-shrink-0 border-r-2 border-pink-500/10 bg-transparent flex-[0_0_128px] overflow-hidden">
			<!-- Falling Strum Directions -->
			{#each strums as strum}
				{@const pxPerMs = BASE_SPEED * gameState.speed}
				{@const yBottom = fallZoneHeight - (strum.t - currentElapsed) * pxPerMs}
				{@const isHit = strum.notes.some(n => n.hit)}
				{@const isPlaying = currentElapsed >= strum.t - 50 && currentElapsed <= strum.t + 100}

				{#if yBottom > -50 && yBottom < fallZoneHeight + 50}
					<div
						class="absolute flex w-full items-center justify-center transition-all"
						style="top: {yBottom - 16}px;"
					>
						<div class="flex h-8 w-8 items-center justify-center rounded-lg border {(isHit || isPlaying) ? (strum.dir === 'up' ? 'border-pink-500/50 bg-pink-500/40 shadow-[0_0_15px_#ec4899]' : 'border-cyan-500/50 bg-cyan-500/40 shadow-[0_0_15px_#00f5ff]') : 'border-white/10 bg-[#0d1520]/80 shadow-md'}">
							<span class="text-lg font-bold {(isHit || isPlaying) ? (strum.dir === 'up' ? 'text-pink-400' : 'text-cyan-400') : 'text-slate-500'}">
								{strum.dir === 'up' ? '↑' : '↓'}
							</span>
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Falling zone corresponding to the fretboard -->
		<div class="relative flex-1 bg-gradient-to-b from-transparent to-pink-500/5">
			
			<!-- Vertical Guide Lines per Fret -->
			{#each Array.from({ length: fretsCount + 1 }) as _, i}
				<div
					class="absolute top-0 bottom-0 w-px bg-pink-500/10"
					style="left: {getFretLeftPercentage(i)}%;"
				></div>
			{/each}

			<!-- Falling Notes loop would go here, mapped by (note.fret) or similar -->
			{#if gameState.currentSong?.notes}
				{#each gameState.currentSong.notes as note (note)}
					{@const pos = getGuitarPosition(note.midi, fretsCount)}
					{@const noteStartMs = note.t}
					{@const noteEndMs = note.t + note.d}

					{@const pxPerMs = BASE_SPEED * gameState.speed}
					
					{@const yTop = fallZoneHeight - (noteEndMs - currentElapsed) * pxPerMs}
					{@const yBottom = fallZoneHeight - (noteStartMs - currentElapsed) * pxPerMs}
					{@const height = yBottom - yTop}

					{@const currentTheme = themes[gameState.noteColor as keyof typeof themes] || themes.classic}

					{#if yBottom > 0 && yTop < fallZoneHeight}
						<div
							class="absolute rounded-sm border-b-4 opacity-90 transition-all"
							style="
								left: {getFretLeftPercentage(pos.fretIndex)}%;
								width: {100 / fretsCount}%;
								top: {yTop}px;
								height: {height}px;
								background: {note.hit ? 'linear-gradient(to bottom, #fde047, #facc15)' : currentTheme.white.bg};
								box-shadow: 0 0 15px {note.hit ? '#facc1588' : currentTheme.white.shadow};
								border-color: {note.hit ? '#eab308' : 'rgba(255,255,255,0.4)'};
								{note.hit ? 'opacity: 0.3; filter: brightness(1.5);' : ''}
							"
						>
						</div>
					{/if}
				{/each}
			{/if}

			<!-- Hit Line just above the fretboard -->
			<div
				class="absolute bottom-0 h-[3px] w-full bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_15px_#ec4899]"
			></div>
		</div>
	</div>

	<!-- Bottom Area: The Interactive Guitar Component -->
	<Guitar {onkeyPress} {fretsCount} />
</main>
