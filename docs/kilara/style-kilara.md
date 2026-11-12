# Kilara style: what every game shares

Decisions that hold for every Kilara game, whatever its theme. A game's own look (palette, art
style, characters) is in `apps/<game>/docs/style.md`. How the work is done is in
[`game-workflow.md`](game-workflow.md). Rules that tools enforce are in the repo's `AGENTS.md`
(square corners, the locked logo).

## The HUD

- One HUD for every game, in HTML over the canvas (`packages/components-ui-html`). Clean and
  app-like: flat surfaces, no borders, no glow, one shadow level.
- Colours: Kilau `#ffc53d` (gold), Malam `#0e1014` (near black), Kertas `#f3f4f6` (text),
  Kabut `#8a92a0` (muted), Langit `#7ab8ff` (switched on). Kilau is kept for the Kilau dot, wins
  and buying; Langit for something switched on or armed. The spin button stays neutral.
- Square corners everywhere; only true circles are round (spin, dots, knobs, the dock's notch).
- Buttons do not scale when pressed: the press shows in the content (the label or icon dips).
- Phones have no dock: the controls float over the game. Text that stands on the game's art sits
  on a scrim (a fade to Malam from the screen's edge) and is lighter than Kabut, so it reads on
  any picture, bright or dark.
- The reels are the focus: the board is as large as the layout allows; a character is smaller
  than the reels.

## Menus

- Every menu opens in one frame, `UiSheet`, built from the shared parts (`UiSheetSection`,
  `UiAction`, `UiChoiceGrid`, `UiStepper`, `UiSlider`, `UiInfoSection`, `UiPayGrid`, `UiPayCard`).
  A game supplies content, never layout.
- The panel is the HUD dock's own see-through Malam with the game blurred behind it. Not a solid
  grey.
- One frame, every screen: a bottom sheet on narrow screens, a full-height panel on short ones
  (sideways phones, the 400×225 mini player), a centred panel elsewhere. Sizes in px, never rem.
- The chosen option is filled Kertas; the one main action is a Kertas bar in a footer that
  stays put.
- A screen that sells a feature is not a menu. Buy bonus is a scene over the darkened game: no
  panel, big cards that drop in, the game visible behind. Activating (Langit) and buying (Kilau)
  look different at a glance, button and price.
- A mode never plays from one press: its card opens a confirmation that shows the real cost.

## Motion

- Motion is continuous and time-based. No held poses "on twos" for things that move through
  space; stepping is only for frame-sequence art.
- Reel symbols are solid objects. They never squash, stretch or wobble. They move, turn and grow
  uniformly.
- A symbol's way into place is one curve with no jump in speed: from rest, gathering speed,
  slowing in. No hard stop followed by a bounce.
- Columns land one at a time, 200 ms apart; an anticipated column lands about 1 s after the one
  before. A column pours in symbol by symbol rather than dropping as a block.
- Do not animate a thing by bending its outline with regular waves: it reads as dancing. Things
  that flow (fire) are simulated or drawn as what they are.
- If frames hold at 60 fps and motion still looks wrong, the curve is wrong.
- `prefers-reduced-motion` keeps the timings and drops overshoot, shake and particles.
- What research supports as moving players is anticipation, the order things are revealed in, and
  celebration in proportion to the win. Speeds and bounces are readability and brand choices.

## Light and shine

- No four-point twinkles, plus-shaped glints, lens flares or floating specks of light, in any art
  or effect, drawn or generated. They are the mark of generated art: scattered at random, all the
  same size, unrelated to where the light comes from.
- A shiny thing shows its shine in its own shape: facets lit from the light's side, a highlight
  that moves across the surface. Particles are solid flecks, smoke, coins or shards, never stars.

## Wins

- A win is felt in steps: a hit (a held beat and a shake in whole pixels), the symbols' own act,
  the amount, and the payout travelling to where the total counts up.
- A run of wins escalates: each one a note higher, a stronger hit, more from the character.
- Amounts count up eased (fast, then slow into the final digits), in whole currency units while
  counting, exact when they arrive.
- Celebration is for wins above the bet. A win below the bet is acknowledged, not celebrated.

## Sound

- Sounds belong to the game's world. A generic slot sound (the usual reel thunk) is a miss even
  when it is technically fine.
- Families climb a scale (scatter landings, tumble wins, coins).
- Nobody ships a sound on measurement alone: measured sounds are reported as not yet listened to.

## Text

- Every string goes through i18n, with social-mode wording where the platform restricts a word.
- Money is formatted by the shared helpers, never by hand.
