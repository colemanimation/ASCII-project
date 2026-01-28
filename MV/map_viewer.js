const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: false });

const labelEl = document.getElementById("label");
const btnIn = document.getElementById("btnIn");
const btnOut = document.getElementById("btnOut");
const btnFit = document.getElementById("btnFit");
const fileInput = document.getElementById("fileInput");

const brushRow = document.getElementById("brushRow");
const btnMode = document.getElementById("btnMode");
const btnUndo = document.getElementById("btnUndo");
const btnCopy = document.getElementById("btnCopy");
const brushLabel = document.getElementById("brushLabel");

const copyModal = document.getElementById("copyModal");
const copyText = document.getElementById("copyText");
const btnCloseCopy = document.getElementById("btnCloseCopy");

let mapLines = [];
let mapW = 0;
let mapH = 0;

let grid = [];          // 2D array of chars: grid[y][x]
let currentBrush = "."; // active paint brush
let editMode = "paint"; // "paint" or "pan"
let undoStack = [];     // list of {x,y,prev,next}
const UNDO_MAX = 5000;

let camX = 0; // in tile units, top-left of view
let camY = 0;
let zoom = 16; // pixels per tile (we will clamp)

const ZOOM_MIN = 6;
const ZOOM_MAX = 40;

const PALETTE = {
  "≈": "#6f849a",
  "~": "#7f93a8",
  ".": "#bdbdbd",
  ",": "#a9a9a9",
  "#": "#8a8a8a",
  "T": "#7f9a7f",
  "Y": "#6f8f6f",
  "+": "#bfc7d1",
  "'": "#d0d0d0",
  "^": "#9a8f7f",
  ";": "#8a6f6f",
  "=": "#d0d0d0",
  " ": "#000000",
};

// Use a stable monospace font
function setFont(px) {
  ctx.font = `${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "top";
}

function resize() {
  const uiH = document.getElementById("ui").getBoundingClientRect().height;
  canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  canvas.height = Math.floor((window.innerHeight - uiH) * devicePixelRatio);

  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight - uiH}px`;
  canvas.style.top = `${uiH}px`;

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  draw();
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function parseMapText(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  mapH = lines.length;
  mapW = lines.reduce((m, s) => Math.max(m, s.length), 0);

  // Pad and store
  mapLines = lines.map(s => s.padEnd(mapW, " "));

  // Editable grid
  grid = mapLines.map(line => Array.from(line));

  labelEl.textContent = `Loaded map: ${mapW}×${mapH}`;
  undoStack = [];
}

function fitToScreen() {
  if (!mapW || !mapH) return;

  const viewWpx = window.innerWidth;
  const uiH = document.getElementById("ui").getBoundingClientRect().height;
  const viewHpx = window.innerHeight - uiH;

  const zX = Math.floor(viewWpx / mapW);
  const zY = Math.floor(viewHpx / mapH);
  zoom = clamp(Math.min(zX, zY), ZOOM_MIN, ZOOM_MAX);

  camX = 0;
  camY = 0;
  draw();
}

function draw() {
  if (!mapW || !mapH) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const uiH = document.getElementById("ui").getBoundingClientRect().height;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight - uiH;

  // tiles visible (+ a small buffer)
  const tilesAcross = Math.ceil(viewW / zoom) + 2;
  const tilesDown = Math.ceil(viewH / zoom) + 2;

  // clamp camera
  camX = clamp(camX, 0, Math.max(0, mapW - tilesAcross));
  camY = clamp(camY, 0, Math.max(0, mapH - tilesDown));

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, viewW, viewH);

  setFont(zoom);

  // draw as colored characters
  for (let y = 0; y < tilesDown; y++) {
    const my = Math.floor(camY + y);
    if (my < 0 || my >= mapH) continue;

    const row = grid[my];
    for (let x = 0; x < tilesAcross; x++) {
      const mx = Math.floor(camX + x);
      if (mx < 0 || mx >= mapW) continue;

      const ch = row[mx] || " ";
      const color = PALETTE[ch] || "#cfcfcf";

      // Skip drawing pure black spaces to speed it up a bit
      if (ch === " ") continue;

      ctx.fillStyle = color;
      ctx.fillText(ch, x * zoom, y * zoom);
    }
  }

  labelEl.textContent = `${mapW}×${mapH}  zoom=${zoom}px  cam=(${camX.toFixed(1)},${camY.toFixed(1)})`;
}

