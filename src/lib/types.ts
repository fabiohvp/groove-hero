export interface Note {
	midi: number;
	t: number; // start time in ms
	d: number; // duration in ms
	hit?: boolean;
	isScheduled?: boolean;
	v?: number;
	ch?: number;
	guitarPos?: { stringIndex: number; fretIndex: number };
}

export interface Song {
	jsonPath: string;
	path: string;
	name: string;
	bpm: number;
	notes: Note[];
	difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface KeyLayout {
	midi: number;
	type: 'white' | 'black';
	left: number;
	width: number;
	height: number;
	centerX: number;
}


export interface MidiEvent {
	tick: number;
	type: 'noteOn' | 'noteOff' | 'tempo' | 'trackName';
	channel?: number;
	note?: number;
	velocity?: number;
	tempo?: number;
	name?: string;
}

export interface ParsedMidi {
	format: number;
	numTracks: number;
	timeDivision: number;
	tracks: MidiEvent[][];
}

export interface MidiToNotesResult {
	bpm: number;
	trackName: string;
	notes: Note[];
}

export interface DifficultyResult {
	level: 'Beginner' | 'Intermediate' | 'Advanced';
	score: number;
	breakdown: {
		density: number;
		intervals: number;
		range: number;
		polyphony: number;
		rhythm: number;
		bpm: number;
	};
}

export interface MidiFileInfo {
	path: string;
	jsonPath: string;
	category: string;
	name: string;
	searchText: string;
	difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}
