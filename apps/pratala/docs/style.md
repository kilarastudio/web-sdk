# Pratala: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it was built is in `docs/kilara/game-workflow.md`.

## Theme

A 16-bit RPG dungeon: the hall of a dragon too large to be seen whole, and its hoard. The
dragon is one colossal eye behind the broken back wall (the claws on the pillars were removed on
2026-11-15: they did not line up with the eye);
everything on the reels has met it. Chosen by the user from three
themes judged as a player would. The display name is Pratala (user, 2026-11-13: Old Javanese for the
earth and the underworld; in wayang, Saptapratala is the seventh underworld where the giant naga
Antaboga rules), chosen to replace the working name. The math and RGS id is `pratala` and the app folder
`apps/pratala`.

## Look (art v2, 2026-11-17)

Everything the player sees is pixel art drawn by code, and nothing comes from a generated
picture: the user rejected the generate-then-pixelise route on 2026-11-17 ("hasil generate
gambar banyak salahnya dan banyak tidak sesuai bentuk realistis") and asked for all art to be
remade with real form and space. The hall, the board, the symbols and their frames are 3D models
as signed distance fields, ray marched by `src/pixel/render` and quantised to the palette with
ordered dither and ink along depth jumps; the rest (flames, particles, win panels) stays 2D code
in `src/pixel/ui.ts`. How it is organised is in `docs/art-v2.md`.

- **Palette:** Endesga 64 (`src/pixel/palette.ts`), index 0 (the key colour) never drawn.
  Quantisation picks the nearest colour in OKLab; a model may restrict itself to a few ramps so
  gold stays gold under the cool fill.
- **Density:** one art pixel is 2.5 game units; a reel cell is 40 art pixels; the hall is 576 ×
  324 and 324 × 576 art pixels, shipped ×4 and sampled linearly.
- **The hall** (`render/hall.ts`): one barrel-vaulted stone hall seen down its length from one
  camera (the wide and the tall picture only differ in field of view): flagstone floor in
  perspective, two pairs of pillars with torch cups on their inner faces (the flames burn over
  the picture, `Torches.svelte`), a back wall of big blocks, and the dragon's eye looking DOWN
  through a jagged hole in the vault above the board: a scaly socket with an almond opening,
  the orange eyeball lit from within, a vertical slit pupil aimed at the board. The boss hall is
  the same geometry hot: red light from below, cracks of lava in the floor, bigger torch light.
  The eye's frames (half, shut, alert, looks) are the same scene re-rendered in the eye's box
  (`scripts/render-eye-frames.ts`, a 3 × 3 grid per picture). Torch, eye and floor-fire places
  in the game come from the scene's own camera (`scripts/hall-anchors.ts`).
- **The board** (`render/board.ts`): a tray of dressed stone blocks with real seams and a lit
  top-left edge, one gold inlay line round the opening, claw gouges on two blocks, plain
  corners; the cell floor is dark flagstone with the rim's shadow baked in.
- **Symbols** (`render/symbols/*`, chosen 2026-11-17 to replace the set reviewers called
  "boring"): the hall of Antaboga's leavings. H1 a small dragon's skull plated in gold with iron
  horns and ember sockets; H2 a keris pusaka (wavy pamor blade, gold pistol-grip hilt, a red
  cloth wrap); H3 a war horn with gold bands; H4 an iron lantern lit from within; L1 to L4
  clusters of cave crystal, red, blue, green, violet, each colour its own cluster, on a knob of
  stone; the scatter a dragon's eye between scaly lids with three horn spikes; the wild a thick
  gold coin stamped with the eye. One stage for all (`rig.ts`): warm key light from the upper
  left, cool fill from the right, a three-quarter view, a one-pixel ink outline. Each symbol
  fills 34 to 36 of its 40 pixels.
- **Glint Spots** (`render/glint.ts`): a sigil carved into the flagstone, a ring with more tick
  marks each tier (tier 4 adds a slit), lit from within in the tier's colour.
- **Frames** are re-renders of the models in other states, baked ahead of time
  (`scripts/bake-art.ts` → `src/pixel/baked/*.json`, decoded at load): at rest the lantern's
  flame moves, the crystals' ember breathes as the cluster turns, the skull's sockets flare, the
  keris and horn catch the light, the eye blinks and glances; marked by a win (Hurt) the skull
  blazes, the blade heats from its edges, the horn sounds with light in its bell, the lantern
  flares, the crystals blaze, the pupil widens; leaving (Gone) the marked symbol is flung up and
  away, turning over in the air, and drops out of the cell.
- **Logo:** unchanged, the "panas" pixel logo drawn by code (`pratala_pixel_logo.py`).
- **Mode pictures** are composed from the eye and coin models (`scripts/bake-modes.ts`).
- **No sparkles, no gems as decoration, square corners, solid objects:** the studio rules hold.

## Motion (art v2, 2026-11-17)

Everything the previous build was marked down for ("limited animations", a still screen between
wins) was remade; idle motion at 1280×800 now measures about 2.5 in the hall and about 5 in the
boss hall (mean pixel change over 1.5 s; games that pass measure 1.8 or more).

- **At rest:** dust motes drift down through the hall behind the board (`HallDust`); each
  torch's pool of light sways by whole art pixels on its own phase (`Torches`); the eye on the
  vault breathes an orange glow on two slow waves, blinks (one in three slowly, holding half
  shut) and glances every 4 to 8 s (`DragonEye`); every symbol stirs about every 3 to 4 s with
  its own baked frames (`SYMBOL_RESTS`).
- **Landing:** each column that comes to rest knocks the tray one art pixel for 120 ms and
  throws 8 to 10 stone flecks up from the foot of its lowest symbol (`ReelDust`, `impact.knock`);
  an anticipated column knocks two pixels with more dust. Tumble refills land the same way.
  Reduced motion drops both.
- **A win:** the shared white hit, then the symbol's own marked frames (Hurt) with a solid pose
  (tremble, rock, swing), then the symbol is flung up and away turning over in the air (Gone).
- **Free spins intro, "the dragon wakes"** (`FreeSpinGaze`): the board darkens with the scatters
  awake, the eye snaps alert and the torches gutter, its gaze comes down from the pupil and
  sweeps the board once, lighting each scatter it passes with a note a step higher each time,
  then opens in the middle and the words land white-hot with a one-pixel knock and cool to gold;
  about 2 s to readable words. On continue the hall heats into the boss hall as before.
- **Not animated by bending:** nothing squashes or wobbles; fire is simulated; shakes are whole
  pixels.

## Sound

Made with a sound model, one sprite (output/dragon/audio: prompts, takes, build tools and a
listening page). The music is a dark dungeon crawl in a minor key, and since 2026-11-13 the
effects follow it: stone, iron, fire and the beast, not bright chiptune blips, and no brass: the user found the trumpets out of place, so the fanfares and the big win music are strings, a pulse-wave lead, harp, bells, timpani and gong. The landing sounds
are gems and treasure on stone; a scatter lands on the first set's crystal chime (the user chose it over a dark bell); tumble wins, scatters and
coins climb a natural minor scale; a normal win ticks while it counts and ends on a bag of
coins; each big win level lands on its own hit, heavier than the last, and MAX on a roar. A Glint
Spot is heard catching fire, flaring when it doubles and hissing when it is put out; in the free
spins intro each scatter the dragon's gaze lights rings a note higher and the words land on a hit; the hall is heard catching fire and cooling. Every effect has
to be heard on a phone speaker: takes with their energy under 250 Hz are thrown out, however
good they sound on headphones.

## Decisions the user made, in their words

- "untuk animasi symbol pakai kode. untuk background dan karakter pakai imagegen ... bentuk
  karakter harus konsisten tiap frame."
- Reel motion: "buat lebih smooth"; then "aku kurang suka effect seperti jelly di symbol saat
  jatuh, buat symbol jadi solid object"; then "tidak terlihat smooth, terlihat kaku". The result
  is the one-curve fall with no squash and no bounce.
- Flames: "gerakan apinya seperti joget" (twice, for bent shapes); the heat simulation was
  accepted: "sudah bagus animasi apinya".
- Menus: "kenapa masih pakai background abu abu solid?" and, of buy bonus, "terlihat seperti menu,
  tidak seamless dengan game"; "bedakan button active dan buy".
- Shine: "kenapa AI kalau buat gambar ... setelah ada diamond diamond, selalu ada seperti efek
  partikel partikel cahaya seperti diamond, plus. sangat mudah terlihat AI". All four-point
  sparkles were removed from the game, and prompts now forbid them.
- Dragon: the red dragon is "terlalu general". Twelve concepts in three rounds were rejected and
  deleted ("tidak suka. hapus semua konsep naga"): crystal, miser, obsidian; eastern serpent,
  armoured knight, dracolich, coin golem, robed merchant, black cat-like; fat glutton, rogue thief,
  chained guardian. Asked on 2026-11-13, the user said both the ideas and the drawing had been
  wrong, and chose from a concept sheet: the giant dragon seen only in part, as "B", the eye
  behind the broken wall with claws on the pillars, and symbol "set 1". The small red dragon
  beside the reels is retired.
- Sound: the first landing sound was "terlalu generik".
- Mode pictures: the eye in ANTE must be the scatter's; the stone in the bought modes must be the
  board's flagstone.

## Not yet confirmed by the user

The latest reel motion and landing sounds, the redesigned menus on a real
phone, and how the generated sounds actually sound.
