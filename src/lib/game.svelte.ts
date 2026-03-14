import { playNote, stopNote, stopAllNotes } from './audio';
import type { MidiFileInfo, Song } from './types';
import { SvelteMap } from 'svelte/reactivity';

const defaultSong: Song = {
	path: '',
	name: 'No song selected',
	bpm: 120,
	notes: [],
	difficulty: 'Beginner',
	jsonPath: ''
};

// Reactive states (Runes)
export const gameState = $state({
	playing: false,
	loop: true,
	currentSongInfo: null as MidiFileInfo | null,
	speed: 1,
	score: 0,
	combo: 0,
	elapsedBase: 0,
	startTime: null as number | null,
	keyCount: 61,
	keyWidthMM: 21,
	currentSong: defaultSong,
	lastTs: performance.now(),
	lastFrameTime: performance.now(),
	fallZoneHeight: 360,
	isKeyboardCompact: true,
	soundMode: 'music' as 'music' | 'player'
});

export const scheduledNotes: number[] = [];
export const pressedKeys = new SvelteMap<number, boolean>();

const songModules = import.meta.glob('/src/lib/database/**/*.json');

$effect.root(() => {
	$effect(() => {
		const songInfo = gameState.currentSongInfo;

		if (!songInfo) {
			gameState.currentSong = defaultSong;
			return;
		}

		(async () => {
			const { jsonPath } = songInfo;
			const normalizedPath = jsonPath.replace(/\\/g, '/');
			const songPath = `/src/lib/database/${normalizedPath}`;

			try {
				const songModule: any = await songModules[songPath]();
				gameState.currentSong = songModule.default;
			} catch (e) {
				console.error(`Failed to load song`, e);
				gameState.currentSong = { ...defaultSong, name: 'Failed to load song' };
			}
		})();
	});
});

// Derived states and logic
export function stop() {
	gameState.playing = false;
	gameState.elapsedBase = 0;
	gameState.startTime = null;
}

export function reset() {
	gameState.playing = false;
	gameState.score = 0;
	gameState.combo = 0;
	gameState.elapsedBase = 0;
	gameState.startTime = null;
}

export function getDuration() {
	if (!gameState.currentSong?.notes || gameState.currentSong.notes.length === 0) return 1500;
	const lastNote = gameState.currentSong.notes.reduce((p, c) => (c.t + c.d > p.t + p.d ? c : p));
	return lastNote.t + lastNote.d + 1500;
}

export function getProgress() {
	return Math.min(
		1,
		(gameState.startTime
			? (gameState.lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase
			: gameState.elapsedBase) / getDuration()
	);
}

export function tick(ts: number) {
	if (!gameState.playing) return;
	if (!gameState.startTime) gameState.startTime = ts;

	const frameDurationMs = ts - gameState.lastFrameTime;
	gameState.lastFrameTime = ts;
	gameState.lastTs = ts;

	const currentElapsed = gameState.elapsedBase + (ts - gameState.startTime) * gameState.speed;

	const scorePerSecond = 100;
	const frameScore = (scorePerSecond * frameDurationMs) / 1000;

	for (const midi of pressedKeys.keys()) {
		const activeNote = gameState.currentSong.notes.find(
			(n) => n.midi === midi && currentElapsed >= n.t && currentElapsed < n.t + n.d
		);

		if (activeNote && activeNote.hit) {
			gameState.score += frameScore;
		}
	}

	if (currentElapsed >= getDuration()) {
		if (gameState.loop) {
			restartGame();
		} else {
			fullReset();
		}
		return;
	}

	requestAnimationFrame(tick);
}

export function resetHits() {
	if (gameState.currentSong?.notes) {
		gameState.currentSong.notes.forEach((n: any) => (n.hit = false));
	}
}

export function fullReset() {
	stop();
	resetHits();
}

export function restartGame() {
	reset();
	resetHits();
	clearAudio();

	const pxPerMs = 0.22 * gameState.speed;
	const fallTimeMs = gameState.fallZoneHeight / pxPerMs;
	const firstNoteT = gameState.currentSong?.notes?.[0]?.t ?? 0;
	if (firstNoteT < fallTimeMs) {
		gameState.elapsedBase = firstNoteT - fallTimeMs;
	}

	gameState.playing = true;
	gameState.startTime = performance.now();
	gameState.lastFrameTime = gameState.startTime;
	gameState.lastTs = gameState.startTime;
	startAudio();
	requestAnimationFrame(tick);
}

export function togglePlay() {
	gameState.playing = !gameState.playing;
	if (gameState.playing) {
		if (getProgress() <= 0) {
			restartGame();
		} else {
			gameState.lastTs = performance.now();
			gameState.lastFrameTime = gameState.lastTs;
			startAudio();
			requestAnimationFrame(tick);
		}
	} else {
		if (gameState.startTime) {
			gameState.elapsedBase += (gameState.lastTs - gameState.startTime) * gameState.speed;
		}
		gameState.startTime = null;
		clearAudio();
	}
}

export function handleSpeedChange(newSpeed: number) {
	if (gameState.playing && gameState.startTime) {
		const now = performance.now();
		gameState.elapsedBase += (now - gameState.startTime) * gameState.speed;
		gameState.startTime = now;
		gameState.lastTs = now;
		gameState.speed = newSpeed;
		startAudio();
	} else {
		gameState.speed = newSpeed;
	}
}

export function handleSongSelect(selectedSongInfo: MidiFileInfo | null) {
	gameState.currentSongInfo = selectedSongInfo;
	fullReset();
}

export function handleKeyDown(midi: number) {
	if (pressedKeys.has(midi)) return;
	pressedKeys.set(midi, true);

	if (gameState.soundMode === 'player') {
		playNote(midi);
	}

	if (gameState.playing && gameState.startTime) {
		const currentElapsed =
			(performance.now() - gameState.startTime) * gameState.speed + gameState.elapsedBase;
		const note = gameState.currentSong.notes.find(
			(n) => n.midi === midi && !n.hit && currentElapsed >= n.t && currentElapsed < n.t + n.d
		);
		if (note) {
			note.hit = true;
		}
	}
}

export function handleKeyUp(midi: number) {
	if (!pressedKeys.has(midi)) return;
	pressedKeys.delete(midi);

	if (gameState.soundMode === 'player') {
		stopNote(midi);
	}
}

export function startAudio() {
	clearAudio();
	gameState.currentSong.notes.forEach((note) => {
		const elapsed = gameState.startTime
			? (gameState.lastTs - gameState.startTime) * gameState.speed + gameState.elapsedBase
			: gameState.elapsedBase;

		if (note.t >= elapsed) {
			const delay = (note.t - elapsed) / gameState.speed;
			const id = window.setTimeout(() => {
				if (gameState.playing && !note.hit && gameState.soundMode === 'music') playNote(note.midi, note.d, gameState.speed);
			}, delay);
			scheduledNotes.push(id);
		}
	});
}

export function clearAudio() {
	scheduledNotes.forEach(clearTimeout);
	scheduledNotes.length = 0;
	stopAllNotes();
}

export function seekPercentage(pct: number) {
	gameState.elapsedBase = pct * getDuration();

	if (gameState.playing) {
		gameState.lastTs = performance.now();
		gameState.startTime = gameState.lastTs;
		startAudio();
	}
}