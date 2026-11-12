# How a Kilara game gets built

The workflow used for the first release game (Dragon's Glint, `apps/deep-glint`), written so the
next game can follow it whatever its theme or art style. It says how the work is done. What a game
should look and feel like is kept apart from it:

- [`style-kilara.md`](style-kilara.md): what every Kilara game shares (HUD, menus, motion and
  sound principles).
- `apps/<game>/docs/style.md`: one game's own theme, palette and art decisions.

A new game copies the workflow, keeps the studio style, and writes its own game style.

## Roles

- **The user** decides direction and judges feel: theme, what looks good, whether motion and sound
  are right. They test on a real phone over Tailscale.
- **The lead agent** plans, writes the code, checks every result, and reports plainly what was
  verified and what was not.
- **Subagents** take whole, separable jobs (a batch of sounds, a set of animation frames). Use a
  judgment-grade model for work that needs taste and checking, a cheap one for mechanical work;
  never the lead's own model by default. Give each a brief that says what exists, the standard to
  meet, what to report, and what not to touch. Their reports are claims: look at the result.

## Stages

1. **Research and theme.** Research first when the question is open (a report with sources).
   Offer three themes and judge them as a player would, not as a developer. The user picks.
2. **Lock the look before making anything.** One palette, one pixel density (or the style's
   equivalent), light direction, outline. Write it into the game's `style.md`. Everything made
   later is checked against it.
3. **Decide what is drawn by code and what is generated.** In Dragon's Glint: symbols, board,
   panels, particles and effects are drawn and animated by code; backgrounds, the character and
   the font come from an image model; all sound from a sound model. Code-drawn art is exact,
   cheap to change and animates freely; generated art carries detail code cannot.
4. **Build the game end to end, thin.** Loading, welcome screen (features), base game, every
   mode, bonus, big wins, replay. Platform rules come first (`.claude/skills/stake-engine-frontend`).
5. **Make it feel good, one layer at a time**, in this order, each shown to the user before the
   next: reel motion, win feedback (hit, count-up, coins, sound), escalation over a run of wins,
   each symbol's own win act, idle life, anticipation, the character's reactions, ambient life
   (flames).
6. **Menus and the rest of the UI** through the shared parts (`packages/components-ui-html`).
7. **Commit in parts** when the user asks, straight to `main`.

## Making assets

- **Code-drawn art** lives in `apps/<game>/src/pixel` (palette, canvas, shapes, drawings,
  textures). It has no DOM or Pixi dependency, so `node scripts/pixel-preview.ts` renders review
  sheets without a browser. Draw, render the sheet, look at it, repeat.
- **Prompts for generated images** forbid the shine cliché in so many words ("no sparkles, no
  twinkle stars, no plus-shaped glints, no lens flare, no floating light specks, no glow") and
  avoid words that call it up (glowing, shiny, glint, sparkling); gems are described by their
  facets. Check every result for it before showing it.
- **Generated images**: generate a key image first and get it approved; make everything else from
  it, with region-locked edits so only the part that should change can change. Then lock the
  result to the palette and grid (`tools/play/pixelize.py`). Check each frame against the key:
  parts that should not move must be pixel-identical; open the frames enlarged and look.
  Raw generations, logs and review sheets stay outside the repo; only the shipped files go in
  `apps/<game>/static/assets`.
- **Sound**: generate two or three takes per sound, pick by measurement (onset, length, spectrum,
  loudness) and say that nobody has listened. One audio sprite per game. Derive families by
  pitch (a rising scale for steps) instead of generating each. Keep the lossless processed clips
  so the sprite can be rebuilt without re-encoding.
- **Separating moving parts from a picture** (the torch flames): erase the part from the
  background by code, keep the original, and draw the moving part over it.

## Checking work

Everything is run and looked at before it is reported. The tools are in `tools/play`:

- Runtime errors and a screenshot: `shot.py --errors`.
- Motion: a frame run (`perf.py --shots`, `sheet.py`), read frame by frame.
- Frame rate: `perf.py` with the CPU slowed 4×. If frames hold at 60 and motion still looks
  wrong, the problem is the motion curve, not performance.
- Sound: `soundlog.py` shows which sounds fire and when.
- Every screen size: `menus.py` (phone, small phone, sideways phone, mini player 400×225, desktop,
  tablet).
- The real flow: replay URLs of known rounds (a base round with tumbles, a bonus trigger, a big
  win) through the local game server, not only Storybook fixtures.
- Lint, format, build.

A hidden browser pane pauses animation; use the headless tools. Report what the tools cannot
judge (feel, how a sound sounds) as unjudged.

## Serving a build to the user's phone

One HTTPS address serves the game and proxies the game server, so the phone accepts one
certificate (`DEV_TLS_DIR` and `DEV_RGS_PROXY` in `packages/config-vite`). The servers must run
somewhere that outlives the agent's turn (a terminal tab, not a preview started by the agent).
Give the link, say it was checked from the desktop only, and ask for a screenshot if it fails.

## Working with feedback

The user's reactions are short and about feel ("stiff", "like jelly", "looks like dancing",
"too generic"). Each one names a class of thing, not one instance:

- Find the cause in the code before changing anything, and say what it was.
- Fix the class: "jelly" on landing also ruled out squash in every later symbol animation.
- When a second attempt of the same kind is rejected, change the approach, not the parameters
  (the flame went from a bent shape to a heat simulation).
- Show motion as a GIF or frames with the reply; never claim it feels right.
- Record the decision in the game's or the studio's style file, with the user's words.

## What goes where

| Thing                                                  | Place                                              |
| ------------------------------------------------------ | -------------------------------------------------- |
| Game code, code-drawn art, shipped assets              | `apps/<game>`                                      |
| The game's palette                                     | `apps/<game>/art/palette.txt`                      |
| The game's style decisions                             | `apps/<game>/docs/style.md`                        |
| Shared HUD, menus and their parts                      | `packages/components-ui-html`                      |
| Studio style                                           | `docs/kilara/style-kilara.md`                      |
| Play tools                                             | `tools/play`                                       |
| Raw generations, takes, review sheets, asset pipelines | outside the repo (the workspace's `output/<game>`) |
