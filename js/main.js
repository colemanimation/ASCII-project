// main.js
import { CONFIG } from "./config.js";
import { loadMap } from "./world.js";
import { renderMapToPre, renderTitleToPre } from "./render.js";
import { bindInput } from "./input.js";

const els = {
  map: document.getElementById("map"),
  dialogue: document.getElementById("dialogue"),
  portrait: document.getElementById("portrait"),
  inventory: document.getElementById("inventory"),
};

let state = {
  map: null,

  // mode: "title" or "game"
  mode: "title",

  title: {
    frame: 0,
    seed: 1337,
    logoX: -120,
    logoSpeed: 0.35,
    logoLines: [
      "██████╗ ██╗   ██╗███████╗██╗  ██╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗",
      "██╔══██╗██║   ██║██╔════╝██║ ██╔╝██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║",
      "██║  ██║██║   ██║███████╗█████╔╝ ██║ █╗ ██║███████║   ██║   ██║     ███████║",
      "██║  ██║██║   ██║╚════██║██╔═██╗ ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║",
      "██████╔╝╚██████╔╝███████║██║  ██╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║",
      "╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝",
    ],
  },

  player: {
    x: CONFIG.defaultSpawn.x,
    y: CONFIG.defaultSpawn.y, // foot tile
    facing: CONFIG.defaultSpawn.facing,
    skin: "#d7c2a1",
    clothes: "#a9a9a9",
  },
};

function getStartMapName() {
  if (!CONFIG.useUrlMapOverride) return CONFIG.defaultMap;
  const params = new URLSearchParams(location.search);
  const m = params.get("map");
  return m || CONFIG.defaultMap;
}

function isBlocked(ch) {
  // Block mountains, trees, water
  return ch === "#" || ch === "T" || ch === "~";
}

function tryMove(dir) {
  if (state.mode !== "game") return;

  const p = state.player;
  p.facing = dir;

  const dx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const dy = dir === "up" ? -1 : dir === "down" ? 1 : 0;

  const nx = p.x + dx;
  const ny = p.y + dy;

  if (!state.map) return;
  if (nx < 0 || ny < 0 || nx >= state.map.width || ny >= state.map.height) return;

  const ch = state.map.grid[ny][nx];
  if (isBlocked(ch)) {
    els.dialogue.textContent = "Bumped.";
    renderOnce();
    return;
  }

  p.x = nx;
  p.y = ny;
  els.dialogue.textContent = `Moved ${dir}`;
  renderOnce();
}

function measureCharSize(preEl) {
  const cs = getComputedStyle(preEl);

  const probe = document.createElement("pre");
  probe.style.visibility = "hidden";
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.top = "0";
  probe.style.margin = "0";
  probe.style.padding = "0";
  probe.style.border = "0";
  probe.style.whiteSpace = "pre";
  probe.style.fontFamily = cs.fontFamily;
  probe.style.fontSize = cs.fontSize;
  probe.style.lineHeight = cs.lineHeight;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.style.fontVariantLigatures = "none";

  const n = 50;
  const line = ".".repeat(n);
  probe.textContent = line + "\n" + line;

  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  document.body.removeChild(probe);

  return { cw: rect.width / n, ch: rect.height / 2 };
}

function computeViewport(preEl, desiredW, desiredH) {
  const { cw, ch } = measureCharSize(preEl);

  const fitW = Math.floor(preEl.clientWidth / cw);
  const fitH = Math.floor(preEl.clientHeight / ch);

  let vw = Math.max(9, fitW);
  let vh = Math.max(9, fitH);

  // Force odd sizes so centering math is stable
  if (vw % 2 === 0) vw -= 1;
  if (vh % 2 === 0) vh -= 1;

  vw = Math.min(vw, desiredW);
  vh = Math.min(vh, desiredH);

  return { vw, vh };
}

function renderOnce() {
  const { vw, vh } = computeViewport(els.map, CONFIG.viewWidth, CONFIG.viewHeight);

  if (state.mode === "title") {
    // Move logo
    state.title.frame += 1;
    state.title.logoX += state.title.logoSpeed;

    const logoW = Math.max(...state.title.logoLines.map(l => l.length));
    if (state.title.logoX > vw) {
      state.title.logoX = -logoW;
    }

    renderTitleToPre(els.map, state.title, vw, vh);
    return;
  }

  // game mode
  if (!state.map) return;

  // Try render, then shrink vh only if last line clips
  let useVw = vw;
  let useVh = vh;

  for (let i = 0; i < 6; i++) {
    renderMapToPre(els.map, state.map, state.player, useVw, useVh);

    if (els.map.scrollHeight > els.map.clientHeight + 1) {
      useVh = Math.max(9, useVh - 1);
      if (useVh % 2 === 0) useVh -= 1;
      continue;
    }
    break;
  }
}

let rafId = null;
function startTitleLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);

  const tick = () => {
    if (state.mode === "title") {
      renderOnce();
      rafId = requestAnimationFrame(tick);
    }
  };
  rafId = requestAnimationFrame(tick);
}

function startGame() {
  state.mode = "game";
  els.dialogue.textContent = "Loaded. Use D-pad. Start returns later.";
  renderOnce();
}

async function boot() {
  els.portrait.textContent = "Portrait\n(later)";
  els.inventory.textContent = "- Nothing";
  els.dialogue.textContent = "Loading...";

  const startMap = getStartMapName();
  state.map = await loadMap(startMap);

  // Title screen starts immediately
  state.mode = "title";
  els.dialogue.textContent = "Title. Press Start.";
  startTitleLoop();

  window.addEventListener("resize", () => {
    renderOnce();
  });

  bindInput({
    onMove: tryMove,
    onA: () => { els.dialogue.textContent = "A pressed"; },
    onB: () => { els.dialogue.textContent = "B pressed"; },

    // This is the important part:
    // Start switches from title -> game
    onStart: () => {
      if (state.mode === "title") startGame();
      else els.dialogue.textContent = "Start pressed";
    },

    onSelect: () => { els.dialogue.textContent = "Select pressed"; },
  });
}

boot().catch(err => {
  els.dialogue.textContent = String(err);
});