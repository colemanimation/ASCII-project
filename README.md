# DUSKWATCH · The Lantern Atlas

An explorable ASCII world for Coleman's ASCII project. The Lantern Coast is a 280 × 116 plain-text map with fourteen authored landmarks, mountain passes, rivers, roads, forests, snowfields, dunes, and islands.

## Play

Serve the repository over HTTP, then open `index.html`. It uses native browser modules and has no build step or external runtime dependencies. For example, run `python -m http.server 8000` in the GitHub checkout and open `http://localhost:8000`.

- **Atlas:** drag to pan; wheel, pinch, or use the buttons to zoom. Select a landmark on the map or use “Find a place.”
- **Explore:** WASD, arrow keys, or held direction buttons move the traveler. Click a destination or chart a course to travel automatically. The folding skiff makes water traversable. Peaks require a pass.
- **Interact:** E, Enter, or the Interact button opens a nearby landmark's dialogue. Dialogue pauses movement. Escape closes it or stops travel.
- **The Long Way Home:** light Mosswatch, Frostspire, and the Sunken Bell, then visit the Observatory. Completing it leaves the world open for further exploration.
- **Workshop:** paint terrain, undo/redo, import, and export plain-text maps. Hold Space while dragging to pan; on touch use two fingers. Maps retain the 280 × 116 expedition grid and protected landmark coordinates. The standalone editor at `MV/map_viewer.html` accepts other map sizes.
- **Audio:** optional original chiptune loops change with region. Music starts only after pressing Sound, uses one audio context, and pauses when the page is hidden.

Progress and edited terrain are stored in the current browser's local storage. Export a text map for a portable copy. “Restore map” resets terrain after confirmation and keeps expedition progress.

## Source layout

- `data/maps/lantern_coast.txt`: editable ASCII terrain, one character per tile.
- `data/maps/lantern_coast.json`: landmarks, dialogue, spawn, labels, and world dimensions.
- `js/atlas.js`: pure map parsing, pathfinding, and save validation.
- `js/render.js`: cached character rendering, overview detail levels, labels, and camera.
- `js/main.js`: exploration, dialogue, quest, persistence, input, and workshop.
- `js/music.js` and `js/songs.js`: audio scheduler and original compositions.
- `scripts/build-world.py`: reproducible, art-directed terrain generator. Running it overwrites the generated text and metadata files.
- `Test06.html`: original standalone prototype, retained.
- `MV/`: original standalone map editor, with default atlas loading, fit, and stylesheet repairs.

The Sites checkout stores the web root under `dist/`; the GitHub checkout keeps the web root at the repository root. The generator and tests support both layouts.

## Validation

Run `npm test` (Node.js, no dependency installation required). Six tests verify ASCII export round-tripping, map dimensions, route continuity and collision, reachability of all fourteen landmarks, the complete beacon route, malformed map rejection, and saved-state validation.

Browser QA covered the complete three-beacon quest and ending, save/reload, atlas selection and zoom, painting, undo/redo, exporting the edited text, re-importing it, map restore, optional audio activation, and held movement in a 390-pixel iframe. The phone layout was checked in Chromium; physical iOS Safari and real multitouch gestures were not exercised.
