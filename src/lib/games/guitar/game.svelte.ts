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
	loop: getSavedSetting('gt_loop', true),
	currentSongInfo: null as MidiFileInfo | null,
	speed: 1,
	score: 0,
	combo: 0,
	elapsedBase: 0,
	startTime: null as number | null,
	fretsCount: getSavedSetting('gt_fretsCount', 24),
	isLeftHanded: getSavedSetting('gt_isLeftHanded', false),
	backgroundMode: getSavedSetting('gt_backgroundMode', 'dark') as 'dark' | 'light',
	currentSong: defaultSong,
	lastTs: typeof performance !== 'undefined' ? performance.now() : 0,
	lastFrameTime: typeof performance !== 'undefined' ? performance.now() : 0,
	fallZoneHeight: 360,
	soundMode: 'music' as 'music' | 'player',
	countdown: null as number | null,
	noteColor: getSavedSetting('gt_noteColor', 'classic') as 'classic' | 'ocean' | 'sunset' | 'synthwave' | 'monochrome' | 'forest',
	notesByMidi: new Map<number, any[]>(),
	strums: [] as any[],
	nextNoteToSchedule: 0,
	duration: 1500
});

export const scheduledNotes: number[] = [];
export const pressedKeys = new SvelteMap<number, boolean>();

// (songModules import.meta.glob removed in favor of static fetching)
$effect.root(() => {
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('gt_loop', JSON.stringify(gameState.loop));
			localStorage.setItem('gt_fretsCount', JSON.stringify(gameState.fretsCount));
			localStorage.setItem('gt_noteColor', JSON.stringify(gameState.noteColor));
			localStorage.setItem('gt_isLeftHanded', JSON.stringify(gameState.isLeftHanded));
			localStorage.setItem('gt_backgroundMode', JSON.stringify(gameState.backgroundMode));
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
				const songData = await res.json();

				// Pre-group notes by MIDI for fast lookup during gameplay
				const grouped = new Map<number, any[]>();
				songData.notes.forEach((n: any) => {
					if (!grouped.has(n.midi)) grouped.set(n.midi, []);
					grouped.get(n.midi)!.push(n);
				});

				// Pre-calculate unique strum times (hit attack times) - Optimized O(N) approach
				const strumMap = new Map<number, any[]>();
				songData.notes.forEach((n: any) => {
					if (!strumMap.has(n.t)) strumMap.set(n.t, []);
					strumMap.get(n.t)!.push(n);
				});
				
				const uniqueTimes = Array.from(strumMap.keys()).sort((a, b) => a - b);
				const strums = uniqueTimes.map((t, index) => {
					return {
						t,
						dir: index % 2 === 0 ? 'down' : 'up',
						notes: strumMap.get(t) || []
					};
				});

				// Pre-calculate duration and guitar positions
				let dur = 1500;
				if (songData.notes.length > 0) {
					const lastNote = songData.notes.reduce((p: any, c: any) => (c.t + c.d > p.t + p.d ? c : p));
					dur = lastNote.t + lastNote.d + 3000;
					
					// Pre-calculate positions for guitar
					songData.notes.forEach((n: any) => {
						n.guitarPos = getGuitarPosition(n.midi, gameState.fretsCount);
					});
				}

				gameState.notesByMidi = grouped;
				gameState.strums = strums;
				gameState.currentSong = songData;
				gameState.duration = dur;
				gameState.nextNoteToSchedule = 0;
			} catch (e) {
				console.error(`Failed to load song`, e);
				gameState.currentSong = { ...defaultSong, name: 'Failed to load song' };
				gameState.notesByMidi = new Map();
				gameState.strums = [];
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
	return gameState.duration;
}

export function getGuitarPosition(midi: number, fretsCount: number): { stringIndex: number; fretIndex: number } {
	const strings = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4
	
	let bestS = -1;
	let bestF = -1;

	for (let s = strings.length - 1; s >= 0; s--) {
		const tuning = strings[s];
		const f = midi - tuning;
		if (f >= 0 && f <= fretsCount) {
			bestS = s;
			bestF = f;
			break;
		}
	}
	
	if (bestS === -1) {
		if (midi < 40) return getGuitarPosition(midi + 12, fretsCount);
		else return getGuitarPosition(midi - 12, fretsCount);
	}

	return { stringIndex: bestS, fretIndex: bestF };
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
		const midiNotes = gameState.notesByMidi.get(midi);
		if (!midiNotes) continue;

		const activeNote = midiNotes.find(
			(n) => currentElapsed >= n.t && currentElapsed < n.t + n.d
		);

		if (activeNote && activeNote.hit) {
			gameState.score += frameScore;
		}
	}

	// Just-in-time audio scheduling (Optimized)
	if (gameState.soundMode === 'music') {
		const lookaheadMs = 100;
		const scheduleLimit = currentElapsed + lookaheadMs * gameState.speed;

		let idx = gameState.nextNoteToSchedule;
		const notes = gameState.currentSong.notes;

		while (idx < notes.length) {
			const note = notes[idx];
			if (note.t > scheduleLimit) break;

			if (note.t >= currentElapsed && !note.isScheduled) {
				const delay = (note.t - currentElapsed) / gameState.speed;
				const id = window.setTimeout(() => {
					if (gameState.playing && !note.hit && gameState.soundMode === 'music') {
						playNote(note.midi, note.d, gameState.speed, 'guitar');
					}
				}, delay);
				note.isScheduled = true;
				scheduledNotes.push(id);
			}
			idx++;
		}
		gameState.nextNoteToSchedule = idx;
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
		gameState.currentSong.notes.forEach((n: any) => {
			n.hit = false;
			n.isScheduled = false;
		});
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
		playNote(midi, undefined, undefined, 'guitar');
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

/* Optimized startAudio is replaced by just-in-time scheduling in tick() */
export function startAudio() {
	clearAudio();
	// Reset isScheduled flag when starting/seeking
	gameState.currentSong.notes.forEach((n) => (n.isScheduled = false));
}

export function clearAudio() {
	scheduledNotes.forEach(clearTimeout);
	scheduledNotes.length = 0;
	stopAllNotes();
}

export function seekPercentage(pct: number) {
	gameState.elapsedBase = pct * getDuration();
	const currentElapsed = gameState.elapsedBase;

	// Reset scheduler index
	let idx = 0;
	while (idx < gameState.currentSong.notes.length && gameState.currentSong.notes[idx].t < currentElapsed) {
		idx++;
	}
	gameState.nextNoteToSchedule = idx;

	if (gameState.playing) {
		gameState.lastTs = performance.now();
		gameState.startTime = gameState.lastTs;
		startAudio();
	}
}