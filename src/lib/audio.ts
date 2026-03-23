import { Soundfont } from 'smplr';

let audioCtx: AudioContext | null = null;
let pianoInstrument: Soundfont | null = null;
let guitarInstrument: Soundfont | null = null;

function getContext() {
	if (!audioCtx) {
		audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
	}
	if (audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
	return audioCtx;
}

export function initInstrument(instrument: 'piano' | 'guitar') {
	const ctx = getContext();
	if (instrument === 'piano' && !pianoInstrument) {
		pianoInstrument = new Soundfont(ctx, { instrument: 'electric_grand_piano' });
	} else if (instrument === 'guitar' && !guitarInstrument) {
		guitarInstrument = new Soundfont(ctx, { instrument: 'acoustic_guitar_steel' });
	}
}

const activeNotes = new Map<number, any>();

export function playNote(
	midi: number,
	durationMs?: number,
	speed?: number,
	instrument: 'piano' | 'guitar' = 'piano'
) {
	const ctx = getContext();
	initInstrument(instrument);

	const time = ctx.currentTime;
	// duration needs to be calculated in seconds for smplr
	const durationSeconds = durationMs && speed ? (durationMs / 1000) / speed : undefined;

	const targetInstrument = instrument === 'guitar' ? guitarInstrument : pianoInstrument;

	if (targetInstrument) {
		const node = targetInstrument.start({
			note: midi,
			velocity: 80,
			time: time,
			duration: durationSeconds
		});

		// Track nodes for manual playback (where duration is unbound) so we can stop them on keyup
		if (!durationMs) {
			activeNotes.set(midi, node);
		}
	}
}

export function stopNote(midi: number) {
	if (!audioCtx) return;
	const time = audioCtx.currentTime;

	const node = activeNotes.get(midi);
	if (node && node.stop) {
		node.stop({ time });
		activeNotes.delete(midi);
	}
}

export function stopAllNotes() {
	if (!audioCtx) return;
	const time = audioCtx.currentTime;

	if (pianoInstrument) pianoInstrument.stop({ time });
	if (guitarInstrument) guitarInstrument.stop({ time });
	activeNotes.clear();
}