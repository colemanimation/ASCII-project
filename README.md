# Somnia

An ASCII RPG about a world whose dreams are becoming infected.

The opening tells the order's creation fable: a goddess builds the world, her
jealous brother destroys it, and she preserves it in her dying dream. The
keepers of Somnia guard the passages that mortal dreams open into the Great
Dream. "Or so the tale is told" leaves the truth of that account unresolved.

Four generated illustrations become six short, skippable ASCII story cards.
The title screen follows the fable; **Menu > Opening fable** replays it without
resetting a journey. The narration and illustration dissolve respect reduced
motion. The music uses an original eight-bar lullaby in 6/8, with a quiet
answering voice on alternate repeats and an altered version inside dreams.

**Play:** https://colemanimation.github.io/ASCII-project/

**Village construction kit:** https://colemanimation.github.io/ASCII-project/kit.html

The waking world is the Lantern Coast, a 280 x 116 character atlas with 14 landmarks, mountain passes, harbors, roads, and a folding skiff. The nightmares belong to people who cannot wake up.

## The terminal edition

The game uses a black background, an original 5x7 bitmap font, printable ASCII artwork, text window frames, bracketed commands, and character health bars. Map markers and travel paths are characters too. There are no vector circles, glow effects, gradient panels, or modern button chrome in the game.

Six distinct 64 x 40 towns have shops, inns, dream wards, conversations, ASCII portraits, and roaming residents. Brackenport has a fish quay, market stalls, gardens, laundry and cottages. Other settlements use stilt bridges, snowy fortifications, caravan tents, and cedar docks. Residents walk routes, pause at their stops, avoid each other, and wait when you approach. Service counters stay put. Water and chimney smoke animate with character changes.

People now occupy two character rows: a turning head above a consistent body.
Clothing distinguishes the player, Mara, travelers, fishers, workers, and
children. Movement still uses one tile at the feet; the head can overlap
scenery, and figures draw in foot order. Tap either half to approach and talk.
The [figure sheet](https://colemanimation.github.io/ASCII-project/figures.html)
shows all four directions for the main town figures.

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
without resetting a journey. Tap the portrait, text, or **Continue** (or press
Space / Enter) to reveal the rest immediately. The same bottom row advances
longer conversations, then becomes the reply choices. Dialogue keeps only the
portrait, speaker, text, close control, and that action row; short pages fit
small phones without scrolling. Reduced-motion mode shows each line immediately.
Closing, skipping, or hiding a conversation stops its chatter.

**Sound** controls both music and text chatter and remembers the setting. It
also appears in the menu. Switching it on plays a two-note confirmation, even
when no one is speaking. One shared Web Audio output uses the playback audio
session where supported, resumes after interruptions, and retries from a real
tap if the browser suspends it. Text chatter uses a clearer midrange tone for
phone speakers.

Arrow keys / WASD move. E / Enter interacts. I opens inventory, M the map or local plan, J the journal, and Esc the menu. On a phone, hold the direction buttons or tap a destination. Tap a person or service to approach it. Tap a landmark on the world map to travel there. Ordinary encounters interrupt travel.

Local walking views follow you. **Plan** shows the entire town or dungeon; tap a reachable destination to return to walking. The interface fits one screen, including small phones, without page scrolling.

The player has an `O` head over an `X` body when facing forward; side-facing
heads use `<` and `>`, and north-facing heads use `^`. Building signs remain
`S` shop, `I` inn, and `Q` sleeper ward. Dream symbols: `?` clue, `k` key,
`L` mechanism, `+` locked door, `$` chest, `!` memory anchor, `h` hiding place,
and `>` wake. Guardians and the tall visitor are two-row figures too. The
overworld and blueprint exports retain their small map markers.

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

### Opening fable

`art/fable/` contains all four unmodified generated source PNGs, exact built-in
image-generation prompts, converted text plates, and ASCII previews. Run
`python scripts/build-fable.py` to rebuild the 112 x 38 character plates and
`docs/somnia-fable-ascii.png`. Only the compact text module is shipped to the
game; the large source PNGs are not downloaded during play. The conversion
uses the same font-calibrated pipeline as Mara's portrait. `js/fable.js`
contains the six narration cards and the skippable reveal controller.

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
short triangle-wave chatter locally through Web Audio. `js/audio-output.js`
shares one output between chatter and music, owns mute persistence, and handles
gesture unlocking and interrupted audio sessions.

### Game source

No production dependencies or build step. Serve the repository over HTTP and open `index.html`. Run `npm test`. In a Sites checkout, static files live in `dist/`; scripts and tests support both layouts.

- `js/tilekit.js`, `js/towns.js`: reusable ASCII stamps, collision, authored town plans and walking routes.
- `js/dungeons.js`: room layouts, clues, gates, keys, mechanisms and persistent dream changes.
- `js/rpg.js`: combat, economy, saves, pathfinding, residents and the pursuer.
- `js/main.js`: input, dialogue, progression, UI and persistence.
- `js/figures.js`: two-row bodies, directional heads, and unified hit areas.
- `js/fable.js`, `js/fable-art.js`: the creation tale and generated ASCII plates.
- `js/songs.js`, `js/music.js`: original scores, arranged voices, and Web Audio playback.
- `js/render.js`, `js/scene.js`: character-only world and local renderers.
- `js/terminal.js`: responsive ASCII frames and text meters.
- `scripts/build-terminal-font.py`: rebuild the original CC0 font with Python fontTools.
- `scripts/build-icons.py`: render the font-based home-screen icons with fontTools and Pillow.
- `scripts/build-world.py`: deterministic overworld generator.
- `sw.js`, `manifest.webmanifest`: offline and home-screen support.

When shipping changes, update the service-worker cache version and all shared asset-version queries together. This prevents mixed old and new modules on GitHub Pages. Tests cover the full nested offline module graph, town routes, collisions, puzzle gates, save restoration, combat, economy, an escapable path through each dream, dialogue timing, and shared audio mute/resume behavior.

The original prototypes and standalone map editor remain for reference. The current game uses the `feverwake-save-v2` save slot and layout version 3.
