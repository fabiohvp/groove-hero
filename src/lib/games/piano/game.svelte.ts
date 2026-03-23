import { SvelteMap } from 'svelte/reactivity';
import { playNote, stopAllNotes, stopNote } from '$lib/audio';
import type { MidiFileInfo, Song } from '$lib/types';

const defaultSong: Song = {
	path: '',
	name: 'No song selected',
	bpm: 120,
	notes: [],
	difficulty: 'Beginner',
	jsonPath: ''
};

function getSavedSetting<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;
	const saved = localStorage.getItem(key);
	if (saved !== null) {
		try {
			return JSON.parse(saved) as T;
		} catch (e) {
			return defaultValue;
		}
	}
	return defaultValue;
}

// Reactive states (Runes)
export const gameState = $state({
	playing: false,
	loop: getSavedSetting('pf_loop', true),
	currentSongInfo: null as MidiFileInfo | null,
	speed: 1,
	score: 0,
	combo: 0,
	elapsedBase: 0,
	startTime: null as number | null,
	keyCount: getSavedSetting('pf_keyCount', 61),
	keyWidthMM: getSavedSetting('pf_keyWidthMM', 22),
	currentSong: defaultSong,
	lastTs: typeof performance !== 'undefined' ? performance.now() : 0,
	lastFrameTime: typeof performance !== 'undefined' ? performance.now() : 0,
	fallZoneHeight: 360,
	isKeyboardCompact: getSavedSetting('pf_isKeyboardCompact', true),
	backgroundMode: getSavedSetting('pf_backgroundMode', 'dark') as 'dark' | 'light',
	soundMode: 'music' as 'music' | 'player',
	countdown: null as number | null,
	noteColor: getSavedSetting('pf_noteColor', 'classic') as 'classic' | 'ocean' | 'sunset' | 'synthwave' | 'monochrome' | 'forest'
});

export const scheduledNotes: number[] = [];
export const pressedKeys = new SvelteMap<number, boolean>();

// (songModules import.meta.glob removed in favor of static fetching)
$effect.root(() => {
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('pf_loop', JSON.stringify(gameState.loop));
			localStorage.setItem('pf_keyCount', JSON.stringify(gameState.keyCount));
			localStorage.setItem('pf_keyWidthMM', JSON.stringify(gameState.keyWidthMM));
			localStorage.setItem('pf_isKeyboardCompact', JSON.stringify(gameState.isKeyboardCompact));
			localStorage.setItem('pf_noteColor', JSON.stringify(gameState.noteColor));
			localStorage.setItem('pf_backgroundMode', JSON.stringify(gameState.backgroundMode));
		}
	});

	$effect(() => {
		const songInfo = gameState.currentSongInfo;

		if (!songInfo) {
			gameState.currentSong = defaultSong;
			return;
		}

		(async () => {
			const { jsonPath } = songInfo;
			const normalizedPath = jsonPath.replace(/\\/g, '/');
			const songPath = `/database/${normalizedPath}`;

			try {
				const res = await fetch(songPath);
				if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
				gameState.currentSong = await res.json();
			} catch (e) {
				console.error(`Failed to load song`, e);
				gameState.currentSong = { ...defaultSong, name: 'Failed to load song' };
			}
		})();
	});
});

// Derived states and logic
export function clearCountdown() {
	if (typeof window !== 'undefined' && (window as any)._countdownInterval) {
		clearInterval((window as any)._countdownInterval);
		(window as any)._countdownInterval = null;
	}
	gameState.countdown = null;
}

export function stop() {
	clearCountdown();
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
	if (!gameState.playing || gameState.countdown !== null) return;
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
	clearCountdown();

	gameState.countdown = 3;
	gameState.playing = true; // Set to true to change play button state

	if (typeof window !== 'undefined') {
		(window as any)._countdownInterval = setInterval(() => {
			if (gameState.countdown !== null && gameState.countdown > 1) {
				gameState.countdown -= 1;
			} else {
				clearCountdown();
				actualRestartGame();
			}
		}, 1000);
	}
}

function actualRestartGame() {
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
	if (gameState.countdown !== null) {
		clearCountdown();
		gameState.playing = false;
		return;
	}

	if (!gameState.playing) {
		if (getProgress() <= 0) {
			restartGame();
		} else {
			gameState.playing = true;
			gameState.lastTs = performance.now();
			gameState.lastFrameTime = gameState.lastTs;
			startAudio();
			requestAnimationFrame(tick);
		}
	} else {
		gameState.playing = false;
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