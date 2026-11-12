# Known gaps in this repo's sample templates

Verified against this repo at commit `ba88c8d` (2026-10-23); the sample-art, rules and bet-menu rows were re-checked at `74b1fe3` (2026-11-12). The sample apps (`cluster`, `lines`, `number-picker`, `price`, `scatter`, `ways`) are starting points, not publishable games. When you build a game from one, or audit one, check these first. Re-verify before relying on an entry — someone may have fixed it since; if you fix one, update this file.

## Fails review as shipped

| Gap | Where | Guideline | Fix |
| --- | --- | --- | --- |
| No game art at all: the sample art, spines, sounds and `loader.gif` were removed on 2026-11-10, so each sample's `src/game/assets.ts` is an empty `{}` and keys that are not loaded render nothing. The game names are placeholders (`LINES GAME`, `SCATTER GAME`, …) | `apps/*/src/game/assets.ts`, `apps/*/static`, `Game.svelte` | Unique assets requirement | Make the game's own art, sound and name (see `docs/kilara/game-workflow.md`; Dragon's Glint is the worked example). The Kilara logo is already in the HUD header (`components-ui-html` `UiLogo`, shown by default; a game's `logo` snippet replaces it). The studio intro is `components-ui-html` `StudioIntro` |
| Replay labels hardcoded in English (`REAL COST`, `×`) | number-picker `Game.svelte` | 239/240 | Route through `i18nDerived` |
| The rules and paytable sheets show only the version line: `ModalGameRules` and `ModalPayTable` are `UiSheet` frames that render what the game passes as the `gameRules` and `payTable` snippets of `Modals`, and no sample app passes any | `packages/components-ui-html/src/components/Modals.svelte`, each app's `Game.svelte` | 24, 25, 26, 27, 29, 185, 235 | Write the game's own `GameRules.svelte` and `PayTable.svelte` with `UiInfoSection` / `UiPayGrid` / `UiPayCard` (as in `apps/dragons-glint`): RTP and max win per mode, symbol payouts, win formation, mode costs, free spins, every control, disclaimer |
| Buy-bonus menu lists the five sample modes from `DEFAULT_BET_MODE_META` (ANTE, SUPERANTE, SUPERSPIN, BONUS, SUPER) with other games' copy, while `lines` math has only `base`/`bonus` | `packages/state-shared/src/constants.ts`, `apps/lines/src/game/config.ts` | 27, 225; unknown mode → `ERR_VAL` | Define the game's own modes, matching math `index.json` names and costs |
| `freeSpinRetrigger` appears in the bonus fixtures but has no handler (console error, retrigger not shown). `scatter` also lacks `freeSpinRetrigger` and `wincap` (both emitted by `0_0_scatter` math); `kilara-poc` handles both | `apps/lines/src/game/bookEventHandlerMap.ts`, `apps/scatter/src/game/bookEventHandlerMap.ts` | Rules must match play; console errors | Add a handler; compare every event type in the real math books with the handler map |
| Bet menu formats amounts with `toFixed(2)` and K/M suffixes (wrong for JPY/IDR/KWD…), and the levels it offers are picked with the hardcoded `MOST_USED_BET_INDEXES` | `packages/components-ui-html/src/components/ModalBetMenu.svelte` L20-23, `components-shared/src/components/Authenticate.svelte` L74, `constants-shared/bet.ts` | 219, 242 | Use the currency formatter and the server's `betLevels` |

## Not wired up (handle when you touch the feature)

