const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d", { alpha: false });

const uiEl = document.getElementById("ui");
const editBarEl = document.getElementById("editBar");

const labelEl = document.getElementById("label");
const btnIn = document.getElementById("btnIn");
const btnOut = document.getElementById("btnOut");
const btnFit = document.getElementById("btnFit");
const btnOpen = document.getElementById("btnOpen");
const fileInput = document.getElementById("fileInput");

const btnPaint = document.getElementById("btnPaint");
const btnUndo = document.getElementById("btnUndo");
const btnCopy = document.getElementById("btnCopy");

const brushRow = document.getElementById("brushRow");
const brushLabel = document.getElementById("brushLabel");
const brushSizeRow = document.getElementById("brushSizeRow");

const copyModal = document.getElementById("copyModal");
const copyText = document.getElementById("copyText");
const copyClose = document.getElementById("copyClose");

let mapLines = [];
let mapW = 0;
let mapH = 0;

let camX = 0; // tile units
let camY = 0;
let zoom = 16; // px per tile

const ZOOM_MIN = 6;
const ZOOM_MAX = 40;

// Palette (matches your game tiles)
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

// Brushes shown in UI
const BRUSHES = ["~", "≈", ".", ",", "#", "T", "Y", "+", "'", "^", ";", "=", " "];

// Brush sizes (odd squares)
const BRUSH_SIZES = [1, 3, 5];

let paintMode = false;
let brushChar = ".";
let brushSize = 1;

// Undo: stack of strokes; each stroke is list of {x,y,prev,next}
const undoStack = [];
let activeStroke = null;

// -------------------- Helpers --------------------

function setFont(px) {
  ctx.font = `${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "top";
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function resize() {
  const uiH = uiEl.getBoundingClientRect().height;
  const barH = editBarEl.getBoundingClientRect().height;

  const cssW = window.innerWidth;
  const cssH = Math.max(0, window.innerHeight - uiH - barH);

  canvas.style.top = `${uiH}px`;
  canvas.style.left = `0px`;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  canvas.width = Math.floor(cssW * devicePixelRatio);
  canvas.height = Math.floor(cssH * devicePixelRatio);

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  draw();
}

function parseMapText(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  mapH = lines.length;
  mapW = lines.reduce((m, s) => Math.max(m, s.length), 0);

  mapLines = lines.map(s => s.padEnd(mapW, " "));
  labelEl.textContent = `Loaded map: ${mapW}×${mapH}`;
}

function mapToString() {
  return mapLines.map(row => row).join("\n");
}

function fitToScreen() {
  if (!mapW || !mapH) return;

  const uiH = uiEl.getBoundingClientRect().height;
  const barH = editBarEl.getBoundingClientRect().height;

  const viewW = window.innerWidth;
  const viewH = Math.max(0, window.innerHeight - uiH - barH);

  const zX = Math.floor(viewW / mapW);
  const zY = Math.floor(viewH / mapH);
  zoom = clamp(Math.min(zX, zY), ZOOM_MIN, ZOOM_MAX);

  camX = 0;
  camY = 0;
  draw();
}

function draw() {
  const uiH = uiEl.getBoundingClientRect().height;
  const barH = editBarEl.getBoundingClientRect().height;

  const viewW = window.innerWidth;
  const viewH = Math.max(0, window.innerHeight - uiH - barH);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, viewW, viewH);

  if (!mapW || !mapH) {
    labelEl.textContent = "No map loaded";
    return;
  }

  // tiles visible (+ small buffer)
  const tilesAcross = Math.ceil(viewW / zoom) + 2;
  const tilesDown = Math.ceil(viewH / zoom) + 2;

  camX = clamp(camX, 0, Math.max(0, mapW - tilesAcross));
  camY = clamp(camY, 0, Math.max(0, mapH - tilesDown));

  setFont(zoom);

  for (let y = 0; y < tilesDown; y++) {
    const my = Math.floor(camY + y);
    if (my < 0 || my >= mapH) continue;

    const row = mapLines[my];
    for (let x = 0; x < tilesAcross; x++) {
      const mx = Math.floor(camX + x);
      if (mx < 0 || mx >= mapW) continue;

      const ch = row[mx] || " ";
      if (ch === " ") continue;

      ctx.fillStyle = PALETTE[ch] || "#cfcfcf";
      ctx.fillText(ch, x * zoom, y * zoom);
    }
  }

  labelEl.textContent = `${mapW}×${mapH}  zoom=${zoom}px  cam=(${camX.toFixed(1)},${camY.toFixed(1)})`;
}

// Convert pointer coords to tile coords
function pointerToTile(ev) {
  const r = canvas.getBoundingClientRect();
  const lx = ev.clientX - r.left;
  const ly = ev.clientY - r.top;

  const tx = Math.floor(lx / zoom + camX);
  const ty = Math.floor(ly / zoom + camY);

  return { tx, ty };
}

function setTile(x, y, ch) {
  if (x < 0 || y < 0 || x >= mapW || y >= mapH) return;
  const row = mapLines[y];
  const prev = row[x];
  if (prev === ch) return;

  // record undo
  if (activeStroke) {
    // avoid duplicates within same stroke
    const key = `${x},${y}`;
    if (!activeStroke._seen) activeStroke._seen = new Set();
    if (activeStroke._seen.has(key)) return;
    activeStroke._seen.add(key);

    activeStroke.push({ x, y, prev, next: ch });
  }

  mapLines[y] = row.substring(0, x) + ch + row.substring(x + 1);
}

function paintAt(tx, ty) {
  if (!mapW || !mapH) return;

  const half = Math.floor(brushSize / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      setTile(tx + dx, ty + dy, brushChar);
    }
  }
  draw();
}

// -------------------- UI wiring --------------------

function rebuildBrushUI() {
  brushRow.innerHTML = "";
  for (const ch of BRUSHES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ch === " " ? "␠" : ch;
    b.title = ch === " " ? "Space" : ch;
    if (ch === brushChar) b.classList.add("active");

    b.addEventListener("click", () => {
      brushChar = ch;
      brushLabel.textContent = `Brush: ${ch === " " ? "␠" : ch}`;
      rebuildBrushUI();
    });

    brushRow.appendChild(b);
  }
}

function rebuildBrushSizeUI() {
  brushSizeRow.innerHTML = "";
  for (const s of BRUSH_SIZES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${s}×${s}`;
    if (s === brushSize) b.classList.add("active");

    b.addEventListener("click", () => {
      brushSize = s;
      rebuildBrushSizeUI();
    });

    brushSizeRow.appendChild(b);
  }
}

