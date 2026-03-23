<script lang="ts">
	let {
		score,
		speed,
		fretsCount = $bindable(),
		noteColor = $bindable(),
		loop,
		soundMode,
		onspeedChange,
		ontoggleLoop,
		ontoggleSoundMode
	} = $props();

	function decreaseSpeed() {
		onspeedChange(Math.max(0.25, speed - 0.25));
	}

	function increaseSpeed() {
		onspeedChange(Math.min(5, speed + 0.25));
	}
</script>

<div
	class="z-10 flex flex-wrap items-center gap-4 border-b border-cyan-500/5 bg-[#0b111b]/98 px-8 py-2"
>
	<!-- <div class="flex items-center gap-3">
		<span class="text-[10px] tracking-widest text-slate-500 uppercase">Score</span>
		<span
			class="font-['Orbitron'] text-xl text-yellow-400 drop-shadow-[0_0_8px_rgba(255,230,0,0.5)]"
			>{Math.round(score)}</span
		>
	</div>
	<div class="h-5 w-px bg-cyan-500/10"></div> -->
	<div class="flex items-center gap-3">
		<span class="text-[10px] tracking-widest text-slate-500 uppercase">Speed</span>
		<div class="flex items-center rounded-sm border border-cyan-500/20 bg-cyan-500/5">
			<button
				onclick={decreaseSpeed}
				class="px-3 py-0.25 text-cyan-500 transition-colors hover:bg-cyan-500/20 hover:text-cyan-400 focus:outline-none disabled:opacity-50"
				disabled={speed <= 0.25}
			>
				-
			</button>
			<span class="w-10 text-center text-sm font-semibold text-cyan-400">{speed}x</span>
			<button
				onclick={increaseSpeed}
				class="px-3 py-0.25 text-cyan-500 transition-colors hover:bg-cyan-500/20 hover:text-cyan-400 focus:outline-none disabled:opacity-50"
				disabled={speed >= 5}
			>
				+
			</button>
		</div>
	</div>
	<div class="h-5 w-px bg-cyan-500/10"></div>
	<div class="flex items-center gap-3">
		<span class="text-[10px] tracking-widest text-slate-500 uppercase">Frets</span>
		<div class="relative">
			<select
				bind:value={fretsCount}
				class="appearance-none rounded border border-cyan-500/20 bg-cyan-500/5 py-1 pr-8 pl-4 text-xs font-semibold text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
			>
				<option class="bg-[#0d1520] font-sans" value={19}>19</option>
				<option class="bg-[#0d1520] font-sans" value={20}>20</option>
				<option class="bg-[#0d1520] font-sans" value={21}>21</option>
				<option class="bg-[#0d1520] font-sans" value={22}>22</option>
				<option class="bg-[#0d1520] font-sans" value={23}>23</option>
				<option class="bg-[#0d1520] font-sans" value={24}>24</option>
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
		<span class="text-[10px] tracking-widest text-slate-500 uppercase">Colors</span>
		<div class="relative">
			<select
				bind:value={noteColor}
				class="appearance-none rounded border border-cyan-500/20 bg-cyan-500/5 py-1 pr-8 pl-4 text-xs font-semibold text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
			>
				<option class="bg-[#0d1520] font-sans" value="classic">Classic</option>
				<option class="bg-[#0d1520] font-sans" value="ocean">Ocean</option>
				<option class="bg-[#0d1520] font-sans" value="sunset">Sunset</option>
				<option class="bg-[#0d1520] font-sans" value="synthwave">Synthwave</option>
				<option class="bg-[#0d1520] font-sans" value="monochrome">Monochrome</option>
				<option class="bg-[#0d1520] font-sans" value="forest">Forest</option>
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

	<button
		onclick={ontoggleLoop}
		class="flex cursor-pointer items-center gap-2 text-[10px] tracking-widest uppercase transition-colors {loop
			? 'text-cyan-400'
			: 'text-slate-500'}"
	>
		<span
			class="flex h-4 w-4 items-center justify-center rounded-full border border-current {loop
				? 'animate-spin-slow'
				: ''}">↻</span
		>
		Loop
	</button>
	<div class="h-5 w-px bg-cyan-500/10"></div>
	<button
		onclick={ontoggleSoundMode}
		class="flex cursor-pointer items-center gap-2 text-[10px] tracking-widest text-cyan-400 uppercase transition-colors"
		title="Toggle between music sound and keystroke sound"
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
			<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
			{#if soundMode === 'music'}
				<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
			{:else}
				<path d="M17 14l-4-4m0 4l4-4" stroke="currentColor"></path>
				<circle cx="15" cy="12" r="3" fill="currentColor"></circle>
			{/if}
		</svg>
		<span>SOUND: {soundMode === 'music' ? 'MUSIC' : 'PLAYER'}</span>
	</button>
	<div class="h-5 w-px bg-cyan-500/10"></div>

</div>

<style>
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
