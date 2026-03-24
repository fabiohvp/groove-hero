<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
</script>

<header
	class="z-10 flex w-full items-center border-b border-cyan-500/10 bg-[#080c14]/90 px-8 py-4 backdrop-blur-xl"
>
	<a href="/" class="flex items-center gap-3 transition-transform hover:scale-105">
		<img src={favicon} alt="Groove Hero" class="h-12" />
		<div>
			<h1
				class="bg-gradient-to-r from-cyan-400 to-pink-700 bg-clip-text font-['Orbitron'] text-xl font-black tracking-widest text-transparent"
			>
				GROOVE HERO
			</h1>
			<p
				class="-mt-1 bg-gradient-to-r from-cyan-400 to-pink-700 bg-clip-text text-[10px] tracking-[4px] text-transparent uppercase"
			>
				GAME POWERED MUSIC LEARNING
			</p>
		</div>
	</a>
</header>
