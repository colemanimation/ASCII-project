function escHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Muted palette, not neon
const TILE_COLOR = {
  "#": "#8a8a8a", // mountains/walls
  ".": "#bdbdbd", // plains/paths
  "~": "#7f93a8", // water
  "T": "#7f9a7f", // trees
  "^": "#9a8f7f", // hills
  " ": "#000000"  // void
};

function tileSpan(ch) {
  const c = TILE_COLOR[ch] || "#cfcfcf";
  // If it's a space, keep it as space but don't color it weirdly
  const safe = ch === " " ? "&nbsp;" : escHtml(ch);
  return `<span style="color:${c}">${safe}</span>`;
}

export function renderMapToPre(preEl, mapObj, player) {
  // Base layer HTML
  const { width, height, grid } = mapObj;

  // Build a 2D array of HTML strings for easy overwrites
  const htmlGrid = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => tileSpan(grid[y][x] ?? " "))
  );

  // Draw player using "foot tile collision" anchor:
  // player.x, player.y refer to FOOT tile position.
  // Head goes on y-1, clothes arrow on y.
  const headY = player.y - 1;
  const footY = player.y;

  // Muted skin and muted clothes
  const skin = player.skin || "#d7c2a1";
  const clothes = player.clothes || "#a9a9a9";

  const facingGlyph = player.facing === "up" ? "^"
    : player.facing === "right" ? ">"
    : player.facing === "left" ? "<"
    : "v";

  if (headY >= 0 && headY < height) {
    htmlGrid[headY][player.x] = `<span style="color:${skin}">@</span>`;
  }
  if (footY >= 0 && footY < height) {
    htmlGrid[footY][player.x] = `<span style="color:${clothes}">${facingGlyph}</span>`;
  }

  // Convert to lines
  const lines = htmlGrid.map(row => row.join(""));
  preEl.innerHTML = lines.join("\n");
}