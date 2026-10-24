# Feverwake

A single-screen ASCII RPG about a world whose dreams are becoming infected.

**Play:** https://colemanimation.github.io/ASCII-project/

The Lantern Coast is the waking world: a 280 × 116 ASCII atlas with 14 landmarks, roads, mountain passes, harbors, and a folding skiff. The dungeons are inside the dreams of people who cannot wake up.

## The playable chapter

- Six towns with NPC conversations and ASCII portraits, provision shops, equipment, selling, and inns.
- Wilderness encounters and turn-based combat: attack, guard, use items, escape, and unlock dream powers.
- Three infected dreams: The Endless Nursery, The School After Midnight, and The House Beneath the Tide. Each has a guardian, chests, hazards, hiding places, and a memory to recover.
- Dream experience grants levels and abilities. Waking choices build empathy or courage, changing prices and escape odds.
- A roaming visitor follows you through nightmares. It cannot be killed. The final sequence brings it into the waking world, where you must escape without fighting.
- Animated ASCII intro, original chiptunes, automatic local saves, import/export backups, and an installable offline app.

This is a compact first chapter, with three dreams and a short ending. Town layouts share a common structure. The world remains explorable after the chapter ends.

## Controls

Arrow keys / WASD move. E / Enter interacts. I opens inventory, M the atlas, J the journal, and Esc the menu. On a phone, hold the directional buttons or tap a destination. Tap a named landmark on the atlas to travel there. Ordinary encounters interrupt travel. Town roads are safe; the skiff crosses open water without encounters.

Inside towns: `S` shop, `I` inn, `Q` sleeper, `M` / `N` people, `>` exit. Inside dreams: `$` chest, `B` guardian, `!` memory anchor, `h` hiding place, `>` wake. The visitor is `&`. It advances when you move, leaving time to think.

## Save to a phone

Open the GitHub Pages link in Safari and choose **Share → Add to Home Screen**, or use **Install app** in a supporting Android browser. The installed game uses a single screen with no page scrolling. After one successful online load, the service worker caches the whole game for offline play.

Saves stay in the current browser or installed app. Browser storage can be cleared by the device; use **Menu → Export save** for a portable backup. Export/import also moves progress between Safari and an installed app if they use separate storage. The previous atlas prototype's beacon progress does not carry into this RPG.

## Development

No production dependencies or build step. Serve this directory over HTTP and open `index.html`. Run `npm test` with a current Node.js release. When checked out through Sites, static files live in `dist/`; tests and the world generator support both layouts.

- `js/rpg.js`: pure combat, economy, save validation, local maps, and pursuer rules.
- `js/main.js`: scenes, dialogue, input, UI, progression, and persistence.
- `js/render.js`: cached multi-resolution overworld renderer.
- `js/scene.js`: town/dungeon renderer and animated intro.
- `js/atlas.js`: map parsing, collision, and A* routing.
- `scripts/build-world.py`: deterministic atlas generator, including current lore.
- `manifest.webmanifest`, `sw.js`, `icons/`: home-screen and offline support. Increment the service-worker cache version and the shared asset-version query in the entrypoint/imports when shipping asset changes. This prevents older GitHub Pages assets from being mixed with a newer screen.

The original `Test06.html`, early maps, and standalone map editor remain in the repository for reference. This game uses the new `feverwake-save-v2` save slot.
