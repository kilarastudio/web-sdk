# Dwanda: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-25: the math is built (`math-sdk/games/dwanda`, rules in its `readme.txt`) and the
game exists as a **grey box** (`apps/dwanda`): every screen and every mode plays from the math's
books with squares and words in place of art. Nothing in the grey box is a decision about the
look.

- **Working choices, not confirmed by the user:** the name Dwanda and the theme Phoenix vs Dragon.
  Math and RGS id `dwanda`, app folder `apps/dwanda`. Feature and mode names (the Duel, Clash
  cell, BLAZE, ECLIPSE) stay English in every language.
- **Nothing about the look is decided**: no palette, art style, characters, symbols, sound or
  motion.

## What the grey box shows

- **Symbols** are squares with their math names. Phoenix symbols P1 to P4 are light grey with a
  "▲" in the top left corner, dragon symbols D1 to D4 dark grey with a "▼"; rank 1 is the
  outermost shade of each side. The scatter S is the only white square.
- **Territory** lies over the symbols and stays with the position: phoenix territory is a thin
  light edge with a light "P" tab in the cell's bottom right corner, dragon territory a thin grey
  edge with a black "D" tab.
- **A Clash cell** is a thick white edge with its value ("×16") on a white tab along the bottom
  of the cell. A cell that changes swells once.
- **The Duel** (free spins): "DUEL" in the intro (with its free spins and, in BLAZE and ECLIPSE,
  the starting Clash cells), the counter above the board ("DUEL 3 / 10") and the outro ("DUEL
  WON"). The background is a shade lighter and the board's edge white while it lasts.