// -------------------- Loading maps --------------------
async function loadManifest() {
  const manifestUrl = new URL("../data/maps/maps.json", import.meta.url);
  const res = await fetch(manifestUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load maps.json (${res.status}) at ${manifestUrl}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.maps)) throw new Error("maps.json missing { maps: [...] }");
  return data.maps;
}

async function loadInitialMap() {
  const params = new URLSearchParams(location.search);
  const requested = params.get("map");

  const maps = await loadManifest();

  // If URL explicitly requests a map, use it
  if (requested) {
    const m = maps.find(x => x.file === requested);
    if (!m) throw new Error(`Map not found in manifest: ${requested}`);

    const mapUrl = new URL(`../data/maps/${m.file}`, import.meta.url);
    const res = await fetch(mapUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not fetch ${m.file}`);
    parseMapText(await res.text());
    fitToScreen();
    return;
  }

  // Otherwise load first map in manifest
  if (!maps.length) throw new Error("No maps listed in maps.json");

  const first = maps[0];
  const mapUrl = new URL(`../data/maps/${first.file}`, import.meta.url);
  const res = await fetch(mapUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not fetch ${first.file}`);
  parseMapText(await res.text());
  fitToScreen();
}

fileInput.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  labelEl.textContent = `Opening ${f.name}…`;
  const text = await f.text();
  parseMapText(text);
  fitToScreen();
});

// -------------------- Zoom buttons --------------------

btnIn.addEventListener("click", () => {
  zoom = clamp(zoom + 2, ZOOM_MIN, ZOOM_MAX);
  draw();
});
btnOut.addEventListener("click", () => {
  zoom = clamp(zoom - 2, ZOOM_MIN, ZOOM_MAX);
  draw();
});
btnFit.addEventListener("click", () => {
  fitToScreen();
});

// -------------------- Editor UI --------------------

const BRUSHES = [
  ".", ",", "#", "T", "Y",
  "~", "≈", "=", "+", "'", "^", ";", " "
];

function brushDisplay(ch) {
  return ch === " " ? "␠" : ch;
}

function setBrush(ch) {
  currentBrush = ch;
  brushLabel.textContent = `Brush: ${brushDisplay(ch)}`;
  for (const b of brushRow.querySelectorAll(".brushBtn")) {
    b.classList.toggle("active", b.dataset.ch === ch);
  }
}

function buildBrushRow() {
  brushRow.innerHTML = "";
  for (const ch of BRUSHES) {
    const btn = document.createElement("button");
    btn.className = "brushBtn";
    btn.type = "button";
    btn.dataset.ch = ch;
    btn.textContent = brushDisplay(ch);

    // color hint (optional)
    const color = PALETTE[ch] || "#cfcfcf";
    if (ch !== " ") btn.style.color = color;

    btn.addEventListener("click", () => setBrush(ch));
    brushRow.appendChild(btn);
  }
  setBrush(currentBrush);
}

btnMode.addEventListener("click", () => {
  editMode = (editMode === "paint") ? "pan" : "paint";
  btnMode.textContent = (editMode === "paint") ? "Paint" : "Pan";
});

btnUndo.addEventListener("click", () => undo());

btnCopy.addEventListener("click", () => exportToClipboard());

btnCloseCopy.addEventListener("click", () => {
  copyModal.hidden = true;
});

buildBrushRow();

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < mapW && y < mapH;
}

function paintAtTile(tx, ty) {
  if (!grid.length) return;
  if (!inBounds(tx, ty)) return;

  const prev = grid[ty][tx];
  const next = currentBrush;
  if (prev === next) return;

  // record undo
  undoStack.push({ x: tx, y: ty, prev, next });
  if (undoStack.length > UNDO_MAX) undoStack.shift();

  // apply
  grid[ty][tx] = next;
}

