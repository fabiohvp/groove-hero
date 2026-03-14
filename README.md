# 🎹 PianoFlow

A browser-based rhythm piano game inspired by Guitar Hero, built for beginners learning to play piano. Blocks fall from the top of the screen toward a hit line aligned with an interactive piano keyboard — press the right key at the right time to score points.

---

## Adding Songs

Add .mid or .midi files to the `static/musics/` directory then run `npm run create-db`. This will generate necessary JSON files in `src/lib/database/`.
- Recommended repository with thousands of musics: https://github.com/lucasnfe/adl-piano-midi

## How to run locally

Execute `npm run dev -- --open` in the terminal and wait for browser to open and load.
- Suggestion: use it with a screen bigger than your piano and try to position the screen above the piano keyboard matching the keys on the screen with the piano keys (adjust keys amount and width as necessary). If you want to use with your TV you can use Port Forwarding.

---

## Browser Support

Works in any browser with Web Audio API and CSS `transform` support — Chrome, Firefox, Safari, Edge (all modern versions).

---

## Features

1. **User-friendly interface**: Designed for beginners, PianoFlow includes intuitive controls and tutorials that guide players on how to play the game effectively.
2. **Customizable difficulty levels**: Players can adjust the speed of block falling to match their skill level.
3. **Customizable piano**: Players can adjust the number of keys and the width of the keys.
4. **Loop toggle**: Players can loop the song to play it again after it ends.
5. **Sound mode toggle**: Players can toggle between sound mode and music mode.
6. **Keyboard compact mode**: Players can toggle between compact and normal mode.
7. **Timeline**: Full-width bar. Players can scrub through the song to jump to any moment.
8. **Speed** — 0.25× to 5× in 0.25 steps (default 1×). Changes apply instantly without restarting the song.

### Gameplay

- Blocks fall in columns aligned to piano keys, sized proportionally to note duration

<!-- ### Controls

- **Mouse / Touch** — click or tap piano keys directly
- **QWERTY keyboard** — mapped to one octave starting at C4:

  | Key  | A   | W   | S   | E   | D   | F   | T   | G   | Y   | H   | U   | J   | K   | O   | L   | P   |
  | ---- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Note | C4  | C#4 | D4  | D#4 | E4  | F4  | F#4 | G4  | G#4 | A4  | A#4 | B4  | C5  | C#5 | D5  | D#5 | -->
