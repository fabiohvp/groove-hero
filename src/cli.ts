import { findMidisFromPath, parseMidiToJson } from '$lib/midiManager';
import { safeFilePath } from '$lib/string';
import type { MidiFileInfo, Song } from '$lib/types';
import * as fs from 'fs/promises';
import * as path from 'node:path';

const musicsPath = path.join(process.cwd(), 'static/musics');
const databasePath = path.join(process.cwd(), 'src/lib/database');
const midiFilesJsonPath = path.join(databasePath, 'db.json');

async function createMidis(midiLibraryPath: string) {
	console.log('Creating MIDIs...');
	const midiFiles: MidiFileInfo[] = await findMidisFromPath(midiLibraryPath)

	for (const midiFile of midiFiles) {
		const midiFilePath = path.join(midiLibraryPath, midiFile.path);
		try {
			const buffer = await fs.readFile(midiFilePath);
			const arrayBuffer = Uint8Array.from(buffer).buffer;
			const song = parseMidiToJson(arrayBuffer, midiFile);

			// Create a valid filename from the song name
			const outputFileName = `${safeFilePath(song.name)}.json`;
			const relativeDir = path.dirname(midiFile.path);
			const outputDir = path.join(databasePath, relativeDir);

			await fs.mkdir(outputDir, { recursive: true });

			const outputPath = path.join(outputDir, outputFileName);
			await fs.writeFile(outputPath, JSON.stringify(song, null, 2));
			console.log(`Created: ${outputPath}`);
		} catch (error) {
			console.error(`Error processing file: ${midiFilePath}`, error);
		}
	}
	console.log('Done creating MIDIs.');
}

async function createDatabase(rootPath: string) {
	const midiFiles = await findMidisFromPath(rootPath);

	for (const midiFile of midiFiles) {
		try {
			const relativeDir = path.dirname(midiFile.path);
			const outputFileName = `${safeFilePath(midiFile.name)}.json`;
			midiFile.jsonPath = path.join(relativeDir, outputFileName);
			
			const jsonPath = path.join(databasePath, midiFile.jsonPath);
			const jsonContent = await fs.readFile(jsonPath, 'utf-8');
			const song = JSON.parse(jsonContent) as Song;

			if (song.difficulty) midiFile.difficulty = song.difficulty;
		} catch (error) { console.error(error); }
	}

	await fs.writeFile(midiFilesJsonPath, JSON.stringify(midiFiles, null, 2));
	console.log(`Generated db.json at ${midiFilesJsonPath}`);
}

async function main() {
	const args = process.argv.slice(2);

	if (!args[0].includes('--')) {
		console.error('Uso: ts-node cli.ts --create-db | --create-midis');
		process.exit(1);
	}

	await fs.mkdir(databasePath, { recursive: true });

	if (args.includes('--create-midis')) {
		await createMidis(musicsPath);
	} else if (args.includes('--create-db')) {
		await createDatabase(musicsPath);
	}
}

main();