function undo() {
  const op = undoStack.pop();
  if (!op) return;
  if (!inBounds(op.x, op.y)) return;
  grid[op.y][op.x] = op.prev;
  draw();
}

function gridToText() {
  const lines = [];
  for (let y = 0; y < mapH; y++) {
    // right-trim but keep meaningful interior spaces
    let line = grid[y].join("");
    line = line.replace(/\s+$/g, "");
    lines.push(line);
  }
  return lines.join("\n");
}

async function exportToClipboard() {
  const text = gridToText();

  // Try real clipboard first
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      labelEl.textContent = `Copied ${mapW}×${mapH} to clipboard`;
      return;
    }
  } catch {}

  // Fallback modal
  copyText.value = text;
  copyModal.hidden = false;
  // Focus + select for quick manual copy
  setTimeout(() => {
    copyText.focus();
    copyText.select();
  }, 50);
}

// -------------------- Pan + pinch --------------------

let pointers = new Map();
let lastPinchDist = 0;

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

canvas.addEventListener("pointerdown", (ev) => {
  canvas.setPointerCapture(ev.pointerId);
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  lastPinchDist = 0;

  // Single tap paint (only in paint mode)
  if (editMode === "paint") {
    const uiH = document.getElementById("ui").getBoundingClientRect().height;
    const px = ev.clientX;
    const py = ev.clientY - uiH;

    const tx = Math.floor(camX + (px / zoom));
    const ty = Math.floor(camY + (py / zoom));

    paintAtTile(tx, ty);
    draw();
  }
});

canvas.addEventListener("pointermove", (ev) => {
  if (!pointers.has(ev.pointerId)) return;
  const prev = pointers.get(ev.pointerId);
  const cur = { x: ev.clientX, y: ev.clientY };
  pointers.set(ev.pointerId, cur);

  const pts = Array.from(pointers.values());

  if (pts.length === 1) {
  if (editMode === "pan") {
    // Pan mode: drag moves camera
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    camX -= dx / zoom;
    camY -= dy / zoom;
    draw();
  } else {
    // Paint mode: drag paints tiles
    const uiH = document.getElementById("ui").getBoundingClientRect().height;
    const px = cur.x;
    const py = cur.y - uiH;

    const tx = Math.floor(camX + (px / zoom));
    const ty = Math.floor(camY + (py / zoom));

    paintAtTile(tx, ty);
    draw();
  }
} else if (pts.length >= 2) {
    // Pinch zoom using first two pointers
    const a = pts[0];
    const b = pts[1];
    const d = dist(a, b);

    if (!lastPinchDist) {
      lastPinchDist = d;
      return;
    }

    const delta = d - lastPinchDist;
    if (Math.abs(delta) > 1) {
      const oldZoom = zoom;
      zoom = clamp(Math.round(zoom + delta * 0.03), ZOOM_MIN, ZOOM_MAX);

      // Keep center stable-ish
      const cx = (window.innerWidth / 2) / oldZoom + camX;
      const cy = (window.innerHeight / 2) / oldZoom + camY;
      camX = cx - (window.innerWidth / 2) / zoom;
      camY = cy - (window.innerHeight / 2) / zoom;

      lastPinchDist = d;
      draw();
    }
  }
});

canvas.addEventListener("pointerup", (ev) => {
  pointers.delete(ev.pointerId);
  lastPinchDist = 0;
});
canvas.addEventListener("pointercancel", (ev) => {
  pointers.delete(ev.pointerId);
  lastPinchDist = 0;
});

// -------------------- Boot --------------------

window.addEventListener("resize", resize);

(function boot() {
  try {
    resize();
    loadInitialMap()
      .then(() => draw())
      .catch(err => {
        labelEl.textContent = String(err);
      });
  } catch (err) {
    labelEl.textContent = String(err);
  }
})();
