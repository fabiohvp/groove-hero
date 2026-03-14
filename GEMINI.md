# PianoFlow - Project Overview

**PianoFlow** is a SvelteKit-based web application designed for playing and interacting with MIDI files. It leverages the latest Svelte 5 features (such as Runes for reactivity) to provide a rich, interactive musical experience.

## Key Technologies
*   **Framework:** Svelte 5 & SvelteKit
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS (with `@tailwindcss/typography`)
*   **Language:** TypeScript
*   **Testing:** Vitest & `@testing-library/svelte`
*   **MIDI Processing:** `midi-file` package
*   **Search:** `fuse.js`

## Architecture & Directory Structure
*   `src/lib/`: Contains the core application logic, state management, and UI components.
    *   `game.svelte.ts`: Manages the central game state (playing, score, current song) using Svelte 5 Runes (`$state`, `$effect`).
    *   `midiManager.ts`: Handles the parsing of raw MIDI files into a structured JSON format suitable for the game.
    *   `components/`: Reusable Svelte components (Piano, Timeline, Controls, etc.).
    *   `database/`: Stores the pre-processed JSON representations of MIDI files.
*   `src/routes/`: SvelteKit file-based routing components.
*   `static/musics/`: The repository for raw `.mid` or `.midi` files.
*   `src/cli.ts`: A command-line utility used to process raw MIDI files from the `static/musics/` directory and generate the JSON database.

## Building and Running

### Development Server
To start the development server:
```sh
npm run dev
# or to open automatically in the browser
npm run dev -- --open
```

### Production Build
To create a production-ready build:
```sh
npm run build
```
You can preview the built application with `npm run preview`.

### Data Processing Scripts
The application relies on pre-processed JSON data derived from MIDI files. If you add new MIDI files to `static/musics/`, you must process them using the provided CLI scripts:
*   **`npm run create-midis`**: Parses MIDI files in `static/musics/` and generates individual `.json` song files in `src/lib/database/`.
*   **`npm run create-db`**: Scans the processed files and generates a master `db.json` index file in `src/lib/database/` for quick searching and listing.

### Testing & Linting
*   **Run tests:** `npm run test`
*   **Type checking:** `npm run check`
*   **Linting:** `npm run lint`
*   **Formatting:** `npm run format`

## Development Conventions
*   **Svelte 5 Runes:** The project actively uses Svelte 5 Runes (`$state`, `$effect`, `$derived`) for state management rather than legacy Svelte stores. Ensure new components and logic adhere to this paradigm.
*   **Static Asset Processing:** Do not attempt to parse raw MIDI files directly in the browser during runtime. Always use the CLI scripts to convert `.mid` files to `.json` files ahead of time to ensure optimal performance.
*   **Code Style:** The project uses Prettier and ESLint. Always run `npm run format` and `npm run lint` before committing changes.
