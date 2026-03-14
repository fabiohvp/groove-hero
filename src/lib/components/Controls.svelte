<script lang="ts">
	import MusicSearch from '$lib/components/MusicSearch.svelte';

	let { playing, ontogglePlay, onfullReset, onsongSelect } = $props();
</script>

<div
	class="z-20 flex w-full items-center gap-4 border-b border-cyan-500/10 bg-[#0d1520]/95 px-6 py-2"
>
	<button
		onclick={ontogglePlay}
		class="rounded bg-gradient-to-br from-cyan-400 to-cyan-600 px-5 py-2 font-['Orbitron'] text-[10px] font-bold tracking-widest text-black transition-all hover:shadow-[0_0_15px_#00f5ff]"
	>
		{playing ? '⏸ PAUSE' : '▶ PLAY'}
	</button>
	<button
		onclick={onfullReset}
		class="rounded border border-pink-500 px-5 py-2 font-['Orbitron'] text-[10px] font-bold tracking-widest text-pink-500 transition-all hover:bg-pink-500/10"
	>
		↺ RESTART
	</button>
	<div class="h-6 w-px bg-cyan-500/20"></div>
	<MusicSearch onSelect={onsongSelect} />
</div>
