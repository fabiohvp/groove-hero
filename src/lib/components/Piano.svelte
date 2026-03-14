<script lang="ts">
	let { pianoLayout, onkeyDown, onkeyUp } = $props();

	const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
</script>

<div
	class="absolute right-0 bottom-0 left-0 border-t-2 border-cyan-500/20 bg-gradient-to-b from-[#060a10] to-[#0d1520] shadow-[0_-4px_30px_rgba(0,245,255,0.1)]"
	style="height: {pianoLayout.whiteH}px"
>
	{#each pianoLayout.keys as key (key)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onmousedown={() => onkeyDown(key.midi)}
			onmouseup={() => onkeyUp(key.midi)}
			onmouseleave={() => onkeyUp(key.midi)}
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
