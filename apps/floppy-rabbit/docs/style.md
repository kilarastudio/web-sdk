# Floppy Rabbit: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-24: the math is built and approved, and the game exists as a **grey box**
(`apps/floppy-rabbit`): every screen and mode plays from the math's books with squares and words
in place of art (symbols are grey squares with their math names, the rabbit a white square marked
R, a footprint a white edge with its value). Nothing in the grey box is a decision about the look.
The user asked for it before any mascot was approved ("buat dulu versi grey box nya"); none of the
three mascot concepts of 2026-11-23 was approved. Lines marked **decided** are the user's; lines
marked **proposed** are the lead's and wait for the user.

## Theme

A lazy, woolly lop-eared rabbit on a warm stone in a dry-grass meadow, late in the afternoon. It
hops across the board leaving footprints and, when it feels like it, flops on its side.

- **Decided** (user, 2026-11-16): the mascot is an American Fuzzy Lop rabbit, not a capybara
  ("ganti capybara dengan fuzzy lop"); nine capybara games were already on Engine and none sold.
- **Decided** (user, 2026-11-23): the name is Floppy Rabbit. The user first asked for an
  "aesthetic" name, then chose a familiar formula instead ("kali ini aku lebih ingin yang umum,
  formula nama yang familiar untuk pemain slot"): two words, trait then animal, the pattern of
  Engine's best-selling mascot games. Math and RGS id `floppy_rabbit`, app folder
  `apps/floppy-rabbit`.
- **Decided** (user, 2026-11-23): the mechanic is Hop & Flop and the top mode is Fluffle (three
  rabbits). Feature and mode names stay English in every language.
- **Proposed:** base game on the meadow with the warm flat stone; Flop Time (free spins) in a
  shaded clover patch under a tree, the same afternoon.

## Look

- **Decided** (user, 2026-11-23): flat cartoon. Big simple shapes, one thick dark-brown outline of
  even weight, flat block colours with one shadow tone per shape. No gradients, no textures, no
  highlights. Not pixel art: wool does not read in pixels, and pixel titles sell far below
  cartoons on Engine (`reports/Riset pixel art di Engine 2026-11-16.md`).
- **Proposed palette:** warm and dry. Sky and far ground in ochre and orange, grass in straw
  yellow, hills and leaves in olive, the stone in terracotta, outline in dark brown. The rabbit's
  coat is the lightest or darkest thing on screen so it reads at the size of one cell. To be
  fixed in `art/palette.txt` from the chosen key image.
- **Light** from the left, low; one long soft shadow to the right.
- **The mascot is an adult.** Heavy body, thick wool in a few large clumps, long lop ears
  hanging past the cheeks, half-closed eyes with small pupils, a flat bored face. Dry adult
  humour. Engine bans child-like characters, and a small fluffy rabbit is close to nursery and
  Easter imagery, so never: big round eyes, blush marks, bows, eggs, pastel nursery colours, baby
  proportions.
- **It must read as a rabbit at a glance**, not a sheep and not a dog. The first cream concept
  read as a sheep: wool on the head and a short face do that. Keep the head smooth, show the
  split lip, the whiskers, the long hind feet and the cotton tail.
- **Proposed symbols:** high: carrot, apple, clover, dandelion. Low: three plain garden things
  (watering can, flower pot, trowel). Scatter: a pillow (three pillows, Flop Time). No eggs or
  anything Easter.
- **Footprints** read as an icon first and a number second: a paw print with no number at 2×,
  the number from 4×. Forty-nine cells on a phone leave no room for more.
- **No sparkles and no gems as decoration**, as in every Kilara game. Prompts for generated
  pictures say so in words and every picture is checked for them.

## What is drawn by code and what is generated

**Proposed.** Generated from one approved key image, then cleaned: the mascot's poses (loaf, hop,
flop, sleep, startled), the two backgrounds in wide and tall. Drawn by code as flat vector
shapes: the reel symbols, the board, the footprints, panels and particles. Sound from the sound
model.

## Motion

To be written as each layer is shown to the user. Fixed from the start:

- The rabbit's two actions must be told apart without reading: a hop is a short arc with the
  ears and wool trailing; a flop is a quick fall onto its side, then stillness, then every
  footprint on the board steps up together.
- Reel symbols are solid objects (studio rule): no squash or stretch on symbols. The mascot is a
  character, not a symbol, and may squash on landing.

## Sound

**Proposed.** Slow music with light percussion and grass; a hop is one note of a rising scale; a
flop is one soft thud, then a long falling note.
