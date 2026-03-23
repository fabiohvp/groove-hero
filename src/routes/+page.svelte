<main class="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#080c14] font-['Rajdhani']">
  <div
    class="pointer-events-none fixed inset-0 z-0"
    style="background: radial-gradient(ellipse at 50% 0%, rgba(0,245,255,0.1) 0%, transparent 60%);"
  ></div>

  <div class="z-10 mb-12 flex flex-col items-center">
    <h1 class="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text font-['Orbitron'] text-6xl font-black tracking-widest text-transparent drop-shadow-[0_0_15px_rgba(0,245,255,0.3)]">
      GROOVE HERO
    </h1>
    <p class="mt-2 text-lg tracking-[8px] text-slate-400 uppercase">CHOOSE YOUR INSTRUMENT</p>
  </div>

  <div class="z-10 flex gap-8">
    <a
      href="/piano"
      class="group relative flex h-64 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-500/30 bg-[#0b111b]/80 backdrop-blur transition-all hover:scale-105 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)]"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
      <div class="mb-6 text-6xl drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">🎹</div>
      <h2 class="font-['Orbitron'] text-xl font-bold text-cyan-400">PIANO</h2>
    </a>

    <a
      href="/guitar"
      class="group relative flex h-64 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-pink-500/30 bg-[#0b111b]/80 backdrop-blur transition-all hover:scale-105 hover:border-pink-400 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]"
    >
      <div class="absolute inset-0 bg-gradient-to-b from-pink-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
      <div class="mb-6 text-6xl drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">🎸</div>
      <h2 class="font-['Orbitron'] text-xl font-bold text-pink-500">GUITAR</h2>
    </a>
  </div>
</main>
