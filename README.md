# Feverwake

An ASCII RPG about a world whose dreams are becoming infected.

**Play:** https://colemanimation.github.io/ASCII-project/

**Village construction kit:** https://colemanimation.github.io/ASCII-project/kit.html

The waking world is the Lantern Coast, a 280 x 116 character atlas with 14 landmarks, mountain passes, harbors, roads, and a folding skiff. The nightmares belong to people who cannot wake up.

## The terminal edition

The game uses a black background, an original 5x7 bitmap font, printable ASCII artwork, text window frames, bracketed commands, and character health bars. Map markers and travel paths are characters too. There are no vector circles, glow effects, gradient panels, or modern button chrome in the game.

Six distinct 64 x 40 towns have shops, inns, dream wards, conversations, ASCII portraits, and roaming residents. Brackenport has a fish quay, market stalls, gardens, laundry and cottages. Other settlements use stilt bridges, snowy fortifications, caravan tents, and cedar docks. Residents walk routes, pause at their stops, avoid each other, and wait when you approach. Service counters stay put. Water and chimney smoke animate with character changes.

Three room-based nightmares have furniture, clues, loot, alternate routes, locks, and mechanisms:

- **The Endless Nursery:** find the key in a toy horse and wind the clock. The clock settles the dangerous floorboards and releases the nursery latch.
- **The School After Midnight:** retrieve a missing name and ring the assembly bell. Either of two entrances leads to the headmaster; the library stair avoids backtracking through the main corridor.
- **The House Beneath the Tide:** drain the flooded passages with the cellar pump, recover a family photograph, and unlock the guest room.

Each dream has a guardian, hiding places, and a memory anchor. The roaming visitor cannot be killed. It moves when you move. The final sequence brings it into the waking world, where the only option is escape.

Combat, shops, equipment, selling, inns, dream levels and powers, dialogue choices, chiptunes, the animated intro, automatic saves, import/export, and offline installation remain playable. Waking empathy affects prices; courage helps with escape. Dream levels strengthen you inside dreams.

## Controls and phones

Mara has four generated mouth poses converted into 64 x 38 printable ASCII
frames. Her mouth follows the typewriter text, pauses at punctuation, and
closes when a line ends. **Menu > Mara's warning** replays the conversation
without resetting a journey. **Show line** (or Space / Enter) reveals the rest
immediately. Longer conversations have short pages so phones never need to
scroll. Text chatter has its own mute button and remembers the setting;
background music remains a separate switch. Reduced-motion mode shows each
line immediately. Closing, skipping, or hiding a conversation stops its sound.

Arrow keys / WASD move. E / Enter interacts. I opens inventory, M the map or local plan, J the journal, and Esc the menu. On a phone, hold the direction buttons or tap a destination. Tap a person or service to approach it. Tap a landmark on the world map to travel there. Ordinary encounters interrupt travel.

Local walking views follow you. **Plan** shows the entire town or dungeon; tap a reachable destination to return to walking. The interface fits one screen, including small phones, without page scrolling.

Town symbols: `@` you, `S` shop, `I` inn, `Q` sleeper, letters for residents, `>` exit. Dream symbols: `?` clue, `k` key, `L` mechanism, `+` locked door, `$` chest, `B` guardian, `!` memory anchor, `h` hiding place, `&` visitor, `>` wake.

Open the game in Safari and choose **Share > Add to Home Screen**, or use **Install app** in a supporting Android browser. After one successful online load, the service worker caches the game and font for offline play. Saves belong to the current browser or installed app; use **Menu > Export save** for a portable backup. Existing Feverwake saves retain inventory, story, choices and combat progress. Saves from the older local layouts resume at a safe entrance; defeated guardians remain defeated.

## ASCII village kit

The [browser workbench](https://colemanimation.github.io/ASCII-project/kit.html) previews all six blueprints and the reusable stamp library. Edit coordinates, roads, water, buildings or NPC routes, then compile. It checks service access and resident routes, displays the collision layer, and exports plain text, blueprint JSON, or map data.

The art and game share one compiler. A stamp is an array of ASCII rows with explicit doors and optional services. Its interior is solid even where the art contains spaces. Roads and bridges remain walkable. The exported `collision` strings use **0 = open, 1 = blocked**.

```sh
node scripts/ascii-kit.mjs export
node scripts/ascii-kit.mjs compile data/towns/bracken.blueprint.json my-village
```

The export command writes mockups, blueprints and collision data under `data/towns/` (or `dist/data/towns/` in a Sites checkout). `tileset.txt` is the printable stamp sheet. Compiling a custom blueprint writes `my-village.txt` and `my-village.json`; it does not replace a shipped town until its blueprint is integrated into `js/towns.js`.

## Development

### Portrait conversion

The generated source poses, 64 x 64 normalized images, ASCII text frames, and
exact built-in image-generation prompts are in `art/portraits/mara/`. Run:

```sh
python scripts/build-mara-portraits.py
```

This requires Pillow. It calibrates character density against the actual
Fever Terminal font, corrects the character-cell aspect ratio, and locks all
characters outside a 16 x 6 mouth rectangle to the original pose. It writes
`js/portraits.js` (or `dist/js/portraits.js`) and `docs/mara-mouth-poses.png`.
The browser renders the frames as text; the source PNGs are not loaded by the
game. `scripts/portrait_to_ascii.py` also converts other portraits via its CLI.
`js/dialogue.js` owns the reveal/animation clock and `js/text-sound.js` makes
the short square-wave chatter locally through Web Audio.

### Game source

No production dependencies or build step. Serve the repository over HTTP and open `index.html`. Run `npm test`. In a Sites checkout, static files live in `dist/`; scripts and tests support both layouts.

- `js/tilekit.js`, `js/towns.js`: reusable ASCII stamps, collision, authored town plans and walking routes.
- `js/dungeons.js`: room layouts, clues, gates, keys, mechanisms and persistent dream changes.
- `js/rpg.js`: combat, economy, saves, pathfinding, residents and the pursuer.
- `js/main.js`: input, dialogue, progression, UI and persistence.
- `js/render.js`, `js/scene.js`: character-only world and local renderers.
- `js/terminal.js`: responsive ASCII frames and text meters.
- `scripts/build-terminal-font.py`: rebuild the original CC0 font with Python fontTools.
- `scripts/build-icons.py`: render the font-based home-screen icons with fontTools and Pillow.
- `scripts/build-world.py`: deterministic overworld generator.
- `sw.js`, `manifest.webmanifest`: offline and home-screen support.

When shipping changes, update the service-worker cache version and all shared asset-version queries together. This prevents mixed old and new modules on GitHub Pages. Tests cover the full nested offline module graph, town routes, collisions, puzzle gates, save restoration, combat, economy, and an escapable path through each dream.

The original prototypes and standalone map editor remain for reference. The current game uses the `feverwake-save-v2` save slot and layout version 3.