| Gap | Where | Notes |
| --- | --- | --- |
| `config.jurisdiction` flags are stored but never read | `Authenticate.svelte` → `stateConfig.jurisdiction` | `disabledSpacebar`, `disabledAutoplay`, `disabledBuyFeature`, `disabledTurbo`, `minimumRoundDuration`, … are not enforced. Social mode is driven only by the `social` URL param, not `jurisdiction.socialCasino` |
| `config.gameModes` (per-mode `costMultiplier`, `maxBet`) is ignored | `Authenticate.svelte`, `rgs-fetcher/src/schema.ts` (legacy `betModes`) | Mode costs come from local `stateMeta.betModeMeta`; make them match math and the server |
| Error schema still lists legacy codes (`ERR_IS`, `ERR_ATE`, `ERR_BE`, `ERR_UE`, `ERR_GE`) | `packages/rgs-fetcher/src/schema.ts` | Current codes: `ERR_VAL`, `ERR_IPB`, `ERR_GLE`, `ERR_ACT`, `ERR_GEN`, plus non-JSON 400/423/429 |
| Insufficient balance: bet button and autoplay are disabled via `stateBetDerived.isBetCostAvailable()`, but no message explains why for single bets, and holding space keeps betting without re-checking balance (`checkSpaceHold`) | `ButtonBetProvider.svelte`, `ButtonBet.svelte`, `createIntermediateMachineBet.ts`, `EnableSpaceHold.svelte` | 222. `betCostMultiplier()` only counts `activate`-type modes; buy-type modes need their own cost check |
| `isBetCostAvailable()` compares floats (`betCost() <= balanceAmount`): `0.1 × 3 = 0.30000000000000004`, so an exactly affordable bet shows as unaffordable | `packages/state-shared/src/stateBet.svelte.ts` | Bet/spin wrongly disabled at exact balance | Compare `Math.round(x * API_AMOUNT_MULTIPLIER)` values |
| Mode keys are sent uppercase (`BASE`, `BONUS`) while `apps/lines/src/game/config.ts` names math modes `base`/`bonus` | `stateBet.activeBetModeKey`, `ButtonBetProvider.svelte`, bet-mode meta | 225 (names must match math); RGS may reject an unknown mode | Use the exact mode names from math `index.json` and `config.gameModes` |
| Wallet amount not rounded: `requestBet` sends `options.amount * API_AMOUNT_MULTIPLIER` (4.1 → `4099999.9999999995`) | `packages/rgs-requests/src/rgs-requests.ts` | RGS rejects non-integer / off-step amounts | `Math.round(amount * API_AMOUNT_MULTIPLIER)` |
| `correctBetAmount` clamps the bet to `balance / cost`, producing amounts that are not in `betLevels` (or 0) | `packages/state-shared/src/stateBet.svelte.ts` | 242 | Keep the selection on a server level; disable betting and explain instead of clamping |
| Single-round end-round is decided from `payoutMultiplier > 0`, not `round.active` | `getBetType` in `packages/utils-xstate/src/createPrimaryMachines.ts` | 221 when a mode uses `endRound: "always"`/`"never"` | Branch on `round.active` |
| `rgsFetcher.post` logs non-200 responses but still parses them as JSON | `packages/rgs-fetcher/src/rgsFetcher.ts` | Plain-text 400/423/429 bodies crash parsing | Check `response.ok` like `get` does and surface a readable error |
| Space bar still bets while rules/paytable/settings modals are open (only form fields are excluded) | `packages/components-shared/src/components/EnableHotkey.svelte` | 228 | Ignore hotkeys while a modal is open |
| `pnpm run storybook` in apps passes an extra `public` argument and fails with "too many arguments" | `apps/*/package.json` | Tooling | Run `pnpm exec storybook dev -p 6001` from the app, or fix the script |
| Win formatter allows up to 4 decimals for every bet size and currency (incl. 0-decimal JPY/IDR) | `packages/utils-shared/amount.ts` | Engine recommends extra precision only when base bet < 0.10 |
| Replay response `state` typed as an array; Engine docs show an object placeholder | `packages/rgs-requests/src/rgs-requests.ts` | Confirm against a real replay response before changing |
| Playback error during a *normal* resumed round leaves the resume machine stuck (replay mode recovers) | `packages/utils-xstate/src/createIntermediateMachineResumeBet.ts` | Ending without end-round would leave the round open server-side; design deliberately |

## Already fixed (don't reintroduce)

- Replay 404 with empty body crashed JSON parsing → `rgsFetcher.get` checks `response.ok`.
- Replay ignored `currency`, had no Play Again, and could lock its button after an error.
- New sessions ignored `defaultBetLevel`.
- Sub-cent wins rounded to zero; `XEC` missing; `AED`/`QAR`/`EGP` symbol placement wrong.
- Unsupported `lang` fell through to broken text.
- Viewport meta was `width=device-width` only (double-tap zoom) → `apps/*/src/app.html` and `config-svelte/app.html` set `initial-scale=1, maximum-scale=1, user-scalable=no`, and `body` has `touch-action: manipulation` because iOS Safari ignores `user-scalable=no`.
- Stake placeholders removed: Typekit (stylesheet in `app.html` and `WebFont.load` in `pixi-svelte` → one UI font, Geist (`@fontsource-variable/geist`, OFL, bundled; with `inline` output its woff2 files end up base64 in `index.html`, ~100 KB for all scripts), declared once in `components-ui-html` `font.css` as `--font-family`), `LoaderStakeEngine` + gif, "Add Your Loader" text (`LoaderExample` → `Loader`), template favicon, `I18nTest` overlay, "ADD YOUR LOGO", and the external S3/twist-game URLs in `state-shared` (unused bet-mode art and sample `DEFAULT_GAME_RULE_META`).
- HUD `payTable` label had no social variant; HUD replay labels (`PLAY`, `PLAYING`, `PLAY AGAIN`, `REAL COST`) were hardcoded → both go through `components-ui-html` `i18nDerived`.
- STOP (button and space bar) was disabled during the last affordable spin because `ButtonBet` disabled itself whenever `isBetCostAvailable()` was false → it now only blocks a new bet while idle.
