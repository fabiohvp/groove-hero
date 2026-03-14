<script lang="ts">
	let { progress, elapsedBase, onseek } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="z-10 flex h-8 w-full cursor-pointer items-center gap-4 border-b border-cyan-500/10 bg-[#080c14]/98 px-4"
	onclick={onseek}
>
	<div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-cyan-500/10">
		<div
			class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-cyan-600 shadow-[0_0_10px_#00f5ff]"
			style="width: {progress * 100}%"
		></div>
	</div>
	<span class="min-w-[80px] text-right font-['Orbitron'] text-[10px] text-slate-500">
		{Math.floor(elapsedBase / 1000 / 60)}:{(Math.floor(elapsedBase / 1000) % 60)
			.toString()
			.padStart(2, '0')}
	</span>
</div>
