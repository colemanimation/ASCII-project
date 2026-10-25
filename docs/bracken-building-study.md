# Brackenport building study

The ruin and doorway plates were regenerated as bold white silhouettes on black.
They retain the original 112 by 38 character format. Their conversion uses a
smaller glyph palette and a firmer black point; the creation and dreaming plates
remain unchanged.

The Brackenport experiment begins with a generated four-building sprite sheet:
an inn, an awning-front shop, a chimney cottage, and a sleep ward with bell turret.
`scripts/build-buildings.py` crops each quadrant and produces a literal density
conversion, then a cleaned game stamp. The roof silhouette is sampled from the
image; beams, windows, signs and doors are snapped to explicit ASCII structures.
At 13 to 23 columns, this cleanup removes texture that otherwise hides the shape.

Run `python scripts/build-buildings.py` to rebuild the module, text stamps and
comparison sheet. The original image and exact built-in image generation prompt
are in `art/buildings/`. Fable prompts are in `art/fable/prompts.json`.

Only Brackenport uses these stamps. It retains its 64 by 40 grid and saved-game
coordinates. A saved position covered by new scenery uses the existing safe-spawn
repair. Shops, the inn, the ward and wandering residents remain reachable. The
two western piers now connect with a boardwalk. Other towns keep their old art.

The browser renders character cells only. Generated raster images are development
sources and are not downloaded by the game or added to its offline cache.
