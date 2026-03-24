<script lang="ts">
	let {
		showTopBars,
		color = 'cyan',
		ontoggle
	}: {
		showTopBars: boolean;
		color?: 'cyan' | 'pink';
		ontoggle: () => void;
	} = $props();

	let colorClasses = $derived(
		color === 'pink'
			? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/40'
			: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40'
	);
</script>

<button
	class="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-all {colorClasses}"
	onclick={ontoggle}
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
