// render.js

function escHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const DISPLAY_GLYPH = {
  "≈": "≈",   // deep water displays as ≈
  "¥": "¥",   // forest alt displays as ¥
  "▲": "▲",   // mountains display as ▲
  "‘": "'",   // curly quote snow -> ascii apostrophe
  "’": "'",   // just in case
};

// Muted palette
const TILE_COLOR = {
  "#": "#8a8a8a",
  ".": "#9bb891",
  "~": "#7f93a8",
  "T": "#7f9a7f",
  "^": "#9a8f7f",
  "+": "#bfc7d1",
  "*": "#cfcfcf",
  "·": "#9aa3ad",
  "█": "#cfcfcf",
  " ": "#000000",
  "≈": "#6f849a",
  "=": "#d0d0d0",
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

// -------------------- GAME MAP RENDER --------------------

export function renderMapToPre(preEl, mapObj, player, viewW, viewH) {
  const { width, height, grid } = mapObj;

  const vw = Math.min(viewW, width);
  const vh = Math.min(viewH, height);

  // Center on player's foot tile
  const halfW = Math.floor((vw - 1) / 2);
  const halfH = Math.floor((vh - 1) / 2);

  const camX = clamp(player.x - halfW, 0, Math.max(0, width - vw));
  const camY = clamp(player.y - halfH, 0, Math.max(0, height - vh));

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
      htmlGrid[pyFoot][px] = `<span style="color:${clothes}">${escHtml(facingGlyph)}</span>`;
    }
  }

  preEl.innerHTML = htmlGrid.map(row => row.join("")).join("\n");
}

// -------------------- TITLE SCREEN RENDER --------------------

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

function drawClippedText(htmlGrid, startX, startY, lines, color = "#cfcfcf") {
  const vh = htmlGrid.length;
  const vw = htmlGrid[0].length;

  for (let row = 0; row < lines.length; row++) {
    const y = startY + row;
    if (y < 0 || y >= vh) continue;

    const line = lines[row];
    for (let col = 0; col < line.length; col++) {
      const x = startX + col;
      if (x < 0 || x >= vw) continue;

      const ch = line[col];
      if (ch === " ") continue;

      htmlGrid[y][x] = `<span style="color:${color}">${escHtml(ch)}</span>`;
    }
  }
}

export function renderTitleToPre(preEl, titleState, vw, vh) {
  // Background grid as spans
  const htmlGrid = Array.from({ length: vh }, () =>
    Array.from({ length: vw }, () => tileSpan(" "))
  );

  // Stars (stable positions, twinkle via frame)
  const rand = mulberry32(titleState.seed);
  const starCount = Math.floor((vw * vh) * 0.10);

  for (let i = 0; i < starCount; i++) {
    const x = Math.floor(rand() * vw);
    const y = Math.floor(rand() * vh);

    // Twinkle based on frame and position
    const tw = (Math.sin(titleState.frame * 0.22 + x * 0.7 + y * 1.1) + 1) / 2;
    const ch = tw > 0.86 ? "*" : tw > 0.65 ? "·" : ".";
    htmlGrid[y][x] = tileSpan(ch);
  }

  // Occasional shooting star
  // Every ~3 seconds, streak lasts ~0.6 seconds
  const t = titleState.frame / 60;
  const period = 3.0;
  const local = t % period;

  if (local < 0.6) {
    const p = local / 0.6; // 0..1
    const sx = Math.floor((vw + 12) * p) - 12;
    const sy = Math.floor((vh * 0.25) * p);

    for (let k = 0; k < 12; k++) {
      const x = sx + k;
      const y = sy + Math.floor(k / 2);
      if (x >= 0 && x < vw && y >= 0 && y < vh) {
        htmlGrid[y][x] = tileSpan(k === 0 ? "*" : "·");
      }
    }
  }

  // Logo scroll left-to-right
  const logoH = titleState.logoLines.length;
  const logoY = Math.max(0, Math.floor((vh - logoH) / 2));
  drawClippedText(htmlGrid, Math.floor(titleState.logoX), logoY, titleState.logoLines, "#cfcfcf");

  // Press Start prompt
  const prompt = "Press Start";
  const py = vh - 3;
  const px = Math.max(0, Math.floor((vw - prompt.length) / 2));
  if (py >= 0 && py < vh) {
    for (let i = 0; i < prompt.length; i++) {
      const x = px + i;
      if (x >= 0 && x < vw) {
        htmlGrid[py][x] = `<span style="color:#cfcfcf">${escHtml(prompt[i])}</span>`;
      }
    }
  }

  preEl.innerHTML = htmlGrid.map(row => row.join("")).join("\n");
}