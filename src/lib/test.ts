import * as fs from 'fs/promises';
import * as path from 'path';
import { findMidisFromPath, parseMidiToJson } from './midiManager';
import type { Note } from './types';

const musicsPath = path.join(process.cwd(), 'static/musics');

async function runTest() {
  console.log('Running tests...');

  const midiFiles = await findMidisFromPath(musicsPath);

  let failedTests = 0;

  for (const midiFile of midiFiles) {
    try {
      const midiFilePath = path.join(musicsPath, midiFile.path);
      const buffer = await fs.readFile(midiFilePath);
      const arrayBuffer = Uint8Array.from(buffer).buffer;
      const song = parseMidiToJson(arrayBuffer, midiFile);

      if (song.notes.length === 0) {
        console.log(`- Skipping ${midiFile.name}: No notes found.`);
        continue;
      }

      const firstNote = song.notes[0];
      const minTimeNote = song.notes.reduce((minNote: Note, currentNote: Note) => {
        return currentNote.t < minNote.t ? currentNote : minNote;
      }, song.notes[0]);

      if (firstNote.t !== minTimeNote.t) {
        console.error(`❌ Test failed for ${midiFile.name}:`);
        console.error(`  First note time: ${firstNote.t}`);
        console.error(`  Minimum time note: ${minTimeNote.t}`);
        failedTests++;
      } else {
        console.log(`✅ Test passed for ${midiFile.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing file: ${midiFile.path}`, error);
      failedTests++;
    }
  }

  if (failedTests === 0) {
    console.log('All tests passed!');
  } else {
    console.error(`${failedTests} tests failed.`);
    process.exit(1);
  }
}

runTest();
