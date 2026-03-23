<script lang="ts">
	import type { MidiFileInfo } from '$lib/types';
	import Fuse from 'fuse.js';
	import { onMount } from 'svelte';

	let MIDI_FILES = $state<MidiFileInfo[]>([]);
	let { onSelect }: { onSelect: (song: MidiFileInfo) => void } = $props();

	let searchTerm = $state('');
	let filteredSongs = $state<MidiFileInfo[]>([]);
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);
	let inputElement: HTMLInputElement;

	onMount(async () => {
		try {
			const res = await fetch('/db.json');
			if (res.ok) {
				MIDI_FILES = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch midi files database', e);
		}
	});

	// New state for difficulty and category filters
	let selectedDifficulty = $state('all');
	let selectedCategory = $state('all');
	const difficulties = ['all', ...new Set(['Beginner', 'Intermediate', 'Advanced'])];
	const categories = $derived([
		'all',
		...Array.from(new Set(MIDI_FILES.map((s) => s.category))).sort()
	]);

	// Songs to be used by Fuse, derived from selected difficulty and category
	const songsToSearch = $derived(
		MIDI_FILES.filter((s) => {
			const passDifficulty = selectedDifficulty === 'all' || s.difficulty === selectedDifficulty;
			const passCategory = selectedCategory === 'all' || s.category === selectedCategory;
			return passDifficulty && passCategory;
		})
	);

	const fuse = $derived(
		new Fuse(songsToSearch, {
			keys: ['searchText'],
			includeScore: true,
			threshold: 0.4
		})
	);

	function applySearchOrFilter() {
		const isCategorySelected = selectedCategory !== 'all';
		const isDifficultySelected = selectedDifficulty !== 'all';
		const isSearchValid = searchTerm.trim().length >= 2;

		if (!isCategorySelected && !isDifficultySelected && !isSearchValid) {
			filteredSongs = [];
			return;
		}

		if (searchTerm.trim() === '') {
			filteredSongs = songsToSearch; // Show initial items of filtered difficulty
		} else {
			filteredSongs = fuse.search(searchTerm).map((result) => result.item);
		}
	}

	function handleInput() {
		applySearchOrFilter();
		showDropdown = filteredSongs.length > 0;
		selectedIndex = -1;
	}

	function handleFilterChange() {
		searchTerm = '';
		applySearchOrFilter();
		showDropdown = filteredSongs.length > 0;
	}

	function handleFocus() {
		applySearchOrFilter();
		showDropdown = filteredSongs.length > 0;
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
			onchange={handleFilterChange}
			class="h-full appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/5 py-1 pr-8 pl-3 text-xs font-semibold text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
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

	<div class="relative">
		<select
			bind:value={selectedCategory}
			onchange={handleFilterChange}
			class="h-full max-w-[150px] appearance-none rounded-sm border border-cyan-500/20 bg-cyan-500/5 py-1 pr-8 pl-3 text-xs font-semibold text-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
		>
			<option class="bg-[#0d1520] font-sans" value="all">Category</option>
			{#each categories.filter((c) => c !== 'all') as category (category)}
				<option class="bg-[#0d1520] font-sans capitalize" value={category}>{category}</option>
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

	<div class="search-container border-none">
		<input
			bind:this={inputElement}
			type="text"
			placeholder="Search for a song..."
			bind:value={searchTerm}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			class="rounded-sm border border-cyan-500/20 bg-cyan-500/5 text-cyan-500 placeholder:text-cyan-500/30 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
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
		padding-inline: 10px;
		padding-block: 0px;
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
