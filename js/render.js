function escHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

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
  const c = TILE_COLOR[ch] || "#cfcfcf";
  const safe = ch === " " ? "&nbsp;" : escHtml(ch);
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
  const camX = clamp(player.x - Math.floor(vw / 2), 0, Math.max(0, width - vw));
  const camY = clamp(player.y - Math.floor(vh / 2), 0, Math.max(0, height - vh));

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

  preEl.innerHTML = htmlGrid.map(row => row.join("")).join("\n");
}