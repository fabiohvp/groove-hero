export interface Note {
	midi: number;
	t: number;
	d: number;
	hit?: boolean;
	v?: number;
	ch?: number;
}

export interface Song {
	name: string;
	bpm: number;
	notes: Note[];
	difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}
