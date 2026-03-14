<script lang="ts">
	import { playNote, stopAllNotes } from '$lib/audio';
	import { game } from '$lib/game.svelte';
	import MusicSearch from '$lib/MusicSearch.svelte';
	import type { MidiFileInfo } from '$lib/types';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	const PX_PER_MM = 1.782;
	const BASE_SPEED = 0.22;
	const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	let fallZoneEl: HTMLElement;
	let fallZoneHeight = $state(360); // Default height, will be updated on mount

	onMount(() => {
		const observer = new ResizeObserver(() => (fallZoneHeight = fallZoneEl.clientHeight));
		observer.observe(fallZoneEl);
		return () => observer.disconnect();
	});

	let isKeyboardCompact = $state(true);

	let lastTs = $state(performance.now());
	let lastFrameTime = $state(performance.now());
	let scheduledNotes: any[] = [];
	const pressedKeys = new SvelteMap<number, boolean>();

	// --- Lógica do Layout do Piano ---
	const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);

	let pianoLayout = $derived.by(() => {
		const startMidi = 36;
		const kw = game.keyWidthMM * PX_PER_MM;
		const bw = kw * 0.62;
		const heightFactor = isKeyboardCompact ? 1.6 : 3.5; // 5.5 is original, 2.2 is 60% reduction
		const wh = kw * heightFactor;
		const bh = wh * 0.63;

		let whiteCount = 0;
		const keys = [];

		for (let i = 0; i < game.keyCount; i++) {
			const midi = startMidi + i;
			const black = isBlack(midi);
			if (!black) {
				const left = whiteCount * kw;
				keys.push({ midi, type: 'white', left, width: kw, height: wh, centerX: left + kw / 2 });
				whiteCount++;
			} else {
				const left = whiteCount * kw - bw / 2;
				keys.push({ midi, type: 'black', left, width: bw, height: bh, centerX: left + bw / 2 });
			}
		}
		return { keys, totalWidth: whiteCount * kw, whiteH: wh };
	});

	// --- Loop de Jogo ---
	function tick(ts: number) {
		if (!game.playing) return;
		if (!game.startTime) game.startTime = ts;

		const frameDurationMs = ts - lastFrameTime;
		lastFrameTime = ts;
		lastTs = ts;

		const currentElapsed = game.elapsedBase + (ts - game.startTime) * game.speed;

		// Lógica de pontuação por sustentação
		const scorePerSecond = 100;
		const frameScore = (scorePerSecond * frameDurationMs) / 1000;

		for (const midi of pressedKeys.keys()) {
			const activeNote = game.currentSong.notes.find(
				(n) => n.midi === midi && currentElapsed >= n.t && currentElapsed < n.t + n.d
			);

			if (activeNote && activeNote.hit) {
				game.score += frameScore;
			}
		}

		if (currentElapsed >= game.duration) {
			if (game.loop) {
				restartGame();
			} else {
				fullReset();
			}
			return;
		}

		requestAnimationFrame(tick);
	}

	function resetHits() {
		if (game.currentSong?.notes) {
			game.currentSong.notes.forEach((n: any) => (n.hit = false));
		}
	}

	function fullReset() {
		game.stop();
		resetHits();
	}

	function restartGame() {
		game.reset();
		resetHits();
		clearAudio();
		// When looping, we want to ensure the game continues to play,
		// so we set `playing` to true and restart the animation loop.
		game.playing = true;
		game.startTime = performance.now();
		lastFrameTime = game.startTime;
		startAudio();
		requestAnimationFrame(tick);
	}

	function togglePlay() {
		game.playing = !game.playing;
		if (game.playing) {
			if (progress === 0) {
				restartGame();
			} else {
				lastTs = performance.now();
				lastFrameTime = lastTs;
				startAudio();
				requestAnimationFrame(tick);
			}
		} else {
			if (game.startTime) {
				game.elapsedBase += (lastTs - game.startTime) * game.speed;
			}
			game.startTime = null;
			clearAudio();
		}
	}

	function handleSpeedChange(e: Event) {
		const newSpeed = parseFloat((e.currentTarget as HTMLInputElement).value);

		if (game.playing && game.startTime) {
			const now = performance.now();
			game.elapsedBase += (now - game.startTime) * game.speed;
			game.startTime = now;
			lastTs = now;
			game.speed = newSpeed;
			startAudio();
		} else {
			game.speed = newSpeed;
		}
	}

	function handleSongSelect(selectedSongInfo: MidiFileInfo | null) {
		game.currentSongInfo = selectedSongInfo;
		fullReset();
	}

	function handleKeyDown(midi: number) {
		if (pressedKeys.has(midi)) return;
		pressedKeys.set(midi, true);

		if (game.playing && game.startTime) {
			const currentElapsed = (performance.now() - game.startTime) * game.speed + game.elapsedBase;
			const note = game.currentSong.notes.find(
				(n) => n.midi === midi && !n.hit && currentElapsed >= n.t && currentElapsed < n.t + n.d
			);
			if (note) {
				note.hit = true;
			}
		}
	}

	function handleKeyUp(midi: number) {
		if (!pressedKeys.has(midi)) return;
		pressedKeys.delete(midi);
	}

	function startAudio() {
		clearAudio();
		game.currentSong.notes.forEach((note) => {
			const elapsed = game.startTime
				? (lastTs - game.startTime) * game.speed + game.elapsedBase
				: game.elapsedBase;

			if (note.t >= elapsed) {
				const delay = (note.t - elapsed) / game.speed;
				const id = window.setTimeout(() => {
					if (game.playing && !note.hit) playNote(note.midi, note.d, game.speed);
				}, delay);
				scheduledNotes.push(id);
			}
		});
	}

	function clearAudio() {
		scheduledNotes.forEach(clearTimeout);
		scheduledNotes = [];
		stopAllNotes();
	}

	function seek(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		game.elapsedBase = pct * game.duration;

		if (game.playing) {
			lastTs = performance.now();
			game.startTime = lastTs;
			startAudio();
		}
	}

	// --- Derived progress state ---
	// Agora ele reage automaticamente toda vez que o lastTs muda no tick
	let progress = $derived(
		Math.min(
			1,
			(game.startTime
				? (lastTs - game.startTime) * game.speed + game.elapsedBase
				: game.elapsedBase) / game.duration
		)
	);
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

	<!-- Header -->
	<header
		class="z-10 flex w-full items-center border-b border-cyan-500/10 bg-[#080c14]/90 px-8 py-4 backdrop-blur-xl"
	>
		<div class="flex items-center gap-3">
			<div
				class="relative flex h-10 w-10 rotate-[15deg] items-center justify-center rounded border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,245,255,0.5)]"
			>
				<div class="clip-piano h-5 w-5 -rotate-[15deg] bg-cyan-400"></div>
			</div>
			<div>
				<h1
					class="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text font-['Orbitron'] text-xl font-black tracking-widest text-transparent"
				>
					PIANOFLOW
				</h1>
				<p class="-mt-1 text-[10px] tracking-[4px] text-slate-500 uppercase">Learn & Play</p>
			</div>
		</div>
	</header>

	<!-- Controls & Songs -->
	<div
		class="z-20 flex w-full items-center gap-4 border-b border-cyan-500/10 bg-[#0d1520]/95 px-6 py-2"
	>
		<button
			onclick={togglePlay}
			class="rounded bg-gradient-to-br from-cyan-400 to-cyan-600 px-5 py-2 font-['Orbitron'] text-[10px] font-bold tracking-widest text-black transition-all hover:shadow-[0_0_15px_#00f5ff]"
		>
			{game.playing ? '⏸ PAUSE' : '▶ PLAY'}
		</button>
		<button
			onclick={() => fullReset()}
			class="rounded border border-pink-500 px-5 py-2 font-['Orbitron'] text-[10px] font-bold tracking-widest text-pink-500 transition-all hover:bg-pink-500/10"
		>
			↺ RESTART
		</button>
		<div class="h-6 w-px bg-cyan-500/20"></div>
		<MusicSearch onSelect={handleSongSelect} />
	</div>

	<!-- HUD -->
	<div
		class="z-10 flex flex-wrap items-center gap-8 border-b border-cyan-500/5 bg-[#0b111b]/98 px-8 py-2"
	>
		<div class="flex items-center gap-3">
			<span class="text-[10px] tracking-widest text-slate-500 uppercase">Pontuação</span>
			<span
				class="font-['Orbitron'] text-xl text-yellow-400 drop-shadow-[0_0_8px_rgba(255,230,0,0.5)]"
				>{Math.round(game.score)}</span
			>
		</div>
		<div class="h-5 w-px bg-cyan-500/10"></div>
		<div class="flex items-center gap-3">
			<span class="text-[10px] tracking-widest text-slate-500 uppercase">Velocidade</span>
			<input
				type="number"
				min="0.25"
				max="5"
				step="0.25"
				value={game.speed}
				oninput={handleSpeedChange}
				class="w-16 cursor-pointer appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/10 text-center"
			/>
		</div>
		<div class="h-5 w-px bg-cyan-500/10"></div>
		<div class="flex items-center gap-3">
			<span class="text-[10px] tracking-widest text-slate-500 uppercase">Teclas</span>
			<div class="relative">
				<select
					bind:value={game.keyCount}
					class="appearance-none rounded border border-cyan-500/20 bg-cyan-500/5 py-1.5 pr-8 pl-4 text-xs font-semibold text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
				>
					<option class="bg-[#0d1520] font-sans" value={25}>25</option>
					<option class="bg-[#0d1520] font-sans" value={49}>49</option>
					<option class="bg-[#0d1520] font-sans" value={61}>61</option>
					<option class="bg-[#0d1520] font-sans" value={88}>88</option>
				</select>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400"
				>
					<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"
						><path
							d="M5.516 7.548c.436-.446 1.143-.446 1.579 0L10 10.405l2.905-2.857c.436-.446 1.143-.446 1.579 0 .436.445.436 1.167 0 1.612l-3.694 3.639c-.436.445-1.143.445-1.579 0L5.516 9.16c-.436-.445-.436-1.167 0-1.612z"
						/></svg
					>
				</div>
			</div>
		</div>
		<div class="h-5 w-px bg-cyan-500/10"></div>
		<div class="flex items-center gap-3">
			<span class="text-[10px] tracking-widest text-slate-500 uppercase">Largura</span>
			<input
				type="number"
				min="9"
				max="24"
				step="0.1"
				bind:value={game.keyWidthMM}
				class="w-16 cursor-pointer appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/10 text-center"
			/>
		</div>
		<div class="h-5 w-px bg-cyan-500/10"></div>
		<button
			onclick={() => (game.loop = !game.loop)}
			class="flex cursor-pointer items-center gap-2 text-[10px] tracking-widest uppercase transition-colors {game.loop
				? 'text-cyan-400'
				: 'text-slate-500'}"
		>
			<span
				class="flex h-4 w-4 items-center justify-center rounded-full border border-current {game.loop
					? 'animate-spin-slow'
					: ''}">↻</span
			>
			Loop
		</button>
		<div class="h-5 w-px bg-cyan-500/10"></div>
		<button
			onclick={() => (isKeyboardCompact = !isKeyboardCompact)}
			class="flex cursor-pointer items-center gap-2 text-[10px] tracking-widest uppercase transition-colors {isKeyboardCompact
				? 'text-cyan-400'
				: 'text-slate-500'}"
			title={isKeyboardCompact ? 'Restaurar altura do teclado' : 'Diminuir altura do teclado'}
		>
			<svg
				class="h-4 w-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
				/>
			</svg>
			<span>Altura</span>
		</button>
	</div>

	<!-- Timeline -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="z-10 flex h-8 w-full cursor-pointer items-center gap-4 border-b border-cyan-500/10 bg-[#080c14]/98 px-4"
		onclick={seek}
	>
		<div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-cyan-500/10">
			<!-- progress is now a derived state in the script -->
			<div
				class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-cyan-600 shadow-[0_0_10px_#00f5ff]"
				style="width: {progress * 100}%"
			></div>
		</div>
		<span class="min-w-[80px] text-right font-['Orbitron'] text-[10px] text-slate-500">
			{Math.floor(game.elapsedBase / 1000 / 60)}:{(Math.floor(game.elapsedBase / 1000) % 60)
				.toString()
				.padStart(2, '0')}
		</span>
	</div>

	<!-- Game Area -->
	<main class="z-5 flex-1 self-center overflow-x-auto overflow-y-hidden">
		<div class="relative h-full" style="width: {pianoLayout.totalWidth}px">
			<!-- Fall Zone -->
			<div
				bind:this={fallZoneEl}
				class="absolute inset-x-0 top-0 overflow-hidden bg-gradient-to-b from-transparent to-cyan-500/5"
				style="bottom: {pianoLayout.whiteH}px"
			>
				<!-- Guias Verticais -->
				{#each pianoLayout.keys.filter((k) => k.type === 'white') as key (key)}
					<div
						class="absolute inset-y-0 border-r border-cyan-500/5"
						style="left: {key.left}px; width: {key.width}px"
					></div>
				{/each}

				<!-- Notas Caindo -->
				{#each game.currentSong.notes as note (note)}
					{@const elapsed = game.startTime
						? (lastTs - game.startTime) * game.speed + game.elapsedBase
						: game.elapsedBase}
					{@const pxPerMs = BASE_SPEED * game.speed}
					{@const blockH = Math.max(12, note.d * pxPerMs)}
					{@const ty = (elapsed - note.t) * pxPerMs + (fallZoneHeight - blockH)}

					{#if ty > -blockH && ty < fallZoneHeight + 100}
						{@const key = pianoLayout.keys.find((k) => k.midi === note.midi)}
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

			<!-- Teclado (Estilo Original) -->
			<div
				class="absolute right-0 bottom-0 left-0 border-t-2 border-cyan-500/20 bg-gradient-to-b from-[#060a10] to-[#0d1520] shadow-[0_-4px_30px_rgba(0,245,255,0.1)]"
				style="height: {pianoLayout.whiteH}px"
			>
				{#each pianoLayout.keys as key (key)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onmousedown={() => handleKeyDown(key.midi)}
						onmouseup={() => handleKeyUp(key.midi)}
						onmouseleave={() => handleKeyUp(key.midi)}
						class="absolute top-0 transition-all active:translate-y-1 active:scale-y-[0.98]
                    {key.type === 'white'
							? 'z-10 border border-t-[3px] border-cyan-500/30 bg-gradient-to-b from-[#d0e8f5] via-[#f0faff] to-[#e0f2ff] shadow-md'
							: 'z-20 border border-t-2 border-cyan-500/10 bg-gradient-to-b from-[#0a0f1a] via-[#1a2540] to-[#0d1828] shadow-2xl'}"
						style="left: {key.left}px; width: {key.width}px; height: {key.height}px; border-radius: 0 0 6px 6px;"
					>
						<span
							class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-30 select-none {key.type ===
							'black'
								? 'text-white'
								: 'text-black'}"
						>
							{NOTE_NAMES[key.midi % 12]}{Math.floor(key.midi / 12) - 1}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</main>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.clip-piano {
		clip-path: polygon(
			0% 0%,
			100% 0%,
			100% 100%,
			75% 100%,
			75% 40%,
			50% 40%,
			50% 100%,
			25% 100%,
			25% 40%,
			0% 40%
		);
	}

	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}
</style>
