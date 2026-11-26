# Kilara Keno: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-26: math version 2 (20 modes: Low and High with 2 to 10 numbers, Chain 10× and
Chain Max 100× with 10 numbers, and Kilau numbers in every mode) is built and the grey box follows
it; the user asked to "implement first", final approval is open. Before that, 2026-11-25: the math is finished (`math-sdk/games/kilara_keno`) and the game exists as a
**grey box** (`apps/kilara-keno`, the Kilara shell taken from the Going Once grey box, with the
slot parts removed, and since 2026-11-25 the burst HUD in place of the slot HUD): every mode plays from the math's books with flat grey tiles and words in
place of art. The public name is not chosen; the game shows KILARA KENO. Nothing in the grey box
is a decision about the look; theme, art style, palette and sound are all still open.

## How the grey box is built

- The game sits inside the burst HUD (`UiBurst` in `packages/components-ui-html`), not under the
  slot HUD: no dock, no round button, no feature badge. The HUD gives the game three places: the
  game itself (streak meter, draw tray, board, status line, win strip), the choices (numbers and
  level) and the actions beside the amount (quick pick, clear).
- The board is 8 × 5 on every screen, as in the keno games players already know.
- The top bar's title is the game's name (no Kilara logo in the burst HUD), the clock under it.
- The frame is the one players know from Stake's Keno (see Familiar first in the studio style):
  8 × 5 board, the win per hits under it, the same order of controls. What is Kilara Keno's own:
  the streak meter, the light and sound of a hit, and Kilara's colours, type and motion.
- Tall screens: top bar, game, the play bar with autoplay and turbo straight under it, the amount
  with quick pick and clear, then numbers and level. Wide screens: a panel left of the game with
  the amount, level, numbers, quick pick and clear, and the play bar at its foot. A replay has the
  play bar and turbo only, and the round's amounts in place of the choices.
- Not as in Stake's Keno, because the math has one mode per size: the player chooses how many
  numbers (2 to 10) with a selector, placed next to quick pick. Chain and Chain Max play 10
  numbers: arming one sets the selector to 10, and choosing another size goes back to the last
  1× level.
- The HUD sizes everything in one unit, the largest at which the screen fits without scrolling
  (checked at 412×760, 360×560, 768×1024, 1200×675, 844×390 and the 400×225 mini player).
- Screenshots: `output/kilara-keno/burst-hud/`.

## What the tiles stand for

The colours mean what they mean in Stake's Keno (purple is picked, green is a hit, a drawn tile
that was not picked sinks dark); gold stays for wins.

- **Untouched**: dark grey, number in Kabut.
- **Picked**: filled violet (Kilau `#9b87ff`), number in Malam.
- **Drawn, not picked (a miss)**: the tile sinks to Malam, a grey ball behind the number.
- **Drawn and picked (a hit)**: the tile stays violet, the number in green (`#62e08a`, a grey-box
  value) on a Malam ball; its ball in the draw tray is green.
- The newest ball grows into place (uniformly, no squash).
- **Kilau number**: marked when the round starts, before the first ball, on a number that was not
  picked: a square gold frame, number in gold. Drawn, it is a gold ball (board and draw tray) and
  the meter goes up one level. No twinkle, no glint.
- **Streak meter**: one step per level the mode in play can reach (numbers played + Kilau numbers,
  at most ×1 ×2 ×3 ×5 ×10 ×15 ×25); the level is the run of hits plus the Kilau balls drawn; the current level filled Kertas,
  steps up to the best level tinted, the best one marked by a gold bar, the round's multiplier at
  the end of the row in gold once it is above ×1.
- **Draw tray**: one ball per number the round draws (10, or 12 in Chain and Chain Max), filled in draw order.
- **Win strip**: the current mode's win per number of hits; the cell of the hits so far lit,
  gold once it wins.
- **Chain** and **Chain Max** chosen are Langit (armed), like every activated mode in the shell;
  the button shows 10× or 100× and the real cost at the current bet.

## Names

Level names stay English in every language: LOW, HIGH, CHAIN, CHAIN MAX. Mode names are the math's
(LOW_2 … HIGH_10, CHAIN_10, CHAINMAX_10), the same in the game, the replay and the math files.
