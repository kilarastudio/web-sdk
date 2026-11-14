# Pratala (Dragon's Glint): style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it was built is in `docs/kilara/game-workflow.md`.

## Theme

A 16-bit RPG dungeon: the hall of a dragon too large to be seen whole, and its hoard. The
dragon is one colossal eye behind the broken back wall and two claws gripping the pillars;
everything on the reels has met it. Chosen by the user from three
themes judged as a player would. The display name is Pratala (user, 2026-11-13: Old Javanese for the
earth and the underworld; in wayang, Saptapratala is the seventh underworld where the giant naga
Antaboga rules), chosen to replace Dragon's Glint. The ids have not been renamed yet: the math and
RGS id is still `dragons_glint` and the app folder `apps/dragons-glint`.

## Look

- **Palette:** Endesga 64 (`art/palette.txt`) for all game art. Nothing outside it.
- **Density:** one art pixel is 2.5 game units; a reel cell is 40 art pixels. Textures are made
  four screen-texture pixels to an art pixel and sampled linearly.
- **Light** from the top left; a one-pixel dark outline round symbols.
- **Drawn by code** (`src/pixel`): the nine reel symbols (plus a wild coin the math never
  places), board floor and frame, panels, Glint tiles, particles, coins, the torch flames.
- **Logo** (user, 2026-11-13): "Pratala" in tall gothic pixel letters, drawn by code on the
  art-pixel grid (workspace `output/pratala/logo/pixel/pratala_pixel_logo.py --ship` writes
  `static/assets/ui/logo.png`, 152 × 79 art pixels at ×4). Picked from real pixel-art logos (the
  Noita direction): a capital P with a spike below the baseline, lowercase "ratala", every stroke
  cut at one pen angle, the "panas" ramp (yellow at the top to deep red at the bottom), a dark
  outline and a two-pixel drop. Rejected on the way: plain vector caps ("seperti HEADER
  paragraf"), 3D stone, fantasy serif, blue-grey stone, anything that looks generated.
- **Generated, then locked to the palette and grid:** the four backgrounds (base and bonus hall,
  wide and tall), the dragon's frame strips, the two bitmap fonts (Gold and Ink). The mode
  pictures are built by code from the reel art.
- **Symbols** (chosen by the user on 2026-11-13, "set 1"; the same day the user asked for them
  whole at rest, the damage becoming their win and the way they leave): what the dragon's
  challengers left: a crown, a sword, a shield, a helm (high); ruby, sapphire, emerald, amethyst (low; the user saw set 1's four dragon eggs
  in the game and preferred the gems: "symbol low masih bagus yang versi sebelumnya"); the
  dragon's eye (scatter), the same eye as the one in the wall: an almond opening tilted up to its
  outer corner, a slit pupil pointed at both ends, and its two lids, nothing else (the user asked
  for a dragon's eye, "bukan cuma bulat", then for it "lebih clean": no horns, no ring of scales). Glint tiers use RPG rarity colours: blue, violet, orange, red.
- **The font** is the game's own pair of bitmap fonts, Gold and Ink (static/assets/fonts): bevelled
  pixel capitals with their outline and shadow in the atlas, Gold in four flat bands for amounts
  and titles, Ink white so labels can be tinted. On 2026-11-13 the user asked for something
  easier to read, tried a slim pixel face, the UI font in gold, a modular face and OpenTUI Mono,
  and then went back to this first font ("kembalikan ke versi awal kita"). Text under about 22
  units, and any character outside the atlas, falls back to the UI font. Only text drawn in the
  game uses it: the HUD and the menus keep the UI font.
- **No sparkles.** Gems shine only by the light turning round their facets. The rule covers
  shapes that only happen to form a plus: a round dot of radius about one pixel and a small
  diamond both draw as a cross, so tiny jewels and ember cores are square blocks with the
  highlight in one corner (the user caught the sword's pommel and the primed spot's ember). The resting board has
  no twinkles, a landing coin no glint, the crown's act no flashes on its pearls.
- **No gems as decoration** (user, 2026-11-13: "ban semua itu"). A gem appears only as a gem
  reel symbol. Nothing else is set with one: the sword's pommel and the crown's band are plain
  gold, the board frame is plain stone with one gold line and bare corners (the user chose
  "batu polos" over gold corner plates, 2026-11-13), the win panels carry gold bosses, and the backgrounds hold
  no gems, jewels or treasure heaps. Prompts for generated pictures say so in words (no gems, no
  rubies, no jewels, no gold coins, no treasure), and every picture is checked for them.
- **The hall is a dungeon, not a treasury.** The user found the heaps of treasure beside the
  board "terlalu over"; the sides are stone, bars, chains and what challengers left.
- **Mode pictures** are built by code from the game's own art (`output/dragon/tools/
mode_pictures.py`; rebuild them whenever a symbol's art changes): ANTE is the scatter's eye, twice; BOOST the eye over three fireballs; the three
  bought free spins are one family, after the claw marks that open free spins: a broken flagstone
  raked by three claws, the scars molten. BONUS is the stone alone, SUPER has a fire at its foot,
  HOARD stands in a heap of coins (the user rejected the eye over crossed swords, the eye inside
  one thin flame and the crown in coins: "tidak bagus", "bentuk api di super aneh"). No dragon is
  drawn other than its eye and its marks. A picture must not show a
  different version of a thing the reels show.

## Motion

- A win is the dragon marking the symbol, and the mark is how the symbol then leaves the board;
  there is no shared explosion (user, 2026-11-13: "aku tidak ingin explotion yang biasa untuk
  semua symbol"). The crown glows, softens and drips, then melts into a pool; the sword is bitten
  through, then falls apart; the shield is raked by three claws, then comes apart along them; the
  helm is scorched and glows inside, then falls to ash with smoke; a gem cracks along its facets,
  then breaks into them. The symbol stays as the win left it until it goes. The eye flares and
  never leaves. Drawn as frame runs per symbol (src/pixel/symbols.ts: Rest, Hurt, Gone).
- At rest a gem's light turns now and then, a band of light slides over the metal of the crown,
  sword, shield and helm (one ramp step lighter, no white), and the eye blinks. While a column waits on a scatter
  the other symbols darken and the landed scatters wake and throb.
- The dragon answers a run of tumble wins in four steps: a nod, a snort of smoke, a beat of its
  wing, a roar. Its body is moved by code over its frames (hop, lunge, landing), with smoke and
  embers from its mouth. The dragon may squash; the symbols may not.
- The torches' flames are a small heat simulation drawn in colour bands, 24 looping frames.
  The painted flames were erased from the backgrounds. Each torch lights the wall round it with
  a pool of light in four bands that swells and dims with how far its flame's tongues reach,
  carried on a slow draught so it never repeats with the flame's loop; dark soot, burned the same
  way, climbs behind each flame. The dragon catches the nearest torch's flicker.
- At rest the dragon breathes: its head rises two pixels and settles, about a breath every three
  seconds, each a little longer or shorter than the last. Now and then it blinks, and most breaths
  out leave a puff of smoke from its nostril, drawn with the same heat simulation in greys.
- In free spins the board frame does not burn (2026-11-13: its fire clashed with the tumble
  win's): separate fires burn scattered on the hall's floor round the board, never in one
  straight line, and the frame takes the heat, its stone and gold turned toward red with a slow
  glow.
- Big wins are measured against the round's cost and climb in levels: BIG 10×, SUPER 30×,
  MEGA 150×, EPIC 1,000×, and MAX at the max win. Each level lands as an event: its name
  comes down and hits its place, the fire leaps and burns wider, a jolt, a burst of coins out of
  the fire, its own music, and its own answer from the hall (below). The free spins total
  climbs the same way. Coins always fly under the amounts.
- Wins have no panels (2026-11-13, "seamless, tidak hanya kotak kotak"): the tumble win's amount
  stands in a bed of fire, in the torches' colours, on the board frame's top edge, and is as big as the win (2026-11-13): a different fire is
  drawn for each size, never a stretched one, from a low line of short flames under a tenth of
  the bet to a wild blaze as wide as the board at 1,000 bets; a big
  win's level and amount stand in a wider bed over the dimmed board. The bed has no straight
  edge anywhere (src/pixel/ui.ts fireBedFrames, components/FireBed.svelte).
- Glint Spots burn from inside their own cell (2026-11-13): no fire flies across the screen from
  the dragon, which is seen only in part. A primed spot is a cracked flagstone with fire showing
  through the cracks (the red ember dot was rejected); a spot that lights catches fire in its
  middle and the fire spreads to the cell's sides, leaving the lit tile behind it. A Glint
  Strike is the eye narrowing, then the struck spots catching fire the same way.
- Nothing covers the screen when the scene changes (user, 2026-11-13: every change had "layar
  hitam di depannya"; the fire wall and its smoke are gone). The welcome screen stands in the hall
  itself: it fades away and the board falls into the same hall, one fall, a jolt as it lands. Into
  free spins the hall heats in view, behind the board, pixel by pixel (the user found a line
  wiping one picture over the other "terlalu kaku"): the cracks that glow in the boss hall open
  first, the heat spreads out of them through the stone, each stone warming, glowing, then
  settling into the boss hall's colour, the floor before the vault; each floor fire grows as the
  heat reaches its stone, and the torches and eye fade into the boss hall's. Out of free spins,
  after the total is celebrated in the boss hall, the same heat runs back: the vault cools first
  and the cracks go dark last. The two hall pictures share one composition, which is what makes
  this possible; keep it so if either is redrawn (game/hallHeat.ts, components/Background.svelte).
- Each kind of win is its own event with its own actor, never the same words in the same fire
  (user, 2026-11-13: the intro in a win's bed of fire was "sama dengan animasi win", and wins must
  not be "boring dan terlalu simple"). The free spins intro is the dragon's mark, in the hall as it is (the user chose
  intro first, then the hall heats as the way into the first free spin): every symbol but the scatters goes dark and the scatters stay wide awake; three
  claws rake across the board from the upper right, one after another, each with a jolt, leaving
  scars that glow molten; the words land in them white-hot and cool to gold while the scars cool
  to embers that go on breathing. No panel, no bed of fire (components/FreeSpinClaws.svelte).
- The free spins total is paid in by the board: the board goes dark, only its lit Glint Spots
  still shine, and while the total counts they go out one by one, the lowest first, each one's
  fire closing to its middle. Nothing flies. Then the hall cools (components/SpotsOut.svelte).
- Each big win level is a different event in the hall, not a bigger copy of the last
  (game/hallMood.svelte.ts): BIG, the eye looks down at the board; SUPER, the torches leap and
  dust falls from the vault; MEGA, the cracks in the stone glow; EPIC, the pupil narrows and half
  the hall reddens; MAX, the whole hall burns until the win leaves, then cools. In the boss hall,
  already hot, the floor fires burn higher instead. Under a big win or a total only the board
  goes dark; the hall dims a little, so what it does is seen (components/BoardDim.svelte).

## Sound

Made with a sound model, one sprite (output/dragon/audio: prompts, takes, build tools and a
listening page). The music is a dark dungeon crawl in a minor key, and since 2026-11-13 the
effects follow it: stone, iron, fire and the beast, not bright chiptune blips, and no brass: the user found the trumpets out of place, so the fanfares and the big win music are strings, a pulse-wave lead, harp, bells, timpani and gong. The landing sounds
are gems and treasure on stone; a scatter lands on the first set's crystal chime (the user chose it over a dark bell); tumble wins, scatters and
coins climb a natural minor scale; a normal win ticks while it counts and ends on a bag of
coins; each big win level lands on its own hit, heavier than the last, and MAX on a roar. A Glint
Spot is heard catching fire, flaring when it doubles and hissing when it is put out; the claws of
the free spins intro scrape stone; the hall is heard catching fire and cooling. Every effect has
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
