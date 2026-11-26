# Going Once: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-25: the math is finished (`math-sdk/games/going_once`) and the game exists as a
**grey box** (`apps/going-once`, built from the Vault Job grey box, itself from the SDK's lines
sample): every screen and every mode plays from the math's books with squares and words in place
of art. Nothing in the grey box is a decision about the look; theme, art style, palette and sound
are all still open.

## What the squares stand for

- **Paying symbols** (H1–H4, L1–L4): grey squares with their math names, high symbols lighter
  than low ones. **Wild** (W): a white square.
- **Lot** (P): a black square with a white edge showing its value in multiples of the base bet
  ("5×"). A lot seen while the reels spin, before it has a value, reads LOT.
- **Gavel** (G) and **buyer** (B): black squares with a white edge marked G and B.
- **Base game gavel**: the gavel's cell swells and the words GAVEL: LINE WINS ×2 show above the
  board before the lines are paid.
- **A paid line**: drawn through the board (thick over the symbols that pay), with a white tab
  under the board: line number, how many of which symbol, the multiplier, the amount.
- **The Auction**: its own board over the reels, on the same 15 cells. Lots keep their cells;
  empty cells flash while a respin turns; what lands pops in. RESPINS LEFT is above the board on
  the left, the hammer's words on the right (GOING ONCE, GOING TWICE, SOLD, BUYER COLLECTS 5×,
  GAVEL: EVERY LOT ×2), and the lots' total under the board. The Last Bid and a Full House are
  called across the board with the amount before and after. The background is a shade lighter
  and the board's edge white while it runs.
- Nothing is ever called a jackpot, Grand, Major or Mini: the full board doubling is FULL HOUSE.

## Names

Feature and mode names stay English in every language: THE AUCTION, LAST BID, FULL HOUSE; modes
ANTE, BONUS, GAVEL, PRIVATE.
