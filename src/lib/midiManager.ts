// src/lib/midiManager.ts

import * as fs from 'fs/promises';
import { parseMidi as parseMidiFile } from 'midi-file';
import * as path from 'path';
import { normalizeForSearch, safeFilePath } from './string';
import type { MidiFileInfo, Note, Song } from './types';

function replaceMidiToJsonExtension(filePath: string) {
	return filePath.replace('.mid', '.json').replace('.midi', '.json');
}


export async function findMidisFromPath(rootDir: string, dir?: string): Promise<MidiFileInfo[]> {
	if (!dir) {
		dir = rootDir;
	}

	let results: MidiFileInfo[] = [];
	try {
		const dirents = await fs.readdir(dir, { withFileTypes: true });

		for (const dirent of dirents) {
			const fullPath = path.resolve(dir, dirent.name);

			if (dirent.isDirectory()) {
				results = results.concat(await findMidisFromPath(rootDir, fullPath));
			} else {
				const fileExtension = path.extname(fullPath).toLowerCase();

				if (fileExtension === '.mid' || fileExtension === '.midi') {
					const pathInfo = path.parse(fullPath);
					const relativePath = path.relative(rootDir, fullPath);
					const relativePathWithoutFilename = path.dirname(relativePath);
					const category = relativePathWithoutFilename.replaceAll(path.sep, ' - ')
					results.push({
						jsonPath: replaceMidiToJsonExtension(safeFilePath(relativePath)),
						path: relativePath,
						name: pathInfo.name,
						category: category,
						searchText: normalizeForSearch(category + ' ' + pathInfo.name),
					});
				}
			}
		}
	} catch (error) {
		console.error(`Error reading directory: ${dir}`, error);
	}
	return results;
}

export function parseMidiToJson(arrayBuffer: ArrayBuffer, fileInfo: MidiFileInfo): Song {
	const parsed = parseMidiFile(new Uint8Array(arrayBuffer));

	let bpm = 120; // Default BPM
	const notes: Note[] = [];
	const openNotes: { [key: number]: { t: number; v: number } } = {};

	const timeDivision = parsed.header.ticksPerBeat || 96;

	for (const track of parsed.tracks) {
		let currentTime = 0;
		for (const event of track) {
			const deltaTimeInMs = event.deltaTime * 60000 / (timeDivision * bpm);
			currentTime += deltaTimeInMs;

			if (event.type === 'setTempo') {
				bpm = 60000000 / event.microsecondsPerBeat;
			}

			if (event.type === 'noteOn' && event.velocity > 0) {
				openNotes[event.noteNumber] = { t: currentTime, v: event.velocity };
			}

			if ((event.type === 'noteOff' || (event.type === 'noteOn' && event.velocity === 0)) && openNotes[event.noteNumber]) {
				const noteStart = openNotes[event.noteNumber];
				notes.push({
					midi: event.noteNumber,
					hit: false,
					t: noteStart.t,
					d: currentTime - noteStart.t,
					v: noteStart.v,
				});
				delete openNotes[event.noteNumber];
			}
		}
	}

	notes.sort((a, b) => a.t - b.t);

	// Find the first tempo event to set the song's main BPM, or use default
	let mainBpm = 120;
	for (const track of parsed.tracks) {
		const tempoEvent = track.find(e => e.type === 'setTempo');
		if (tempoEvent && tempoEvent.type === 'setTempo') {
			mainBpm = 60000000 / tempoEvent.microsecondsPerBeat;
			break;
		}
	}

	// Difficulty calculation
	const durationInSeconds = notes.length > 0 ? notes[notes.length - 1].t / 1000 : 0;
	const noteDensity = durationInSeconds > 0 ? notes.length / durationInSeconds : 0;

	const midiNumbers = notes.map(n => n.midi);
	const noteRange = midiNumbers.length > 0 ? Math.max(...midiNumbers) - Math.min(...midiNumbers) : 0;

	let maxPolyphony = 0;
	if (notes.length > 0) {
		const timeline: { time: number, type: 'start' | 'end' }[] = [];
		notes.forEach(note => {
			timeline.push({ time: note.t, type: 'start' });
			timeline.push({ time: note.t + note.d, type: 'end' });
		});
		timeline.sort((a, b) => a.time - b.time);

		let currentPolyphony = 0;
		for (const event of timeline) {
			if (event.type === 'start') {
				currentPolyphony++;
				if (currentPolyphony > maxPolyphony) {
					maxPolyphony = currentPolyphony;
				}
			} else {
				currentPolyphony--;
			}
		}
	}

	// Simple scoring system
	const densityScore = noteDensity * 3; // Density is a strong indicator
	const rangeScore = noteRange * 0.5; // Wider range is harder
	const polyphonyScore = maxPolyphony * 4; // Polyphony is a very strong indicator

	const totalScore = densityScore + rangeScore + polyphonyScore;

	let difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
	if (totalScore < 20) {
		difficulty = 'Beginner';
	} else if (totalScore < 40) {
		difficulty = 'Intermediate';
	} else {
		difficulty = 'Advanced';
	}

	return {
		jsonPath: replaceMidiToJsonExtension(safeFilePath(fileInfo.path)),
		path: fileInfo.path,
		name: fileInfo.name,
		difficulty,
		bpm: mainBpm,
		notes
	};
}

export async function parseMidisFromPathToJson(dir: string): Promise<Song[]> {
	const midiFiles = await findMidisFromPath(dir);
	const songs: Song[] = [];

	for (const fileInfo of midiFiles) {
		try {
			const buffer = await fs.readFile(path.join(dir, fileInfo.path));
			const arrayBuffer = Uint8Array.from(buffer).buffer;
			const song = parseMidiToJson(arrayBuffer, fileInfo);
			songs.push({ ...song, path: safeFilePath(fileInfo.path) });
		} catch (error) {
			console.error(`Error parsing MIDI file: ${fileInfo.path}`, error);
		}
	}

	return songs;
}
