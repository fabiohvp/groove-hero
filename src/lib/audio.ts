let audioCtx: AudioContext | null = null;
const activeOscillators: Map<number, { oscs: OscillatorNode[], gain: GainNode }> = new Map();

export function playNote(midi: number, durationMs?: number, speed?: number) {
	if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
	if (audioCtx.state === 'suspended') audioCtx.resume();

	const freq = 440 * Math.pow(2, (midi - 69) / 12);
	const now = audioCtx.currentTime;

	const mg = audioCtx.createGain();
	mg.connect(audioCtx.destination);

	// Harmônicos para um som mais rico de piano
	const harmonics = [1, 2, 3];
	const oscs = harmonics.map((h) => {
		const o = audioCtx!.createOscillator();
		const g = audioCtx!.createGain();
		o.type = 'triangle';
		o.frequency.setValueAtTime(freq * h, now);
		g.gain.setValueAtTime(0.2 / h, now);
		o.connect(g);
		g.connect(mg);
		o.start(now);
		return o;
	});

	mg.gain.setValueAtTime(0, now);
	mg.gain.linearRampToValueAtTime(1, now + 0.005);

	activeOscillators.set(midi, { oscs, gain: mg });

	if (durationMs && speed) {
		const dur = durationMs / 1000 / speed;
		mg.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.8);

		setTimeout(() => {
			oscs.forEach((o) => o.stop());
			activeOscillators.delete(midi);
		}, (dur + 1) * 1000);
	}
}

export function stopNote(midi: number) {
	const active = activeOscillators.get(midi);
	if (active && audioCtx) {
		const now = audioCtx.currentTime;
		active.gain.gain.cancelScheduledValues(now);
		active.gain.gain.setValueAtTime(active.gain.gain.value, now);
		active.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

		activeOscillators.delete(midi);
		setTimeout(() => active.oscs.forEach((o) => o.stop()), 250);
	}
}

export function stopAllNotes() {
	const now = audioCtx?.currentTime || 0;
	activeOscillators.forEach(({ gain, oscs }) => {
		gain.gain.cancelScheduledValues(now);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
		setTimeout(() => oscs.forEach(o => { o?.stop(); }), 150);
	});
	activeOscillators.clear();
}