btnIn.addEventListener("click", () => {
  zoom = clamp(zoom + 2, ZOOM_MIN, ZOOM_MAX);
  draw();
});

btnOut.addEventListener("click", () => {
  zoom = clamp(zoom - 2, ZOOM_MIN, ZOOM_MAX);
  draw();
});

btnFit.addEventListener("click", () => fitToScreen());

btnOpen.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  labelEl.textContent = `Opening ${f.name}...`;
  const text = await f.text();
  parseMapText(text);
  fitToScreen();
});

btnPaint.addEventListener("click", () => {
  paintMode = !paintMode;
  btnPaint.classList.toggle("active", paintMode);
});

btnUndo.addEventListener("click", () => {
  const stroke = undoStack.pop();
  if (!stroke || !stroke.length) return;

  for (let i = stroke.length - 1; i >= 0; i--) {
    const { x, y, prev } = stroke[i];
    // apply previous value
    const row = mapLines[y];
    mapLines[y] = row.substring(0, x) + prev + row.substring(x + 1);
  }
  draw();
});

btnCopy.addEventListener("click", async () => {
  copyText.value = mapToString();
  copyModal.classList.add("open");
  copyModal.setAttribute("aria-hidden", "false");

  // Try to auto-copy too (best effort)
  try {
    await navigator.clipboard.writeText(copyText.value);
  } catch {
    // ignore; user can long-press select/copy
  }
});

copyClose.addEventListener("click", () => {
  copyModal.classList.remove("open");
  copyModal.setAttribute("aria-hidden", "true");
});

// tapping the dark background closes modal
copyModal.addEventListener("click", (ev) => {
  if (ev.target === copyModal) {
    copyModal.classList.remove("open");
    copyModal.setAttribute("aria-hidden", "true");
  }
});

// -------------------- Pan / pinch / paint --------------------

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

  if (paintMode && pointers.size === 1) {
    activeStroke = [];
    const { tx, ty } = pointerToTile(ev);
    paintAt(tx, ty);
  }
});

canvas.addEventListener("pointermove", (ev) => {
  if (!pointers.has(ev.pointerId)) return;

  const prev = pointers.get(ev.pointerId);
  const cur = { x: ev.clientX, y: ev.clientY };
  pointers.set(ev.pointerId, cur);

  const pts = Array.from(pointers.values());

  if (paintMode && pts.length === 1) {
    const { tx, ty } = pointerToTile(ev);
    paintAt(tx, ty);
    return;
  }

  if (pts.length === 1) {
    // Pan
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;

    camX -= dx / zoom;
    camY -= dy / zoom;
    draw();
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
      const cy = (canvas.getBoundingClientRect().height / 2) / oldZoom + camY;
      camX = cx - (window.innerWidth / 2) / zoom;
      camY = cy - (canvas.getBoundingClientRect().height / 2) / zoom;

      lastPinchDist = d;
      draw();
    }
  }
});

function endPointer(ev) {
  pointers.delete(ev.pointerId);
  lastPinchDist = 0;

  if (paintMode && pointers.size === 0 && activeStroke) {
    if (activeStroke.length) {
      // remove internal helper field if present
      delete activeStroke._seen;
      undoStack.push(activeStroke);
    }
    activeStroke = null;
  }
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// -------------------- Boot --------------------

rebuildBrushUI();
rebuildBrushSizeUI();

window.addEventListener("resize", resize);
resize();