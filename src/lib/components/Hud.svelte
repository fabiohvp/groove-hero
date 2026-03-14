<script lang="ts">
	let {
		score,
		speed,
		keyCount = $bindable(),
		keyWidthMM = $bindable(),
		loop,
		isKeyboardCompact,
		onspeedChange,
		ontoggleLoop,
		ontoggleKeyboardCompact
	} = $props();

	function handleSpeedChange(e: Event) {
		const newSpeed = parseFloat((e.currentTarget as HTMLInputElement).value);
		onspeedChange(newSpeed);
	}
</script>

<div class="z-10 flex flex-wrap items-center gap-8 border-b border-cyan-500/5 bg-[#0b111b]/98 px-8 py-2">
	<div class="flex items-center gap-3">
		<span class="text-[10px] tracking-widest text-slate-500 uppercase">Pontuação</span>
		<span
			class="font-['Orbitron'] text-xl text-yellow-400 drop-shadow-[0_0_8px_rgba(255,230,0,0.5)]"
			>{Math.round(score)}</span
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
			value={speed}
			oninput={handleSpeedChange}
			class="w-16 cursor-pointer appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/10 text-center"
		/>
	</div>
	<div class="h-5 w-px bg-cyan-500/10"></div>
	<div class="flex items-center gap-3">
		<span class="text-[10px] tracking-widest text-slate-500 uppercase">Teclas</span>
		<div class="relative">
			<select
				bind:value={keyCount}
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
			bind:value={keyWidthMM}
			class="w-16 cursor-pointer appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/10 text-center"
		/>
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
		onclick={ontoggleKeyboardCompact}
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
