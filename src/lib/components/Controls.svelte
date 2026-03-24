<script lang="ts">
	import MusicSearch from '$lib/components/MusicSearch.svelte';

	let { playing, ontogglePlay, onfullReset, onsongSelect, hasSong } = $props();
</script>

<div
	class="z-60 flex w-full flex-nowrap items-center border-b border-cyan-500/10 bg-[#0d1520]/95 px-6 py-2"
>
	<div
		class="flex items-center gap-4 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	>
		<button
			onclick={ontogglePlay}
			disabled={!hasSong}
			class="rounded bg-gradient-to-br from-cyan-400 to-cyan-600 px-5 py-1.5 font-['Orbitron'] text-[10px] font-bold tracking-widest text-black transition-all hover:shadow-[0_0_15px_#00f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
		>
			{playing ? '⏸ PAUSE' : '▶ PLAY'}
		</button>
		<button
			onclick={onfullReset}
			disabled={!hasSong}
			class="rounded border border-pink-500 px-5 py-1.25 font-['Orbitron'] text-[10px] font-bold tracking-widest text-pink-500 transition-all hover:bg-pink-500/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
		>
			↺ RESTART
		</button>
		<div class="h-6 w-px bg-cyan-500/20"></div>
	</div>
	<div class="ml-4 flex-shrink-0">
		<MusicSearch onSelect={onsongSelect} />
	</div>
</div>
