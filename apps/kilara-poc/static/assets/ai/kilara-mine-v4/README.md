# Kilara Mine v4

Revision of the v3 asset review, 27 October 2026. The game now loads this pack.
Stable asset keys, pay values, and book events are preserved.

- Scatter is a gold/turquoise mine-vault key with an open bow and two large teeth.
- H3 is a pair of broad, flat-topped emerald prisms. Its alpha-content width is
  186 px on the 256 px canvas, up from 106 px; opaque area increases by 76%.
- Q keeps its letterform but uses dark saturated blue steel. Alpha-weighted mean
  luminance is 67/255, compared with 167/255 for J (v3 Q was 138/255).
- Multiplier tier marks are large runtime rectangles in `SymbolSprite.svelte`,
  independent of raster resolution. One/two/three marks correspond to the existing
  blue/purple/red tiers and remain visible after a value is collected.
- Free Spins outro coins now draw behind the panel so they cannot cover the amount.
- All nine panels export at 2048 px width; backgrounds export at 2560 × 1440.
  Symbol textures remain 256 × 256.

## Resolution limitation

The original Tumble source is 2173 px wide and can be downsampled to 2048. The other
eight panels are 1254–1728 px wide and both backgrounds are 1672 × 941. These files
are resampled from their original PNG sources, not from the prior 1024 px WebPs.
The larger panel exports retain more source detail, but interpolation does not add
native detail. The background exports also do not add native detail. Two image-tool
restoration attempts returned 1672 × 941 despite larger requested dimensions and
were discarded to preserve the approved background composition. Native higher
resolution sources remain an outstanding art-production improvement.

`manifest.json` records actual runtime and source dimensions, `upscaled` flags,
byte counts, hashes, alpha bounds, and panel text-safe bounds. The full 27-file
runtime pack is 2,286,984 bytes, including the three legacy story images (v3:
1,307,366 bytes). The game loads only the referenced v4 textures; v3 remains available
for comparison in `preview.html`.

## Sources and review

The built-in `image_gen` tool edited Scatter, H3, and Q. PNG sources and the exact
accepted prompts are at workspace-root `output/ai-game-assets/kilara-mine-v4/`.
All other selected PNG sources are inherited from v3. No API/CLI generation was used.

`preview.html` includes a v3/v4 comparison, 48/64/96 px controls, grayscale and silhouette
views. Game screenshots and measured checks are in
`output/ai-game-assets/runtime-review-v4/` at workspace root.

Rebuild with `node scripts/build-art.mjs` from the app directory. As before,
`KILARA_SHARP_PATH` may point to an existing Sharp installation. The script encodes
WebP and regenerates `src/game/art.generated.ts`, including scaled panel text bounds.
