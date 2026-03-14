import type { MidiFileInfo, Song } from './types';

const defaultSong: Song = {
	path: '',
	name: 'No song selected',
	bpm: 120,
	notes: [],
	difficulty: 'Beginner'
};

// Reactive states (Runes)
let playing = $state(false);
let loop = $state(true);
let currentSongInfo = $state<MidiFileInfo | null>(null);
let speed = $state(1);
let score = $state(0);
let combo = $state(0);
let elapsedBase = $state(0);
let startTime = $state<number | null>(null);
let keyCount = $state(61);
let keyWidthMM = $state(21);

let currentSong = $state<Song>(defaultSong);

$effect.root(() => {
	$effect(() => {
		const songInfo = currentSongInfo;

		if (!songInfo) {
			currentSong = defaultSong;
			return;
		}

		(async () => {
			const { jsonPath } = songInfo;

			const songPathForGlob =
				`/src/lib/database/${jsonPath}`;

			try {
				const songModule = await import(songPathForGlob);
				currentSong = songModule.default;
			} catch (e) {
				console.error(`Failed to load song`, e);
				currentSong = { ...defaultSong, name: 'Failed to load song' };
			}
		})();
	});
});

// Derived states (Runes)
const duration = $derived.by(() => {
	if (!currentSong?.notes || currentSong.notes.length === 0) return 1500;
	const lastNote = currentSong.notes.reduce((p, c) => (c.t + c.d > p.t + p.d ? c : p));
	return lastNote.t + lastNote.d + 1500;
});

function stop() {
	playing = false;
	elapsedBase = 0;
	startTime = null;
}

function reset() {
	playing = false;
	score = 0;
	combo = 0;
	elapsedBase = 0;
	startTime = null;
}

export const game = {
	get playing() { return playing; },
	set playing(value) { playing = value; },
	get loop() { return loop; },
	set loop(value) { loop = value; },
	get currentSongInfo() { return currentSongInfo; },
	set currentSongInfo(value) { currentSongInfo = value; },
	get speed() { return speed; },
	set speed(value) { speed = value; },
	get score() { return score; },
	set score(value) { score = value; },
	get combo() { return combo; },
	set combo(value) { combo = value; },
	get elapsedBase() { return elapsedBase; },
	set elapsedBase(value) { elapsedBase = value; },
	get startTime() { return startTime; },
	set startTime(value) { startTime = value; },
	get keyCount() { return keyCount; },
	set keyCount(value) { keyCount = value; },
	get keyWidthMM() { return keyWidthMM; },
	set keyWidthMM(value) { keyWidthMM = value; },
	get currentSong() { return currentSong; },
	get duration() { return duration; },
	stop,
	reset
};