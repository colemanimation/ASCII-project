export async function loadMap(mapName) {
  const url = `data/maps/${mapName}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load map: ${url}`);
  const text = await res.text();

  // Normalize line endings and trim only trailing whitespace
  const lines = text.replace(/\r/g, "").split("\n").filter(l => l.length > 0);

  const height = lines.length;
  const width = Math.max(...lines.map(l => l.length));

  // Pad lines to same width
  const grid = lines.map(l => l.padEnd(width, " ").split(""));

  return { name: mapName, width, height, grid };
}