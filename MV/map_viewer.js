// ASCII Map Viewer
// - Pan: drag
// - Pinch: zoom
// - Zoom buttons: +/-
// - Fit: fit map into view
// - Paint mode: tap/drag to place a tile character
// - Brush size: 1x1, 3x3, 5x5, 7x7
// - Undo: revert last paint stroke
// - Copy: opens modal with full map text + copy-to-clipboard

const canvas = document.getElementById(“c”);
const ctx = canvas.getContext(“2d”, { alpha: false });

// Top UI
const labelEl = document.getElementById(“label”);
const btnIn = document.getElementById(“btnIn”);
const btnOut = document.getElementById(“btnOut”);
const btnFit = document.getElementById(“btnFit”);
const fileInput = document.getElementById(“fileInput”);

// Bottom edit bar
const editBar = document.getElementById(“editBar”);
const btnMode = document.getElementById(“btnMode”);
const btnUndo = document.getElementById(“btnUndo”);
const btnCopy = document.getElementById(“btnCopy”);
const brushLabel = document.getElementById(“brushLabel”);
const brushSizeRow = document.getElementById(“brushSizeRow”);

// Copy modal
const copyModal = document.getElementById(“copyModal”);
const copyText = document.getElementById(“copyText”);
const copyClose = document.getElementById(“copyClose”);

let mapLines = [];
let mapW = 0;
let mapH = 0;

let camX = 0; // in tile units, top-left of view
let camY = 0;
let zoom = 16; // pixels per tile

const ZOOM_MIN = 6;
const ZOOM_MAX = 40;

const PALETTE = {
“≈”: “#6f849a”,
“~”: “#7f93a8”,
“.”: “#bdbdbd”,
“,”: “#a9a9a9”,
“#”: “#8a8a8a”,
“T”: “#7f9a7f”,
“Y”: “#6f8f6f”,
“+”: “#bfc7d1”,
“’”: “#d0d0d0”,
“^”: “#9a8f7f”,
“;”: “#8a6f6f”,
“=”: “#d0d0d0”,
“ “: “#000000”,
};

function clamp(n, lo, hi) {
return Math.max(lo, Math.min(hi, n));
}

