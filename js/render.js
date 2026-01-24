function escHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const DISPLAY_GLYPH = {
  "≈": "~",   // deep water displays as ~
  "¥": "Y",   // forest alt displays as Y
  "▲": "#",   // mountains display as #
  "‘": "'",   // curly quote snow -> ascii apostrophe
  "’": "'",   // just in case
};

// Muted palette
const TILE_COLOR = {
  "#": "#8a8a8a",
  ".": "#bdbdbd",
  "~": "#7f93a8",
  "T": "#7f9a7f",
  "^": "#9a8f7f",
  " ": "#000000"
};

function tileSpan(ch) {
  const display = DISPLAY_GLYPH[ch] || ch;
  const c = TILE_COLOR[ch] || TILE_COLOR[display] || "#cfcfcf";
  const safe = display === " " ? "&nbsp;" : escHtml(display);
  return `<span style="color:${c}">${safe}</span>`;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function renderMapToPre(preEl, mapObj, player, viewW, viewH) {
  const { width, height, grid } = mapObj;

  // If the map is smaller than the viewport, shrink viewport
  const vw = Math.min(viewW, width);
  const vh = Math.min(viewH, height);

  // Center camera on player foot tile, clamp to map bounds
  const halfW = Math.floor((vw - 1) / 2);
  const halfH = Math.floor((vh - 1) / 2);

  const camX = clamp(player.x - halfW, 0, Math.max(0, width - vw));
  const camY = clamp(player.y - halfH, 0, Math.max(0, height - vh));

  // Build viewport html grid
  const htmlGrid = Array.from({ length: vh }, (_, sy) => {
    const y = camY + sy;
    return Array.from({ length: vw }, (_, sx) => {
      const x = camX + sx;
      const ch = (grid[y] && grid[y][x]) ? grid[y][x] : " ";
      return tileSpan(ch);
    });
  });

  // Draw player (2 rows tall): head above foot
  const skin = player.skin || "#d7c2a1";
  const clothes = player.clothes || "#a9a9a9";

  const facingGlyph =
    player.facing === "up" ? "^" :
    player.facing === "right" ? ">" :
    player.facing === "left" ? "<" : "v";

  const px = player.x - camX;
  const pyFoot = player.y - camY;
  const pyHead = pyFoot - 1;

  if (px >= 0 && px < vw) {
    if (pyHead >= 0 && pyHead < vh) {
      htmlGrid[pyHead][px] = `<span style="color:${skin}">@</span>`;
    }
    if (pyFoot >= 0 && pyFoot < vh) {
      htmlGrid[pyFoot][px] = `<span style="color:${clothes}">${facingGlyph}</span>`;
    }
  }
  
  function drawBannerClipped(cellGrid, bannerLines, startX, startY, color) {
  const vh = cellGrid.length;
  const vw = cellGrid[0].length;

  for (let row = 0; row < bannerLines.length; row++) {
    const y = startY + row;
    if (y < 0 || y >= vh) continue;

    const line = bannerLines[row];
    for (let col = 0; col < line.length; col++) {
      const x = startX + col;
      if (x < 0 || x >= vw) continue;

      const ch = line[col];
      if (ch === " ") continue;

      cellGrid[y][x] = { ch, color };
    }
  }
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

// Add these to TILE_COLOR near the top (optional but helps)
const TILE_COLOR = {
  "#": "#8a8a8a",
  ".": "#bdbdbd",
  "~": "#7f93a8",
  "T": "#7f9a7f",
  "^": "#9a8f7f",
  "+": "#bfc7d1",
  "*": "#cfcfcf",
  "·": "#9aa3ad",
  "█": "#cfcfcf",
  " ": "#000000"
};

// ---- Title screen rendering ----

function blankGrid(vw, vh, fillChar = " ") {
  return Array.from({ length: vh }, () => Array.from({ length: vw }, () => fillChar));
}

// Small deterministic RNG (so stars do not “jump” wildly across browsers)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawClippedText(grid, x0, y0, lines, glyphHtml) {
  const vh = grid.length;
  const vw = grid[0].length;
  for (let y = 0; y < lines.length; y++) {
    const yy = y0 + y;
    if (yy < 0 || yy >= vh) continue;
    const line = lines[y];
    for (let x = 0; x < line.length; x++) {
      const xx = x0 + x;
      if (xx < 0 || xx >= vw) continue;
      const ch = line[x];
      if (ch === " ") continue;

      // If you want pure “ASCII tile” style, you can store chars instead of HTML.
      // Here we store HTML for logo so it stays bright white and readable.
      grid[yy][xx] = glyphHtml(ch);
    }
  }
}

export function renderTitleToPre(preEl, vw, vh, t, seed, logoLines, logoX, logoY) {
  // grid is HTML strings, like renderMapToPre uses
  const grid = blankGrid(vw, vh, tileSpan(" "));

  // Stars background
  const rand = mulberry32(seed);
  const starCount = Math.floor((vw * vh) * 0.08);

  for (let i = 0; i < starCount; i++) {
    const x = Math.floor(rand() * vw);
    const y = Math.floor(rand() * vh);

    // twinkle varies with time + position
    const tw = (Math.sin(t * 2.3 + x * 0.7 + y * 1.1) + 1) / 2;
    const ch = tw > 0.82 ? "*" : tw > 0.6 ? "·" : ".";
    grid[y][x] = tileSpan(ch);
  }

  // Occasional shooting star (diagonal streak)
  // One streak every ~3 seconds, lasts ~0.6 seconds
  const period = 3.0;
  const local = t % period;
  if (local < 0.6) {
    const p = local / 0.6; // 0..1
    const sx = Math.floor((vw + 10) * p) - 10;
    const sy = Math.floor((vh * 0.25) * p);

    for (let k = 0; k < 10; k++) {
      const x = sx + k;
      const y = sy + Math.floor(k / 2);
      if (x >= 0 && x < vw && y >= 0 && y < vh) grid[y][x] = tileSpan("*");
    }
  }

  // Logo scroll (left -> right)
  const logoHtml = (ch) => `<span style="color:#cfcfcf">${escHtml(ch)}</span>`;
  drawClippedText(grid, logoX, logoY, logoLines, logoHtml);

  preEl.innerHTML = grid.map(row => row.join("")).join("\n");
}

  preEl.innerHTML = htmlGrid.map(row => row.join("")).join("\n");
}