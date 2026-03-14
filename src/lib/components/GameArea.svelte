<script lang="ts">
	import { gameState } from '$lib/game.svelte';
	import Piano from './Piano.svelte';

	let { pianoLayout, lastTs, fallZoneHeight, fallZoneEl = $bindable(), onkeyDown, onkeyUp } = $props();

	const BASE_SPEED = 0.22;
</script>

<main class="z-5 flex-1 self-center overflow-x-auto overflow-y-hidden">
	<div class="relative h-full" style="width: {pianoLayout.totalWidth}px">
		<!-- Fall Zone -->
		<div
			bind:this={fallZoneEl}
			class="absolute inset-x-0 top-0 overflow-hidden bg-gradient-to-b from-transparent to-cyan-500/5"
			style="bottom: {pianoLayout.whiteH}px"
		>
			<!-- Guias Verticais -->
			{#each pianoLayout.keys.filter((k: { type: string }) => k.type === 'white') as key (key)}
				<div
					class="absolute inset-y-0 border-r border-cyan-500/5"
					style="left: {key.left}px; width: {key.width}px"
				></div>
			{/each}

			<!-- Notas Caindo -->
			{#each gameState.currentSong.notes as note (note)}
				{@const elapsed = gameState.startTime ? (lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase : gameState.elapsedBase}
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
									? 'linear-gradient(to bottom, #ff2d78bb, #ff2d78)'
									: 'linear-gradient(to bottom, #00f5ffbb, #00f5ff)'};
									box-shadow: 0 0 15px {note.hit ? '#facc1588' : key.type === 'black' ? '#ff2d7888' : '#00f5ff88'};
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

		<Piano {pianoLayout} onkeyDown={onkeyDown} onkeyUp={onkeyUp} />
	</div>
</main>
