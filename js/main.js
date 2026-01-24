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

  return {
    cw: rect.width / n,
    ch: rect.height / 2
  };
}

function computeViewport(preEl, desiredW, desiredH) {
  const { cw, ch } = measureCharSize(preEl);

  const fitW = Math.floor(preEl.clientWidth / cw);
  const fitH = Math.floor(preEl.clientHeight / ch);

  let vw = Math.max(9, fitW);
  let vh = Math.max(9, fitH);

  if (vw % 2 === 0) vw -= 1;
  if (vh % 2 === 0) vh -= 1;

  vw = Math.min(vw, desiredW);
  vh = Math.min(vh, desiredH);

  return { vw, vh };
}

function render() {
  let { vw, vh } = computeViewport(els.map, CONFIG.viewWidth, CONFIG.viewHeight);

  // Try rendering, then shrink only if the last line is clipped.
  // We cap attempts so we don't loop forever.
  for (let i = 0; i < 6; i++) {
    renderMapToPre(els.map, state.map, state.player, vw, vh);

    // If the rendered content is taller than the panel, reduce vh.
    if (els.map.scrollHeight > els.map.clientHeight + 1) {
      vh = Math.max(9, vh - 1);
      if (vh % 2 === 0) vh -= 1;
      continue;
    }

    break;
  }

  // Debug (optional)
  els.dialogue.textContent = `vw=${vw} vh=${vh} px=${els.map.clientWidth}x${els.map.clientHeight} sh=${els.map.scrollHeight}`;
}

function makeTitleState(vw, vh) {
  const bannerLines = [
`██████╗ ██╗   ██╗███████╗██╗  ██╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗`,
`██╔══██╗██║   ██║██╔════╝██║ ██╔╝██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║`,
`██║  ██║██║   ██║███████╗█████╔╝ ██║ █╗ ██║███████║   ██║   ██║     ███████║`,
`██║  ██║██║   ██║╚════██║██╔═██╗ ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║`,
`██████╔╝╚██████╔╝███████║██║  ██╗╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║`,
`╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝`,
  ];

  const bannerW = Math.max(...bannerLines.map(l => l.length));

  // Stars
  const starCount = Math.floor((vw * vh) / 18);
  const stars = Array.from({ length: starCount }, () => {
    const pairs = [[ ".", "·" ], [ "*", "+" ], [ "·", " " ]];
    const p = pairs[Math.floor(Math.random() * pairs.length)];
    return {
      x: Math.floor(Math.random() * vw),
      y: Math.floor(Math.random() * vh),
      ch1: p[0],
      ch2: p[1],
      phase: Math.floor(Math.random() * 30),
      period: 18 + Math.floor(Math.random() * 30),
    };
  });

  return {
    frame: 0,
    stars,
    shooters: [],
    bannerLines,
    bannerW,
    bannerX: -bannerW,     // start fully offscreen to the left
    bannerSpeed: 0.35,     // tweak to taste
  };
}

async function boot() {
  els.portrait.textContent = "Portrait\n(later)";
  els.inventory.textContent = "- Nothing";
  els.dialogue.textContent = "Loading...";

  const startMap = getStartMapName();
  state.map = await loadMap(startMap);

  els.dialogue.textContent = `Loaded ${startMap}. Tip: add ?map=NAME to URL.`;
  render();
  window.addEventListener("resize", render);

  bindInput({
    onMove: tryMove,
    onA: () => { els.dialogue.textContent = "A pressed"; },
    onB: () => { els.dialogue.textContent = "B pressed"; },
    onStart: () => { els.dialogue.textContent = "Start pressed"; },
    onSelect: () => { els.dialogue.textContent = "Select pressed"; },
  });
}

function updateTitleState(ts, vw, vh) {
  ts.frame++;

  // Move banner left-to-right
  ts.bannerX += ts.bannerSpeed;

  // Once banner fully exits right, reset to left
  if (ts.bannerX > vw) {
    ts.bannerX = -ts.bannerW;
  }

  // Optional: shooting star spawn and update
  if (ts.shooters.length < 2 && Math.random() < 0.025) {
    ts.shooters.push({
      x: Math.floor(Math.random() * vw * 0.6),
      y: Math.floor(Math.random() * vh * 0.4),
      dx: 1,
      dy: 1,
      len: 7 + Math.floor(Math.random() * 6),
      life: 14 + Math.floor(Math.random() * 10),
    });
  }
  ts.shooters = ts.shooters
    .map(s => ({ ...s, x: s.x + 1.2, y: s.y + 1.0, life: s.life - 1 }))
    .filter(s => s.life > 0);
}

const { vw, vh } = computeViewport(els.map, CONFIG.viewWidth, CONFIG.viewHeight);

if (!state.title || state.title.bannerW == null) {
  state.title = makeTitleState(vw, vh);
}

updateTitleState(state.title, vw, vh);
renderTitleToPre(els.map, state.title, vw, vh);

boot().catch(err => {
  els.dialogue.textContent = String(err);
});