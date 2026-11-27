# Kilara Keno: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-27: math version 3 (Low plays 1 to 10 numbers, High 3 to 10; lucky rounds: in Low,
High and Chain 1 round in 5 marks 3 lucky numbers; the player may name their own lucky number)
is in the grey box. Earlier, 2026-11-26: math version 2 (20 modes: Low and High with 2 to 10 numbers, Chain 10× and
Chain Max 100× with 10 numbers, and lucky numbers in every mode) is built and the grey box follows
it; the user asked to "implement first", final approval is open. Before that, 2026-11-25: the math is finished (`math-sdk/games/kilara_keno`) and the game exists as a
**grey box** (`apps/kilara-keno`, the Kilara shell taken from the Going Once grey box, with the
slot parts removed, and since 2026-11-25 the burst HUD in place of the slot HUD): every mode plays from the math's books with flat grey tiles and words in
place of art. The public name is not chosen; the game shows KILARA KENO. Nothing in the grey box
is a decision about the look; theme, art style, palette and sound are all still open.

## How the grey box is built

- The game sits inside the burst HUD (`UiBurst` in `packages/components-ui-html`), not under the
  slot HUD: no dock, no round button, no feature badge. The HUD gives the game three places: the
  game itself (streak meter, draw tray, board, status line, win strip), the choices (numbers and
  level) and the actions beside the amount (QUICK PICK, CLEAR, LUCKY, in that order).
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
  numbers (1 to 10) with a selector, placed next to quick pick. Chain and Chain Max play 10
  numbers: arming one sets the selector to 10, and choosing another size goes back to the last
  1× level. High plays 3 to 10: choosing HIGH with 1 or 2 numbers sets 3 (the numbers picked
  stay), choosing 1 or 2 with High on switches to Low; both say "HIGH PLAYS 3 TO 10 NUMBERS." on
  the status line. No path asks the RGS for a mode the math does not publish.
- **LUCKY** (third action): its second line says AUTO (the game places the lucky number) or the
  number the player named. On AUTO a press starts choosing: the status line asks for a number
  not picked, the next tap on one names it (a tap on a pick only repeats the request), a second
  press stops with nothing changed; the button carries a gold frame while choosing. With a number
  named, a press goes back to AUTO. Between rounds the named number carries the lucky number's frame;
  tapping it makes it one of the player's numbers (LUCKY back on AUTO). QUICK PICK never takes it,
  CLEAR keeps it. Off during a round, in a replay and in a resumed round. It changes no chance and
  no win: one of the book's lucky numbers (kilau[sum of the drawn numbers mod their count]) is
  shown on the named number, the rest of the board relabelled in order around it.
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
- **lucky number**: marked when the round starts, before the first ball, on a number that was not
  picked: a square gold frame, number in gold. Drawn, it is a gold ball (board and draw tray) and
  the meter goes up one level. No twinkle, no glint.
- **lucky round** (Low, High, Chain; 1 round in 5): its 3 lucky numbers are marked one after
  another, 120 ms apart (the player's own first), and the first ball comes 900 ms after the first
  mark instead of 450 ms (turbo and stop shorten it like every wait). The meter's label STREAK
  gives its place to LUCKY ROUND in gold, on two lines in the same cell, so nothing moves. Chain
  Max marks 3 in every round and shows no label.
- **Streak meter**: one step per level the mode in play can reach (numbers played + the most lucky
  numbers a round of it marks, at most ×1 ×2 ×3 ×5 ×10 ×15 ×25); the steps only a lucky round
  reaches (above numbers + the usual count of lucky numbers, e.g. ×10 and ×15 with 3 numbers) are outlined in
  gold and dimmed outside a lucky round, and look like the others in one; the level is the run of hits plus the lucky balls drawn; the current level filled Kertas,
  steps up to the best level tinted, the best one marked by a gold bar, the round's multiplier at
  the end of the row in gold once it is above ×1.
- **Draw tray**: one ball per number the round draws (10, or 12 in Chain and Chain Max), filled in draw order.
- **Win strip**: the current mode's win per number of hits; the cell of the hits so far lit,
  gold once it wins.
- **Chain** and **Chain Max** chosen are Langit (armed), like every activated mode in the shell;
  the button shows 10× or 100× and the real cost at the current bet.

## Names

Level names stay English in every language: LOW, HIGH, CHAIN, CHAIN MAX. Mode names are the math's
(LOW_1 … LOW_10, HIGH_3 … HIGH_10, CHAIN_10, CHAINMAX_10), the same in the game, the replay and the math files.
