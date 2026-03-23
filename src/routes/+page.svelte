<main
	class="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#080c14] font-['Rajdhani']"
>
	<div
		class="pointer-events-none fixed inset-0 z-0"
		style="background: radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.1) 0%, transparent 60%);"
	></div>

	<div class="z-10 mb-12 flex flex-col items-center">
		<h1
			class="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text font-['Orbitron'] text-6xl font-black tracking-widest text-transparent drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]"
		>
			GROOVE HERO
		</h1>
		<p class="mt-2 text-lg tracking-[8px] text-slate-400 uppercase">CHOOSE YOUR INSTRUMENT</p>
	</div>

	<div class="z-10 flex gap-8">
		<a
			href="/piano"
			class="group relative flex h-64 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-500/30 bg-[#0b111b]/80 backdrop-blur transition-all hover:scale-105 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)]"
		>
			<div
				class="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			></div>
			<div class="mb-6 text-6xl drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">🎹</div>
			<h2 class="font-['Orbitron'] text-xl font-bold text-cyan-400">PIANO</h2>
		</a>

		<a
			href="/guitar"
			class="group relative flex h-64 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-pink-500/30 bg-[#0b111b]/80 backdrop-blur transition-all hover:scale-105 hover:border-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]"
		>
			<div
				class="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			></div>
			<div class="mb-6 text-6xl drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">🎸</div>
			<h2 class="font-['Orbitron'] text-xl font-bold text-pink-500">GUITAR</h2>
		</a>
	</div>

	<div class="fixed bottom-6 z-10 flex items-center justify-center">
		<a
			href="https://github.com/fabiohvp/groove-hero"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-2 text-slate-500 opacity-80 transition-all hover:text-cyan-400 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]"
		>
			<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
				<path
					fill-rule="evenodd"
					d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="mt-0.5 font-['Rajdhani'] text-[12px] font-bold tracking-[4px] uppercase"
				>GitHub</span
			>
		</a>
	</div>
</main>
