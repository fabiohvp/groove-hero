<script lang="ts">
	import { gameState, getGuitarPosition } from '$lib/games/guitar/game.svelte';

	let { onkeyPress, fretsCount } = $props();

	const stringsCount = 6;

	// Common dot marker fret positions on a standard guitar neck
	const singleDots = [3, 5, 7, 9, 15, 17];
	const doubleDots = [12];

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

	let c = $derived(Number(fretsCount) || 24);

	// Find all notes in the active hit-window to illuminate their string strings
	let currentElapsed = $derived(
		gameState.startTime 
			? ((gameState.lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase) 
			: gameState.elapsedBase
	);
	
	let activeGuitarPositions = $derived.by(() => {
		let positions = new Set<string>();
		if (gameState.currentSong?.notes) {
			for (let note of gameState.currentSong.notes) {
				// Light up if it's within the active pluck window
				if (currentElapsed >= note.t - 100 && currentElapsed <= note.t + note.d) {
					const pos = getGuitarPosition(note.midi, c);
					positions.add(`${pos.stringIndex}-${pos.fretIndex}`);
				}
			}
		}
		return positions;
	});

	let activeStrumDir = $derived.by(() => {
		if (!gameState.currentSong?.notes) return null;
		
		const uniqueTimes = Array.from(new Set(gameState.currentSong.notes.map(n => n.t))).sort((a,b) => a-b);
		for (let index = 0; index < uniqueTimes.length; index++) {
			const t = uniqueTimes[index];
			if (currentElapsed >= t - 50 && currentElapsed <= t + 100) {
				return index % 2 === 0 ? 'down' : 'up';
			}
		}
		return null;
	});

	// Logarithmic-like fret spacing for a realistic look
	function getFretLeftPercentage(fretIndex: number) {
		// Just a simple linear spacing for aesthetic simplicity filling the screen
		return (fretIndex / c) * 100;
	}

	function getMidFretPercentage(fretIndex: number) {
		const left = getFretLeftPercentage(fretIndex - 1);
		const right = getFretLeftPercentage(fretIndex);
		return left + (right - left) / 2;
	}
</script>

<div
	class="absolute right-0 bottom-0 left-0 flex {gameState.isLeftHanded ? 'flex-row-reverse' : 'flex-row'} h-48 w-full select-none overflow-hidden border-t-4 border-pink-500/20 bg-gradient-to-br from-[#1a0a0a] via-[#301616] to-[#120505] shadow-[0_-15px_40px_rgba(236,72,153,0.15)]"
>
	<!-- Strumming Patterns Area -->
	<div class="relative z-30 flex w-16 flex-[0_0_64px] flex-col items-center justify-center {gameState.isLeftHanded ? 'border-l-[3px]' : 'border-r-[3px]'} border-pink-500/30 bg-[#0a0303] shadow-[5px_0_15px_rgba(0,0,0,0.8)]">
		<span class="mb-4 font-['Orbitron'] text-[8px] font-bold tracking-[2px] text-pink-500/70 text-center uppercase" style="writing-mode: vertical-rl; transform: rotate(180deg);">STRUM</span>
		<div class="flex flex-col gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg border transition-all {activeStrumDir === 'up' ? 'scale-110 border-pink-400 bg-pink-500/40 shadow-[0_0_20px_#ec4899] brightness-125' : 'border-pink-500/50 bg-gradient-to-b from-pink-500/20 to-transparent shadow-[0_0_15px_rgba(236,72,153,0.3)]'}">
				<span class="text-xl font-bold {activeStrumDir === 'up' ? 'text-white drop-shadow-[0_0_8px_#fff]' : 'text-pink-400'}">↑</span>
			</div>
			<div class="flex h-10 w-10 items-center justify-center rounded-lg border transition-all {activeStrumDir === 'down' ? 'scale-110 border-cyan-400 bg-cyan-500/40 shadow-[0_0_20px_#00f5ff] brightness-125' : 'border-cyan-500/50 bg-gradient-to-b from-cyan-500/20 to-transparent shadow-[0_0_15px_rgba(0,245,255,0.3)]'}">
				<span class="text-xl font-bold {activeStrumDir === 'down' ? 'text-white drop-shadow-[0_0_8px_#fff]' : 'text-cyan-400'}">↓</span>
			</div>
		</div>
	</div>

	<!-- Fretboard Area -->
	<div class="relative flex flex-1 overflow-hidden">
		<!-- Wood Texture overlay -->
	<div
		class="absolute inset-0 opacity-10 backdrop-blur-sm"
		style="background-image: repeating-linear-gradient(90deg, transparent, transparent 15px, #000 15px, #000 20px);"
	></div>

	<!-- Frets -->
	{#each Array.from({ length: c }) as _, i}
		<div
			class="absolute top-0 bottom-0 w-1.5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-500 shadow-[-2px_0_5px_rgba(0,0,0,0.8)]"
			style="{gameState.isLeftHanded ? 'right' : 'left'}: {getFretLeftPercentage(i + 1)}%;"
		></div>
	{/each}

	<!-- Inlays (Dots) -->
	{#each singleDots as fret}
		{#if fret <= c}
			<div
				class="absolute top-1/2 h-5 w-5 {gameState.isLeftHanded ? 'translate-x-1/2' : '-translate-x-1/2'} -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/80 to-slate-300 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
				style="{gameState.isLeftHanded ? 'right' : 'left'}: {getMidFretPercentage(fret)}%;"
			></div>
		{/if}
	{/each}
	{#each doubleDots as fret}
		{#if fret <= c}
			<div
				class="absolute top-1/3 h-5 w-5 {gameState.isLeftHanded ? 'translate-x-1/2' : '-translate-x-1/2'} -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/80 to-slate-300 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
				style="{gameState.isLeftHanded ? 'right' : 'left'}: {getMidFretPercentage(fret)}%;"
			></div>
			<div
				class="absolute top-2/3 h-5 w-5 {gameState.isLeftHanded ? 'translate-x-1/2' : '-translate-x-1/2'} -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/80 to-slate-300 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]"
				style="{gameState.isLeftHanded ? 'right' : 'left'}: {getMidFretPercentage(fret)}%;"
			></div>
		{/if}
	{/each}

	<!-- Strings and Interactive Hitboxes Grid -->
	<div class="absolute inset-0 z-20 flex flex-col">
		{#each Array.from({ length: stringsCount }) as _, s}
			{@const currentTheme = themes[gameState.noteColor as keyof typeof themes] || themes.classic}
			<div class="relative flex flex-1 items-center">
				
				<!-- The physical string visual -->
				<div
					class="pointer-events-none absolute left-0 right-0 z-10 w-full bg-gradient-to-b from-slate-200 to-slate-500 shadow-[0_3px_5px_rgba(0,0,0,0.6)]"
					style="height: {1.5 + (stringsCount - s) * 0.4}px;"
				></div>

				<!-- The interactive frets row covering this specific string -->
				<div class="relative z-20 flex flex-1 self-stretch {gameState.isLeftHanded ? 'flex-row-reverse' : 'flex-row'}">
					{#each Array.from({ length: c }) as _, f}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="relative flex flex-1 cursor-pointer items-center justify-center transition-all hover:bg-white/5 active:bg-white/10"
							onmousedown={() => onkeyPress && onkeyPress(s, f)}
						>
							{#if activeGuitarPositions.has(s + '-' + f)}
								<div 
									class="absolute z-30 h-5 w-5 rounded-full ring-2 ring-white/50" 
									style="background: {currentTheme.black.bg}; box-shadow: 0 0 20px {currentTheme.black.shadow};"
								></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	</div>
</div>
