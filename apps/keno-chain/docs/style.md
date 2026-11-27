# Keno Chain: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-27: the grey box is replaced by the game's own screen, taken from the playable
prototype `output/kilara-keno/ui-design/keno-chain-prototype-pixel.html` (the "pixel" variant: flat
square blocks on navy, smooth type and line icons). Math is v2, tag `keno-chain-math-v2` (`math-sdk/games/keno_chain`:
three volatility levels, Calm, Bold and Wild, each with 3, 4, 5, 6, 8 or 10 numbers; Chain 10× and
Chain Max 100× with 10 numbers; lucky rounds). The screen follows it since 2026-11-27.
Market convention comes first here (Stake's Keno frame and colour meanings); where it and the
studio style differ, the market wins (user, 2026-11-26).

## How the screen is built

- The game has its own HUD (`src/components/KenoTable.svelte`), not `UiBurst`: it reuses the
  shell's controls (amount − / +, amount menu, autoplay, turbo, menu, sound, the play logic) on its
  own layout and colours. Menus, sheets and confirmations are the shell's own.
- Tall screens, top to bottom: the name KENO CHAIN (KENO white, CHAIN gold, no mark) with the last
  three results and the menu button; the multiplier stairs; the draw as a row of squares; the
  8 × 5 board; what each number of hits wins; balance and win; the green play bar; the amount; the
  Risk select (Calm, Bold, Wild) beside the bonus button; Random Pick, Clear, autoplay and turbo.
- Risk is a select, as in Stake's Keno (user, 2026-11-27). Chain and Chain Max are not levels in
  that row: they are bonus modes, opened from the bonus button into the shell's bonus scene (cost,
  return, top prize, confirmation). While one is armed the button is filled gold, names the mode
  and its cost, and a press switches it off; choosing a risk also switches it off.
- Wide screens (user, 2026-11-27, after Keno Xtreme's layout: "saya tidak suka bagian header.
  dan button menu terlalu jauh", "lebih seamless"): no head and no framed boxes. The controls
  stand on the screen itself, left of the game and as tall as it: the name at the top, then
  amount, Risk and Bonus, Random Pick and Clear, balance and win, play, and at the foot autoplay,
  turbo and the menu button (the menu opens over it). The game is one surface; the last six
  results stand in its top right corner. The controls are drawn at 0.72 of the game's unit (the user found
  them too large beside the board, three times), so the column is narrow and the board leads.
- The bonus button is a solid gold block with a hard edge under it, dark ink: with Play, the only
  coloured field in the controls (user, 2026-11-27: it must stand out). Armed, it is held down
  (its edge above it) and shows the mode's name, its cost and a cross.
- The amount field always shows the base amount, also while a bonus mode is armed (user,
  2026-11-27, as Keno Xtreme does): the mode's times stand in gold beside the word (BET 10×), and
  what a round costs is on the armed bonus button and the play bar.
- The last results are written as multiples of the base bet, the unit of the win table (user,
  2026-11-27); a chip's colour still follows the win against what the round cost, so green means
  the round paid its cost or more.
- The menu holds Paytable, Info and the Audio switch. No Settings row (user, 2026-11-27): the game
  has no music, so its only setting would be the sound the switch already covers. On wide screens
  the menu card is as wide as the controls and flush with them, over the row of its button.
- No stop button (user, 2026-11-27): while a round runs the play bar stays "Play", a little
  quieter, and takes no press. Autoplay is stopped from the autoplay button.
- No selector for how many numbers: the count picked on the board is the count played. The 1× levels
  play 3, 4, 5, 6, 8 or 10 numbers. Until the level can play the count (nothing picked, 1, 2, 7 or
  9 picked, Chain with fewer than 10) the pay row is a line that lists the sizes and says how many
  more reach the next one ("Pick 3, 4, 5, 6, 8 or 10 numbers: pick 1 more"), the play bar is dimmed, and a press shakes that line. No path
  asks the RGS for a mode the math does not publish.
- Random Pick takes a fresh set of as many numbers as are picked (10 with none picked or in Chain);
  they light up one after another.
- Everything is sized in one unit, the largest at which the screen fits without scrolling. On a
  long phone the tiles grow a little taller and the room left is shared above and under the game.
  Checked at 390×844, 360×640, 375×667, 768×1024, 1280×800, 844×390 and the 400×225 mini player.
- Sounds are short synth tones made in the browser (`src/game/sound.ts`), no files: press, miss, a
  hit whose pitch climbs with the meter, lucky ball, win. They follow the sound settings.

## How the game opens

Added 2026-11-27 at the user's request ("tambahkan intro studio dan welcome screen"), in the
studio's order for every game:

