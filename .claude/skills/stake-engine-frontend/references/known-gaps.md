# Known gaps in this repo's sample templates

Verified against this repo at commit `ba88c8d` (2026-10-23). The sample apps (`cluster`, `lines`, `number-picker`, `price`, `scatter`, `ways`) are starting points, not publishable games. When you build a game from one, or audit one, check these first. Re-verify before relying on an entry — someone may have fixed it since; if you fix one, update this file.

## Fails review as shipped

| Gap | Where | Guideline | Fix |
| --- | --- | --- | --- |
| External Typekit stylesheet `https://use.typekit.net/aba0ebl.css` | `apps/*/src/app.html` | Static-only / CSP; console errors | Bundle the font files in `static/` and load them with local `@font-face` |
| Viewport meta is `width=device-width` only | `apps/*/src/app.html` (and `packages/config-svelte/app.html`) | 223 double-tap zoom | `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`; consider `touch-action: none` on the game surface |
| `LoaderStakeEngine` + `stake-engine-loader.gif` rendered at launch | `apps/*/src/routes/+layout.svelte`, `apps/*/static/stake-engine-loader.gif` | 275 | Remove it; use the studio's own loader |
| Sample art, symbols, spines, sounds, "ADD YOUR LOGO", placeholder game names | `apps/*/static/assets`, `Game.svelte` | Unique assets requirement | Replace all |
| `DEFAULT_BET_MODE_META` icons/images point to an external S3 bucket (`test-fart-cdn-bucket…amazonaws.com`) | `packages/state-shared/src/constants.ts` | Static-only / CSP | Ship mode art locally and define the game's own bet-mode meta |
| `payTable` label has no social variant (shows "PAYTABLE") | `packages/components-ui-pixi/src/i18n/i18nDerived.ts` | 77 | Add `stateUrlDerived.social() ? 'WIN TABLE' : …`; audit every other `i18nDerived` key the same way |
| Replay labels hardcoded in English (`PLAY`, `PLAYING`, `PLAY AGAIN`, `REAL COST (×n)`) | `packages/components-ui-pixi/src/components/ButtonReplay.svelte`, `UIReplay.svelte`; number-picker `Game.svelte` | 239/240 | Route through `i18nDerived` |
| Debug translation overlay ("TRANSLATIONS TEST") rendered in `Game.svelte` | `apps/*/src/components/I18nTest.svelte` | Visual bugs | Remove from the game |
| Second runtime Typekit load: `WebFont.load({ typekit })` before Pixi starts | `packages/pixi-svelte/src/lib/utils.svelte.ts` (~line 61) | Static-only / CSP | Load bundled fonts instead (e.g. `FontFace` / CSS `@font-face` from `static/`) |
| Game rules and paytable modals contain only "ADD YOUR GAME RULES" / "ADD YOUR PAY TABLE" | `packages/components-ui-html/src/components/ModalGameRules.svelte`, `ModalPayTable.svelte` | 24, 25, 26, 27, 29, 185, 235 | Write the full rules: RTP and max win per mode, symbol payouts, win formation, mode costs, free spins, every control, disclaimer |
| Buy-bonus menu lists the five sample modes from `DEFAULT_BET_MODE_META` (ANTE, SUPERANTE, SUPERSPIN, BONUS, SUPER) with other games' copy, while `lines` math has only `base`/`bonus` | `packages/state-shared/src/constants.ts`, `apps/lines/src/game/config.ts` | 27, 225; unknown mode → `ERR_VAL` | Define the game's own modes, matching math `index.json` names and costs |
| `freeSpinRetrigger` appears in the bonus fixtures but has no handler (console error, retrigger not shown) | `apps/lines/src/game/bookEventHandlerMap.ts` | Rules must match play; console errors | Add a handler; compare every event type in the real math books with the handler map |
| Bet menu grid formats amounts with `toFixed(2)` (wrong for JPY/IDR/KWD…) and picks levels via hardcoded `MOST_USED_BET_INDEXES` | `packages/components-ui-html/src/components/BetMenuAmountGrid.svelte`, `constants-shared/bet.ts` | 219, 242 | Use the currency formatter and the server's `betLevels` |

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
