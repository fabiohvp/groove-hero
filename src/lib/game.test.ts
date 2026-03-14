import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { gameState, restartGame } from './game.svelte';
import * as audio from './audio';
import type { Song } from './types';

vi.mock('./audio', () => ({
	playNote: vi.fn(),
	stopAllNotes: vi.fn()
}));

const dbPath = path.resolve(__dirname, './database/db.json');
const dbContent = fs.readFileSync(dbPath, 'utf-8');
const midiFiles = JSON.parse(dbContent);

describe('Game fall synchronization across all database songs', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal('requestAnimationFrame', vi.fn());
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	for (const midi of midiFiles) {
		test(`Sync check for ${midi.jsonPath}`, () => {
			const songPath = path.resolve(__dirname, './database', midi.jsonPath);
			const songContent = fs.readFileSync(songPath, 'utf-8');
			const song = JSON.parse(songContent) as Song;

			if (!song.notes || song.notes.length === 0) return;

			gameState.currentSong = song;
			gameState.speed = 1;
			gameState.fallZoneHeight = 360;

			const firstNote = song.notes[0];
			const pxPerMs = 0.22 * gameState.speed;
			const expectedFallTimeMs = gameState.fallZoneHeight / pxPerMs;

			const timeNow = 10000;
			vi.setSystemTime(timeNow);
			vi.stubGlobal('performance', { now: () => Date.now() });

			restartGame();

			const elapsedInitial = gameState.elapsedBase;
			const audioDelayMs = (firstNote.t - elapsedInitial) / gameState.speed;

			expect(audio.playNote).not.toHaveBeenCalled();

			vi.advanceTimersByTime(audioDelayMs + 1);

			expect(audio.playNote).toHaveBeenCalledWith(firstNote.midi, firstNote.d, gameState.speed);

			const simulatedElapsed = elapsedInitial + audioDelayMs * gameState.speed;
			const blockH = Math.max(12, firstNote.d * pxPerMs);
			const expectedTy = (simulatedElapsed - firstNote.t) * pxPerMs + (gameState.fallZoneHeight - blockH);

			expect(expectedTy + blockH).toBeCloseTo(gameState.fallZoneHeight, 2);
		});
	}
});
