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

export function renderTitleToPre(preEl, titleState, viewW, viewH) {
  const vw = viewW;
  const vh = viewH;

  // cellGrid[y][x] = { ch, color }
  const cellGrid = Array.from({ length: vh }, () =>
    Array.from({ length: vw }, () => ({ ch: " ", color: "#000000" }))
  );

  // Stars (simple sparkle)
  for (const s of titleState.stars) {
    const tw = ((titleState.frame + s.phase) % s.period) < (s.period / 2);
    const ch = tw ? s.ch1 : s.ch2;
    const color = tw ? "#cfcfcf" : "#7a7a7a";
    if (s.x >= 0 && s.x < vw && s.y >= 0 && s.y < vh) cellGrid[s.y][s.x] = { ch, color };
  }

  // Shooting stars (optional)
  for (const sh of titleState.shooters) {
    for (let i = 0; i < sh.len; i++) {
      const x = Math.round(sh.x - i * sh.dx);
      const y = Math.round(sh.y - i * sh.dy);
      if (x >= 0 && x < vw && y >= 0 && y < vh) {
        cellGrid[y][x] = { ch: i === 0 ? "✦" : "·", color: "#ffffff" };
      }
    }
  }

  // --- SCROLLING BANNER ---
  const bannerLines = titleState.bannerLines;
  const bannerW = titleState.bannerW;
  const bannerH = bannerLines.length;

  // Center vertically, but you can set this wherever you want
  const bannerY = Math.max(0, Math.floor((vh - bannerH) / 2));

  // Draw clipped banner at current X
  drawBannerClipped(cellGrid, bannerLines, Math.floor(titleState.bannerX), bannerY, "#ffffff");

  // "Press Start" prompt
  const prompt = "Press Start";
  const py = vh - 3;
  const px = Math.max(0, Math.floor((vw - prompt.length) / 2));
  if (py >= 0 && py < vh) {
    for (let i = 0; i < prompt.length; i++) {
      const x = px + i;
      if (x >= 0 && x < vw) cellGrid[py][x] = { ch: prompt[i], color: "#cfcfcf" };
    }
  }

  // Emit HTML
  function spanChar(ch, color) {
    const safe = ch === " " ? "&nbsp;" : escHtml(ch);
    return `<span style="color:${color}">${safe}</span>`;
  }

  preEl.innerHTML = cellGrid
    .map(row => row.map(cell => spanChar(cell.ch, cell.color)).join(""))
    .join("\n");
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

boot().catch(err => {
  els.dialogue.textContent = String(err);
});