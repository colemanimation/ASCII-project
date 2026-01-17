import { CONFIG } from "./config.js";
import { loadMap } from "./world.js";
import { renderMapToPre } from "./render.js";
import { bindInput } from "./input.js";

const els = {
  map: document.getElementById("map"),
  dialogue: document.getElementById("dialogue"),
  portrait: document.getElementById("portrait"),
  inventory: document.getElementById("inventory"),
};

let state = {
  map: null,
  player: {
    x: CONFIG.defaultSpawn.x,
    y: CONFIG.defaultSpawn.y, // foot tile
    facing: CONFIG.defaultSpawn.facing,
    skin: "#d7c2a1",
    clothes: "#a9a9a9",
  }
};

function getStartMapName() {
  if (!CONFIG.useUrlMapOverride) return CONFIG.defaultMap;
  const params = new URLSearchParams(location.search);
  const m = params.get("map");
  return m || CONFIG.defaultMap;
}

function isBlocked(ch) {
  // World map collision, simple for now
  // Block mountains, trees, water
  return ch === "#" || ch === "T" || ch === "~";
}

function tryMove(dir) {
  const p = state.player;
  p.facing = dir;

  const dx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const dy = dir === "up" ? -1 : dir === "down" ? 1 : 0;

  const nx = p.x + dx;
  const ny = p.y + dy;

  if (!state.map) return;
  if (nx < 0 || ny < 0 || nx >= state.map.width || ny >= state.map.height) return;

  // Foot tile collision check at target tile
  const ch = state.map.grid[ny][nx];
  if (isBlocked(ch)) {
    els.dialogue.textContent = "Bumped.";
    render();
    return;
  }

  p.x = nx;
  p.y = ny;
  els.dialogue.textContent = `Moved ${dir}`;
  render();
}

function render() {
  renderMapToPre(els.map, state.map, state.player, CONFIG.viewWidth, CONFIG.viewHeight);
}

async function boot() {
  els.portrait.textContent = "Portrait\n(later)";
  els.inventory.textContent = "- Nothing";
  els.dialogue.textContent = "Loading...";

  const startMap = getStartMapName();
  state.map = await loadMap(startMap);

  els.dialogue.textContent = `Loaded ${startMap}. Tip: add ?map=NAME to URL.`;
  render();

  bindInput({
    onMove: tryMove,
    onA: () => { els.dialogue.textContent = "A pressed"; },
    onB: () => { els.dialogue.textContent = "B pressed"; },
    onStart: () => { els.dialogue.textContent = "Start pressed"; },
    onSelect: () => { els.dialogue.textContent = "Select pressed"; },
  });
}

boot().catch(err => {
  els.dialogue.textContent = String(err);
});