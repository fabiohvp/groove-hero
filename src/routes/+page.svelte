<script lang="ts">
	import Controls from '$lib/components/Controls.svelte';
	import GameArea from '$lib/components/GameArea.svelte';
	import Header from '$lib/components/Header.svelte';
	import Hud from '$lib/components/Hud.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import {
		fullReset,
		gameState,
		getProgress,
		handleKeyDown,
		handleKeyUp,
		handleSongSelect,
		handleSpeedChange,
		seekPercentage,
		togglePlay
	} from '$lib/game.svelte';
	import { onMount } from 'svelte';

	const PX_PER_MM = 1.782;

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
		const heightFactor = gameState.isKeyboardCompact ? 1.6 : 3.5;
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
</script>

<div
	class="relative flex h-screen flex-col overflow-hidden bg-[#080c14] font-['Rajdhani'] text-[#e2f0ff]"
>
	<!-- Efeito de Grade de Fundo (Exato como original) -->
	<div
		class="pointer-events-none fixed inset-0 z-0"
		style="background: radial-gradient(ellipse at 20% 0%, rgba(0,245,255,0.07) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 0%, rgba(255,45,120,0.07) 0%, transparent 60%),
                     repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,245,255,0.03) 40px),
                     repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,245,255,0.03) 40px);"
	></div>

	<Header />

	<Controls
		playing={gameState.playing}
		hasSong={!!gameState.currentSongInfo}
		ontogglePlay={togglePlay}
		onfullReset={fullReset}
		onsongSelect={handleSongSelect}
	/>

	<Hud
		score={gameState.score}
		speed={gameState.speed}
		bind:keyCount={gameState.keyCount}
		bind:keyWidthMM={gameState.keyWidthMM}
		loop={gameState.loop}
		isKeyboardCompact={gameState.isKeyboardCompact}
		soundMode={gameState.soundMode}
		onspeedChange={handleSpeedChange}
		ontoggleLoop={() => (gameState.loop = !gameState.loop)}
		ontoggleKeyboardCompact={() => (gameState.isKeyboardCompact = !gameState.isKeyboardCompact)}
		ontoggleSoundMode={() =>
			(gameState.soundMode = gameState.soundMode === 'music' ? 'player' : 'music')}
	/>

	<Timeline progress={getProgress()} elapsedBase={gameState.elapsedBase} onseek={seek} />

	<GameArea
		{pianoLayout}
		lastTs={gameState.lastTs}
		bind:fallZoneEl
		fallZoneHeight={gameState.fallZoneHeight}
		onkeyDown={handleKeyDown}
		onkeyUp={handleKeyUp}
	/>
</div>

<style>
</style>
