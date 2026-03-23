<script lang="ts">
	import Controls from '$lib/components/Controls.svelte';
	import Header from '$lib/components/Header.svelte';
	import Hud from '$lib/games/guitar/Hud.svelte';
	import GameArea from '$lib/games/guitar/GameArea.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import {
		gameState,
		getProgress,
		handleSongSelect,
		handleSpeedChange,
		restartGame,
		seekPercentage,
		togglePlay,
		fullReset
	} from '$lib/games/guitar/game.svelte';
	import { onMount, onDestroy } from 'svelte';

	onDestroy(() => {
		fullReset();
	});

	let showTopBars = $state(true);
	let fallZoneEl = $state<HTMLElement>();

	onMount(() => {
		const observer = new ResizeObserver(
			() => (gameState.fallZoneHeight = fallZoneEl?.clientHeight || 0)
		);
		if (fallZoneEl) observer.observe(fallZoneEl);
		return () => observer.disconnect();
	});

	function seek(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		seekPercentage(pct);
	}
</script>

<div
	class="relative flex h-screen flex-col overflow-hidden bg-[#080c14] font-['Rajdhani'] text-[#e2f0ff]"
>
	<!-- Background Grid Effect -->
	<div
		class="pointer-events-none fixed inset-0 z-0"
		style="background: radial-gradient(ellipse at 20% 0%, rgba(255,45,120,0.07) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 0%, rgba(0,245,255,0.07) 0%, transparent 60%),
                     repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(236,72,153,0.03) 40px),
                     repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(236,72,153,0.03) 40px);"
	></div>

	<button
		class="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/20 text-pink-400 backdrop-blur transition-all hover:bg-pink-500/40"
		onclick={() => (showTopBars = !showTopBars)}
		title={showTopBars ? 'Hide options' : 'Show options'}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			{#if showTopBars}
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
			{:else}
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			{/if}
		</svg>
	</button>

	{#if showTopBars}
		<Header />

		<Controls
			playing={gameState.playing}
			hasSong={!!gameState.currentSongInfo}
			ontogglePlay={togglePlay}
			onfullReset={restartGame}
			onsongSelect={handleSongSelect}
		/>

		<Hud
			score={gameState.score}
			speed={gameState.speed}
			bind:fretsCount={gameState.fretsCount}
			bind:noteColor={gameState.noteColor}
			loop={gameState.loop}
			soundMode={gameState.soundMode}
			onspeedChange={handleSpeedChange}
			ontoggleLoop={() => (gameState.loop = !gameState.loop)}
			ontoggleSoundMode={() =>
				(gameState.soundMode = gameState.soundMode === 'music' ? 'player' : 'music')}
		/>

		<Timeline 
			progress={getProgress()} 
			elapsedBase={gameState.elapsedBase} 
			onseek={seek} 
			disabled={!gameState.currentSongInfo}
		/>
	{/if}

	<GameArea
		lastTs={gameState.lastTs}
		bind:fallZoneEl
		fallZoneHeight={gameState.fallZoneHeight}
		onkeyPress={(s: number, f: number) => {}}
	/>

	{#if gameState.countdown !== null}
		<div
			class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#080c14]/50 backdrop-blur-sm"
		>
			<span
				class="font-['Orbitron'] text-[15rem] font-bold text-pink-400 drop-shadow-[0_0_40px_rgba(236,72,153,0.8)]"
				style="animation: pulse 1s infinite alternate;"
			>
				{gameState.countdown}
			</span>
		</div>
	{/if}
</div>
