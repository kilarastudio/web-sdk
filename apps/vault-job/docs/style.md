# The Vault Job: style

This game's own look and feel. What it shares with every Kilara game is in
`docs/kilara/style-kilara.md`; how it is built is in `docs/kilara/game-workflow.md`.

Status 2026-11-25: the math is finished (`math-sdk/games/vault_job`) and the game exists as a
**grey box** (`apps/vault-job`, built from the SDK's lines sample): every screen and every mode
plays from the math's books with squares and words in place of art. Nothing in the grey box is a
decision about the look; theme, art style, palette and sound are all still open.

## What the squares stand for

- **Paying symbols** (H1–H4, L1–L4): grey squares with their math names, high symbols lighter
  than low ones.
- **Scatter** (S): a black square with a white edge, marked SCATTER.
- **Crew wilds**: white squares with the crew member's letter and multiplier: D Driver (WD),
  S Safecracker (WC), M Muscle (WM), H Hacker (WH), e.g. "S ×12". A crew member that is sticky in
  The Job carries a dark STICKY tab across its top.
- **The crew layer**: crew stand in a layer over the reels, so sticky crew stay in their cells
  while the reels spin under them, Drivers slide one reel left before a free spin, Muscles fill
  their reel one cell at a time, and a Hacker's or Safecracker's new multiplier swells in place.
  What the layer shows as lines are paid is exactly the math's `crewBoard` event.
- **A paid line**: drawn through the board (thick over the symbols that pay), with a white tab
  under the board: line number, how many of which symbol, the crew multiplier, the amount.
- **Words above the board**: the free spin counter on the left; what the crew just did on the
  right (DRIVERS DRIVE, MUSCLE FILLS THE REEL, HACKER COPIES ×80, SAFECRACKERS CLIMB, MAX WIN).
- **The Job**: the background a shade lighter and the board's edge white. Its intro names the
  free spins and the crew it starts with; its outro counts up what it won.

## Names

Feature and mode names stay English in every language: THE JOB (free spins); modes ANTE, BONUS,
INSIDE, HEIST; crew DRIVER, SAFECRACKER, MUSCLE, HACKER.