1. The Kilara Studio intro (`StudioIntro`, written into the page by `hooks.server.ts`).
2. The loading screen (`game/loader.ts`, HTML, on the intro's Malam): KENO CHAIN, a flat gold bar,
   "by kilara".
3. The welcome screen (`LoadingScreen.svelte`, HTML, on the game's navy): the name, the most a
   round of the 1× game can win (from the config), and three features drawn with the board's own
   tiles: pick your numbers, chain your hits, lucky numbers. A press anywhere, or Space, opens the
   game. The features and their wording are the builder's choice, not yet confirmed by the user.

## What the screen shows

- **Untouched**: slate tile with a darker edge under it. **Picked**: violet (`#9b87ff`).
- **Miss** (drawn, not picked): the tile sinks, its face flat dark, its number red.
- **Hit**: a flat green regular octagon (one flat colour, no edge or shadow, as large as the
  tile lets it be: on a tall tile its width follows the tile's) lands on the tile, and light
  gleams across its face once, a wide band and a thin one, as on a cut stone. Nothing leaves the
  token. The user's choices, 2026-11-27, in order: no diamond; hexagon; no shadow; a shine; larger;
  shine instead of the eight flying blocks; always regular; then eight sides, and the gleam on the
  face instead of an outline spreading outwards.
  Nothing on the screen is pixelated any more (the sunk tile's dotted face went 2026-11-27, at the
  user's request: a miss is a flat dark sunk tile with a red number); type and icons stay smooth.
- **Lucky number**: gold frame and a small up arrow, marked before the first ball on a number that
  was not picked; drawn, it carries a gold octagon and the meter goes up one step.
- **Lucky round** (Calm, Bold, Wild, Chain; 1 round in 5): 3 lucky numbers marked 120 ms apart, the first
  ball 900 ms after the first mark; the meter's label STREAK gives its place to LUCKY ROUND.
- **Multiplier stairs**: seven blocks, each taller and a lighter gold; filled up to the best level
  reached. Steps the numbers in play cannot reach are dimmed; steps only a lucky round reaches are
  outlined until one starts.
- **Draw row**: one square per ball; a hit green, a lucky ball gold, a miss small and grey; hits
  that follow each other are joined.
- **Chain links**: lines between the hits that were joined, in the gaps between tiles, never
  across a number. The run in play is bright green; a link that a miss broke stays in its place,
  dimmed, so the round's broken chains remain readable. When the round ends, the chain that set
  the multiplier is drawn in gold.
- **Pay row**: the cell of the hits so far is lit green, gold when the round wins its cost or more.
- **Result**: a dark card in the middle of the board, only when the round wins: "N OF M HIT ·
  STREAK ×K" and the amount. The amount shows whole at once, no count-up (user,
  2026-11-27). Green with a sound from 1× the cost, gold from 10×; below the cost no sound. No card when nothing is won, no sparks.
- **Timing and motion**: one ball every 150 ms (40 ms in turbo) at an even beat, with no pauses
  on hits; the only held beat is the last ball when one more hit would win ten times the cost or
  more. Every animation is one eased move (token, links, pips, meter step, result card), none is
  stepped or held. The user found the earlier version (irregular holds on hits, stepped
  "pixel" animations) stuttering, 2026-11-27. Measured: no long tasks and steady 60 fps at 4× CPU
  slowdown, so the stutter was the design, not the machine.

## Paytable and info

Redesigned 2026-11-27 at the user's request ("lebih mudah dibaca dan dilihat"); the builder's
design, not yet confirmed by the user. Both stay in the shell's sheet.

- **Paytable** (`PayTable.svelte`): the win as three blocks (hits value × multiplier = win), then
  one level at a time behind tabs (Calm, Bold, Wild, and the two bonus modes with their cost),
  opening on the level in play. A row per number of hits, a column per count of numbers; the
  column of the numbers picked now stands on the pick colour. Each column's top prize is gold,
  wins under 1× are muted, no win is a dash. A bonus mode shows its values as the pay row under
  the board does. The multiplier is the meter's own staircase (`LadderStairs.svelte`) with a
  worked example from the config.
- **Info** (`GameRules.svelte`): short, after Keno Xtreme's info page (user, 2026-11-27: "lebih
  sederhana, contoh dari keno xtrem"): what the game is in one paragraph, the board's five tiles
  drawn as the board draws them, a line per risk with its top prize, the multiplier's staircase
  with three lines, lucky numbers in two, a few lines per bonus mode, the buttons, and the return
  and top prize of every mode as two small grids (numbers down, risks across). The math's mode
  names are tied to the game's in one line under the grids.
- On wide screens both sheets are larger than the shell's (user, 2026-11-27): 1080 px wide, up to
  920 px tall (`--ui-sheet-large`, `--ui-sheet-max-height` in `Game.svelte`; the info asks for
  the large sheet through `Modals`' `gameRulesSize`). Other games keep the shell's sizes.

## Names

Risk names stay English in every language: CALM, BOLD, WILD. The two bonus modes have names of
their own since 2026-11-27 (the user asked for attractive names; these are my proposal, applied):
**Unbroken Chain** (math `chain_10`, 10×: a miss lowers the run one step and never breaks it) and
**Golden Chain** (math `chainmax_10`, 100×: three lucky numbers, gold on the board, in every
round). Anything above that still says Chain or Chain Max means these two. The 1× modes are named
as the math names them (CALM_3 … WILD_10). Where a bonus mode is listed (rules' mode table, replay
summary) the math's name stands beside the game's, as Engine asks. Each bonus mode's card in the
bonus scene has a picture in the lobby tile's own drawing (square links, each with a hard edge
under it, rising to the right): two green links for Unbroken Chain, three gold ones for Golden
Chain. The bonus button is the word "Bonus" alone, no icon (user, 2026-11-27). The
pictures are written to `src/game/modePictures.ts` by `scripts/mode_pictures.py`.