// Use a stable monospace font
function setFont(px) {
ctx.font = `${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
ctx.textBaseline = “top”;
}

function resize() {
const uiH = document.getElementById(“ui”).getBoundingClientRect().height;
const editH = editBar.getBoundingClientRect().height;

const viewW = window.innerWidth;
const viewH = window.innerHeight - uiH - editH;

// Set the canvas CSS box (what you see)
canvas.style.position = “fixed”;
canvas.style.left = “0”;
canvas.style.top = `${uiH}px`;
canvas.style.width = `${viewW}px`;
canvas.style.height = `${viewH}px`;

// Set the canvas backing store (for crisp text on retina)
canvas.width = Math.floor(viewW * devicePixelRatio);
canvas.height = Math.floor(viewH * devicePixelRatio);

// Make drawing use CSS pixels
ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

draw();
}

function tilesVisible() {
const viewW = canvas.clientWidth;
const viewH = canvas.clientHeight;

const tilesAcross = Math.ceil(viewW / zoom) + 2;
const tilesDown = Math.ceil(viewH / zoom) + 2;

return { viewW, viewH, tilesAcross, tilesDown };
}

function parseMapText(text) {
const lines = text.replace(/\r/g, “”).split(”\n”);
while (lines.length && lines[lines.length - 1] === “”) lines.pop();

mapH = lines.length;
mapW = lines.reduce((m, s) => Math.max(m, s.length), 0);

mapLines = lines.map(s => s.padEnd(mapW, “ “));
labelEl.textContent = `Loaded map: ${mapW}×${mapH}`;
}

function fitToScreen() {
if (!mapW || !mapH) return;

const viewW = canvas.clientWidth;
const viewH = canvas.clientHeight;

const zX = Math.floor(viewW / mapW);
const zY = Math.floor(viewH / mapH);
zoom = clamp(Math.min(zX, zY), ZOOM_MIN, ZOOM_MAX);

// Center the camera on the map (helps when clamp prevents full fit)
const { tilesAcross, tilesDown } = tilesVisible();
camX = (mapW - tilesAcross) / 2;
camY = (mapH - tilesDown) / 2;

draw();
}

function draw() {
const { viewW, viewH, tilesAcross, tilesDown } = tilesVisible();

ctx.fillStyle = “#000”;
ctx.fillRect(0, 0, viewW, viewH);

if (!mapW || !mapH) {
labelEl.textContent = “Load a map…”;
return;
}

// clamp camera
camX = clamp(camX, 0, Math.max(0, mapW - tilesAcross));
camY = clamp(camY, 0, Math.max(0, mapH - tilesDown));

setFont(zoom);

for (let y = 0; y < tilesDown; y++) {
const my = Math.floor(camY + y);
if (my < 0 || my >= mapH) continue;

```
const row = mapLines[my];
for (let x = 0; x < tilesAcross; x++) {
  const mx = Math.floor(camX + x);
  if (mx < 0 || mx >= mapW) continue;

  const ch = row[mx] || " ";
  if (ch === " ") continue;

  ctx.fillStyle = PALETTE[ch] || "#cfcfcf";
  ctx.fillText(ch, x * zoom, y * zoom);
}
```

}

labelEl.textContent = `${mapW}×${mapH}  zoom=${zoom}px  cam=(${camX.toFixed(1)},${camY.toFixed(1)})`;
}

// –––––––––– Loading (file upload) ––––––––––

fileInput.addEventListener(“change”, async (e) => {
const f = e.target.files?.[0];
if (!f) return;
labelEl.textContent = `Opening ${f.name}…`;
const text = await f.text();
parseMapText(text);
fitToScreen();
});

// –––––––––– Zoom buttons ––––––––––

btnIn.addEventListener(“click”, () => {
zoom = clamp(zoom + 2, ZOOM_MIN, ZOOM_MAX);
draw();
});
btnOut.addEventListener(“click”, () => {
zoom = clamp(zoom - 2, ZOOM_MIN, ZOOM_MAX);
draw();
});
btnFit.addEventListener(“click”, () => {
fitToScreen();
});

// –––––––––– Stage 1 Editing ––––––––––

let paintMode = false;
let brushChar = “.”;
let brushSize = 1; // 1, 3, 5, 7
brushLabel.textContent = brushChar;

const BRUSHES = [”.”, “,”, “~”, “≈”, “#”, “T”, “Y”, “+”, “^”, “;”, “=”, “ “];
const brushRow = document.getElementById(“brushRow”);
brushRow.innerHTML = “”;
for (const ch of BRUSHES) {
const b = document.createElement(“button”);
b.type = “button”;
b.textContent = ch === “ “ ? “␠” : ch;
b.title = ch === “ “ ? “Space” : ch;
b.addEventListener(“click”, () => {
brushChar = ch;
updateBrushLabel();
});
brushRow.appendChild(b);
}

// Brush size buttons
const BRUSH_SIZES = [1, 3, 5, 7];
brushSizeRow.innerHTML = “”;
for (const size of BRUSH_SIZES) {
const b = document.createElement(“button”);
b.type = “button”;
b.textContent = `${size}×${size}`;
b.title = `Brush size ${size}×${size}`;
if (size === brushSize) b.classList.add(“active”);
b.addEventListener(“click”, () => {
brushSize = size;
updateBrushLabel();
// Update active state
brushSizeRow.querySelectorAll(“button”).forEach(btn => btn.classList.remove(“active”));
b.classList.add(“active”);
});
brushSizeRow.appendChild(b);
}

function updateBrushLabel() {
const display = brushChar === “ “ ? “␠” : brushChar;
brushLabel.textContent = `${display} (${brushSize}×${brushSize})`;
}

updateBrushLabel();

btnMode.addEventListener(“click”, () => {
paintMode = !paintMode;
btnMode.textContent = paintMode ? “Pan” : “Paint”;
});

const undoStack = [];
let currentStroke = null;

function beginStroke() {
currentStroke = [];
}
function endStroke() {
if (currentStroke && currentStroke.length) undoStack.push(currentStroke);
currentStroke = null;
}

function paintAt(tileX, tileY) {
if (!mapW || !mapH) return;

// Calculate brush offset (centered)
const offset = Math.floor(brushSize / 2);

// Paint in a square around the center tile
for (let dy = -offset; dy <= offset; dy++) {
for (let dx = -offset; dx <= offset; dx++) {
const x = tileX + dx;
const y = tileY + dy;

```
  // Bounds check
  if (x < 0 || y < 0 || x >= mapW || y >= mapH) continue;

  const row = mapLines[y];
  const prev = row[x];
  if (prev === brushChar) continue;

  mapLines[y] = row.substring(0, x) + brushChar + row.substring(x + 1);
  if (currentStroke) currentStroke.push({ x, y, prev });
}
```

}
}

btnUndo.addEventListener(“click”, () => {
const stroke = undoStack.pop();
if (!stroke) return;
// restore in reverse
for (let i = stroke.length - 1; i >= 0; i–) {
const { x, y, prev } = stroke[i];
const row = mapLines[y];
mapLines[y] = row.substring(0, x) + prev + row.substring(x + 1);
}
draw();
});

// –––––––––– Copy / Export ––––––––––

function openCopyModal() {
copyText.value = mapLines.join(”\n”);
copyModal.classList.add(“open”);
}

function closeCopyModal() {
copyModal.classList.remove(“open”);
}

btnCopy.addEventListener(“click”, async () => {
if (!mapW || !mapH) return;

// Try direct clipboard first (best case)
try {
await navigator.clipboard.writeText(mapLines.join(”\n”));
labelEl.textContent = “Copied map text to clipboard.”;
return;
} catch {
// Fallback: show modal so you can manually copy
openCopyModal();
}
});

copyClose.addEventListener(“click”, () => {
closeCopyModal();
});

copyModal.addEventListener(“click”, (ev) => {
// tapping the dim background should close it
if (ev.target === copyModal) closeCopyModal();
});

// –––––––––– Pan + pinch + paint ––––––––––

let pointers = new Map();
let lastPinchDist = 0;

function dist(a, b) {
const dx = a.x - b.x;
const dy = a.y - b.y;
return Math.hypot(dx, dy);
}

function eventToTile(ev) {
const rect = canvas.getBoundingClientRect();
const x = ev.clientX - rect.left;
const y = ev.clientY - rect.top;
const tx = Math.floor(camX + x / zoom);
const ty = Math.floor(camY + y / zoom);
return { tx, ty };
}

canvas.addEventListener(“pointerdown”, (ev) => {
canvas.setPointerCapture(ev.pointerId);
pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
lastPinchDist = 0;

if (paintMode) {
beginStroke();
const { tx, ty } = eventToTile(ev);
paintAt(tx, ty);
draw();
}
});

canvas.addEventListener(“pointermove”, (ev) => {
if (!pointers.has(ev.pointerId)) return;

const prev = pointers.get(ev.pointerId);
const cur = { x: ev.clientX, y: ev.clientY };
pointers.set(ev.pointerId, cur);

const pts = Array.from(pointers.values());

if (paintMode && pts.length === 1) {
const { tx, ty } = eventToTile(ev);
paintAt(tx, ty);
draw();
return;
}

if (!paintMode && pts.length === 1) {
// Pan
const dx = cur.x - prev.x;
const dy = cur.y - prev.y;
camX -= dx / zoom;
camY -= dy / zoom;
draw();
return;
}

if (!paintMode && pts.length >= 2) {
// Pinch zoom using first two pointers
const a = pts[0];
const b = pts[1];
const d = dist(a, b);

```
if (!lastPinchDist) {
  lastPinchDist = d;
  return;
}

const delta = d - lastPinchDist;
if (Math.abs(delta) > 1) {
  const oldZoom = zoom;
  zoom = clamp(Math.round(zoom + delta * 0.03), ZOOM_MIN, ZOOM_MAX);

  // keep center-ish stable
  const cx = (canvas.clientWidth / 2) / oldZoom + camX;
  const cy = (canvas.clientHeight / 2) / oldZoom + camY;
  camX = cx - (canvas.clientWidth / 2) / zoom;
  camY = cy - (canvas.clientHeight / 2) / zoom;

  lastPinchDist = d;
  draw();
}
```

}
});

function endPointer(ev) {
pointers.delete(ev.pointerId);
lastPinchDist = 0;
if (paintMode) endStroke();
}

canvas.addEventListener(“pointerup”, endPointer);
canvas.addEventListener(“pointercancel”, endPointer);

// –––––––––– Boot ––––––––––

window.addEventListener(“resize”, resize);

// Start blank until user loads a file
resize();
draw();