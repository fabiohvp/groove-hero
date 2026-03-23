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
</script>

<main class="z-5 flex-1 self-center overflow-x-auto overflow-y-hidden">
	<div class="relative h-full" style="width: {pianoLayout.totalWidth}px">
		<!-- Fall Zone -->
		<div
			bind:this={fallZoneEl}
			class="absolute inset-x-0 top-0 overflow-hidden bg-white bg-gradient-to-b from-transparent to-cyan-500/5"
			style="bottom: {pianoLayout.whiteH}px"
		>
			<!-- Vertical Guides -->
			{#each pianoLayout.keys.filter((k: { type: string }) => k.type === 'white') as key (key)}
				<div
					class="absolute inset-y-0 border-r border-black/5"
					style="left: {key.left}px; width: {key.width}px"
				></div>
			{/each}

			<!-- Falling Notes -->
			{#each gameState.currentSong.notes as note (note)}
				{@const elapsed = gameState.startTime
					? (lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase
					: gameState.elapsedBase}
				{@const currentTheme = themes[gameState.noteColor as keyof typeof themes] || themes.classic}
				{@const pxPerMs = BASE_SPEED * gameState.speed}
				{@const blockH = Math.max(12, note.d * pxPerMs)}
				{@const ty = (elapsed - note.t) * pxPerMs + (fallZoneHeight - blockH)}

				{#if ty > -blockH && ty < fallZoneHeight + 100}
					{@const key = pianoLayout.keys.find((k: { midi: number }) => k.midi === note.midi)}
					{#if key}
						<div
							class="absolute rounded-md border-2 shadow-lg transition-colors"
							style="left: {key.centerX - (key.width - 4) / 2}px; 
                                    width: {key.width - 4}px; 
                                    height: {blockH}px; 
                                    transform: translateY({ty}px);
									background: {note.hit
								? 'linear-gradient(to bottom, #fde047, #facc15)'
								: key.type === 'black'
									? currentTheme.black.bg
									: currentTheme.white.bg};
									box-shadow: 0 0 15px {note.hit ? '#facc1588' : key.type === 'black' ? currentTheme.black.shadow : currentTheme.white.shadow};
									border-color: {note.hit ? '#eab308' : 'rgba(255, 255, 255, 0.2)'};"
						></div>
					{/if}
				{/if}
			{/each}

			<!-- Hit Line -->
			<div
				class="absolute bottom-0 h-[3px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f5ff]"
			></div>
		</div>

		<Piano {pianoLayout} {onkeyDown} {onkeyUp} />
	</div>
</main>
