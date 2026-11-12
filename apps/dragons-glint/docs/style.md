# Dragon's Glint: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it was built is in `docs/kilara/game-workflow.md`.

## Theme

A 16-bit RPG dungeon: the hall of a red dragon and its hoard. Chosen by the user from three
themes judged as a player would. The display name is Dragon's Glint; the math and RGS id is
`dragons_glint` and the app folder is `apps/dragons-glint`.

## Look

- **Palette:** Endesga 64 (`art/palette.txt`) for all game art. Nothing outside it.
- **Density:** one art pixel is 2.5 game units; a reel cell is 40 art pixels. Textures are made
  four screen-texture pixels to an art pixel and sampled linearly.
- **Light** from the top left; a one-pixel dark outline round symbols.
- **Drawn by code** (`src/pixel`): the nine reel symbols (plus a wild coin the math never
  places), board floor and frame, panels, Glint tiles, particles, coins, the torch flames.
- **Generated, then locked to the palette and grid:** the four backgrounds (base and bonus hall,
  wide and tall), the dragon's frame strips, the two bitmap fonts (Gold and Ink), the logo, the
  mode pictures.
- **Symbols:** crown, sword, shield, potion (high); ruby, sapphire, emerald, amethyst (low); the
  dragon's eye (scatter). Glint tiers use RPG rarity colours: blue, violet, orange, red.
- **No sparkles.** Gems shine only by the light turning round their facets. The resting board has
  no twinkles, a landing coin no glint, the crown's act no flashes on its pearls.
- **Mode pictures** use the game's own symbols where they show one: ANTE is the scatter's eye,
  twice; BONUS is the dragon's head over the reel's sword, crossed. A picture must not show a
  different version of a thing the reels show.

## Motion

- Each symbol has its own win act: the crown is tossed, the sword cuts and leaves an arc, the
  shield slams with a ring, the potion rocks and bubbles, the eye flares; on a gem the light turns
  once round its facets.
- At rest a gem's light turns now and then and the eye blinks. While a column waits on a scatter
  the other symbols darken and the landed scatters wake and throb.
- The dragon answers a run of tumble wins in four steps: a nod, a snort of smoke, a beat of its
  wing, a roar. Its body is moved by code over its frames (hop, lunge, landing), with smoke and
  embers from its mouth. The dragon may squash; the symbols may not.
- The torches' flames are a small heat simulation drawn in colour bands, 24 looping frames,
  with a wavering glow. The painted flames were erased from the backgrounds.

## Sound

Made with a sound model, one sprite. The landing sounds are gems and treasure on stone; tumble
wins and coins climb a scale; a normal win ticks while it counts and ends on a coin hit; big wins
have their own music.

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
  chained guardian. The red dragon stays in the game until a new one is chosen.
- Sound: the first landing sound was "terlalu generik".
- Mode pictures: the eye in ANTE must be the scatter's; the swords in BONUS must be the reel's
  sword, crossed.

## Not yet confirmed by the user

The display name, the latest reel motion and landing sounds, the redesigned menus on a real
phone, and how the generated sounds actually sound.
