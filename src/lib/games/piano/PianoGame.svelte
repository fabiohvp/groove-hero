<script lang="ts">
	import Controls from '$lib/components/Controls.svelte';
	import Header from '$lib/components/Header.svelte';
	import OptionsToggle from '$lib/components/OptionsToggle.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import {
		fullReset,
		gameState,
		getProgress,
		handleKeyDown,
		handleKeyUp,
		handleSongSelect,
		handleSpeedChange,
		restartGame,
		seekPercentage,
		togglePlay
	} from '$lib/games/piano/game.svelte';
	import GameArea from '$lib/games/piano/GameArea.svelte';
	import Hud from '$lib/games/piano/Hud.svelte';
	import { onDestroy, onMount } from 'svelte';

	onDestroy(() => {
		fullReset();
	});

	const PX_PER_MM = 1.782;

	let showTopBars = $state(true);

	let fallZoneEl = $state<HTMLElement>();

	onMount(() => {
		const observer = new ResizeObserver(
			() => (gameState.fallZoneHeight = fallZoneEl!.clientHeight)
		);
		observer.observe(fallZoneEl!);
		return () => observer.disconnect();
	});

	const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);

	let pianoLayout = $derived.by(() => {
		const startMidi = 36;
		const kw = gameState.keyWidthMM * PX_PER_MM;
		const bw = kw * 0.62;
		const heightFactor = gameState.isKeyboardCompact ? 1.6 : 2.4;
		const wh = kw * heightFactor;
		const bh = wh * 0.63;

		let whiteCount = 0;
		const keys = Array.from({ length: gameState.keyCount }, (_, i) => {
			const midi = startMidi + i;
			const black = isBlack(midi);
			if (!black) {
				const left = whiteCount * kw;
				whiteCount++;
				return { midi, type: 'white', left, width: kw, height: wh, centerX: left + kw / 2 };
			} else {
				const left = whiteCount * kw - bw / 2;
				return { midi, type: 'black', left, width: bw, height: bh, centerX: left + bw / 2 };
			}
		});

		return { keys, totalWidth: whiteCount * kw, whiteH: wh };
	});

	function seek(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		seekPercentage(pct);
	}

	function toggleOptions() {
		showTopBars = !showTopBars;
		// Auto start or resume the game if hiding the menu while a song exists
		if (!showTopBars && gameState.currentSongInfo && !gameState.playing) {
			togglePlay();
		}
	}
</script>

<div
	class="relative flex h-screen flex-col overflow-hidden bg-[#080c14] font-['Rajdhani'] text-[#e2f0ff]"
>
	<!-- Background Grid Effect -->
	<div
		class="pointer-events-none fixed inset-0 z-0"
		style="background: radial-gradient(ellipse at 20% 0%, rgba(0,245,255,0.07) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 0%, rgba(255,45,120,0.07) 0%, transparent 60%),
                     repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,245,255,0.03) 40px),
                     repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,245,255,0.03) 40px);"
	></div>

	<OptionsToggle {showTopBars} color="cyan" ontoggle={toggleOptions} />

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
			bind:keyCount={gameState.keyCount}
			bind:keyWidthMM={gameState.keyWidthMM}
			bind:noteColor={gameState.noteColor}
			bind:backgroundMode={gameState.backgroundMode}
			loop={gameState.loop}
			isKeyboardCompact={gameState.isKeyboardCompact}
			soundMode={gameState.soundMode}
			onspeedChange={handleSpeedChange}
			ontoggleLoop={() => (gameState.loop = !gameState.loop)}
			ontoggleKeyboardCompact={() => (gameState.isKeyboardCompact = !gameState.isKeyboardCompact)}
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
		{pianoLayout}
		lastTs={gameState.lastTs}
		bind:fallZoneEl
		fallZoneHeight={gameState.fallZoneHeight}
		onkeyDown={handleKeyDown}
		onkeyUp={handleKeyUp}
	/>

	{#if gameState.countdown !== null}
		<div
			class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#080c14]/50 backdrop-blur-sm"
		>
			<span
				class="font-['Orbitron'] text-[15rem] font-bold text-cyan-400 drop-shadow-[0_0_40px_rgba(0,245,255,0.8)]"
				style="animation: pulse 1s infinite alternate;"
			>
				{gameState.countdown}
			</span>
		</div>
	{/if}
</div>
