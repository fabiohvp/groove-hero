<script lang="ts">
	import midiFiles from '$lib/database/db.json';
	import type { MidiFileInfo } from '$lib/types';
	import Fuse from 'fuse.js';

	const MIDI_FILES = midiFiles as MidiFileInfo[];
	let { onSelect }: { onSelect: (song: MidiFileInfo) => void } = $props();

	let searchTerm = $state('');
	let filteredSongs = $state<MidiFileInfo[]>([]);
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);
	let inputElement: HTMLInputElement;

	// Novo estado para o filtro de dificuldade
	let selectedDifficulty = $state('all');
	const difficulties = ['all', ...new Set(['Beginner', 'Intermediate', 'Advanced'])];

	// Músicas a serem usadas pelo Fuse, derivadas da dificuldade selecionada
	const songsToSearch = $derived(
		selectedDifficulty === 'all'
			? MIDI_FILES
			: MIDI_FILES.filter((s) => s.difficulty === selectedDifficulty)
	);

	const fuse = $derived(
		new Fuse(songsToSearch, {
			keys: ['searchText'],
			includeScore: true,
			threshold: 0.4
		})
	);

	function handleInput() {
		if (searchTerm.trim() === '') {
			filteredSongs = songsToSearch.slice(0, 35); // Mostra itens iniciais da dificuldade filtrada
		} else {
			filteredSongs = fuse.search(searchTerm).map((result) => result.item);
		}
		showDropdown = true;
		selectedIndex = -1;
	}
	function handleDifficultyChange() {
		searchTerm = '';
		handleInput();
	}

	function handleFocus() {
		if (searchTerm.trim() === '') {
			filteredSongs = songsToSearch.slice(0, 35);
		} else {
			filteredSongs = fuse.search(searchTerm).map((result) => result.item);
		}
		showDropdown = true;
	}

	function handleBlur() {
		// Delay to allow click event on dropdown
		setTimeout(() => {
			showDropdown = false;
		}, 200);
	}

	function selectSong(e: MouseEvent | KeyboardEvent, song: MidiFileInfo) {
		e.preventDefault();
		searchTerm = song.name;
		showDropdown = false;
		onSelect(song);
		inputElement.blur();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filteredSongs.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (event.key === 'Enter' && selectedIndex !== -1) {
			event.preventDefault();
			selectSong(event, filteredSongs[selectedIndex]);
		} else if (event.key === 'Escape') {
			showDropdown = false;
		}
	}
</script>

<div class="flex items-center gap-2">
	<div class="relative">
		<select
			bind:value={selectedDifficulty}
			onchange={handleDifficultyChange}
			class="h-full appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/5 py-2 pr-8 pl-3 text-xs font-semibold text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
		>
			<option class="bg-[#0d1520] font-sans" value="all">Difficulty</option>
			{#each difficulties.filter((c) => c !== 'all') as difficulty (difficulty)}
				<option class="bg-[#0d1520] font-sans capitalize" value={difficulty}>{difficulty}</option>
			{/each}
		</select>
		<div
			class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400"
		>
			<svg class="h-4 w-4 fill-current" viewBox="0 0 20 20"
				><path
					d="M5.516 7.548c.436-.446 1.143-.446 1.579 0L10 10.405l2.905-2.857c.436-.446 1.143-.446 1.579 0 .436.445.436 1.167 0 1.612l-3.694 3.639c-.436.445-1.143.445-1.579 0L5.516 9.16c-.436-.445-.436-1.167 0-1.612z"
				/></svg
			>
		</div>
	</div>

	<div class="search-container rounded-sm border border-cyan-500/20">
		<input
			bind:this={inputElement}
			type="text"
			placeholder="Search for a song..."
			bind:value={searchTerm}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			class="bg-cyan-500/5 text-cyan-400 placeholder:text-cyan-500/30"
		/>
		{#if showDropdown && filteredSongs.length > 0}
			<div class="dropdown">
				{#each filteredSongs as song, i (song.path)}
					<button
						class:selected={i === selectedIndex}
						title={song.name}
						onmousedown={(e) => selectSong(e, song)}
					>
						<span class="song-name">{song.name}</span>
						<span class="song-category">{song.category}</span>
						<span
							class="song-difficulty"
							class:Beginner={song.difficulty === 'Beginner'}
							class:Intermediate={song.difficulty === 'Intermediate'}
							class:Advanced={song.difficulty === 'Advanced'}>{song.difficulty}</span
						>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.search-container {
		position: relative;
		width: 300px;
	}
	input {
		width: 100%;
		padding: 8px;
		box-sizing: border-box;
	}
	.dropdown {
		position: absolute;
		width: 100%;
		border: 1px solid #06b6d4;
		border-top: none;
		list-style-type: none;
		padding: 0;
		margin: 0;
		max-height: 300px;
		overflow-y: auto;
		background: #0d1520;
		z-index: 1000;
	}
	.dropdown button {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'name difficulty'
			'category difficulty';
		gap: 0 1rem;
		padding: 6px 10px;
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-bottom: 1px solid #0e283a;
	}
	.dropdown button:hover,
	.dropdown button.selected {
		background-color: #0e283a;
	}
	.song-name {
		grid-area: name;
		display: block;
		font-weight: bold;
		color: #e2f0ff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.song-category {
		grid-area: category;
		display: block;
		font-size: 0.8em;
		color: #6783a0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.song-difficulty {
		grid-area: difficulty;
		text-transform: capitalize;
		font-size: 0.8em;
		align-self: center;
		font-weight: bold;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.song-difficulty.Beginner {
		color: #059669;
		background-color: #05966920;
	}
	.song-difficulty.Intermediate {
		color: #f59e0b;
		background-color: #f59e0b20;
	}
	.song-difficulty.Advanced {
		color: #ef4444;
		background-color: #ef444420;
	}
</style>
