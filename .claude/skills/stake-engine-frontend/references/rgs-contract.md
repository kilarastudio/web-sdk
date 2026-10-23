# RGS contract

Distilled from Engine Studio docs (RGS, Wallet endpoints, RGS communication, Game replay), snapshot 2026-10-21. Archive copies, if present: `../docs/sources/studio/rgs.md`, `rgs/wallet.md`, `approval-guidelines/rgs-communication.md`, `approval-guidelines/game-replay-requirements.md`.

## Contents
1. Launch parameters
2. Wallet endpoints
3. Number scales and formulas
4. Round lifecycle (authenticate → play → end-round, resume)
5. Errors
6. Jurisdiction flags
7. Replay
8. Where the SDK implements each piece

## 1. Launch parameters

```
https://{team}.live.engine.io/{game}/v{version}/?sessionID=…&rgs_url=…&lang=en&currency=USD&device=desktop&social=false&demo=false
```

| Param | Notes |
| --- | --- |
| `sessionID` | Sent in the body of every wallet request. |
| `rgs_url` | Host only, no scheme (`rgs.example.com`). Base URL is `https://${rgs_url}`. Never hardcode; it can change any time. Invalid host → show a connection/auth error. |
| `lang` | ISO 639-1. Unknown/empty → English. `br` is treated as `pt` by the SDK. |
| `currency` | Same value authenticate returns in `balance.currency`. Display only — never affects game logic. |
| `device` | `desktop`, `mobile`, `tablet`. |
| `social` | `true` → social-casino (Stake.US) wording and currencies. |
| `demo` | Demo session flag. |

SDK getters: `stateUrlDerived.{sessionID, rgsUrl, lang, currency, social, replay, amount, game, version, mode, event}()` in `packages/state-shared/src/stateUrl.svelte.ts`.

## 2. Wallet endpoints

All **POST**, JSON body, relative to `https://${rgs_url}`. Field names are case-sensitive.

| Endpoint | Body | Response (relevant) |
| --- | --- | --- |
| `/wallet/authenticate` | `{ sessionID }` | `balance.{amount,currency}`; `config.{minBet,maxBet,stepBet,defaultBetLevel,betLevels[],gameModes[{mode,costMultiplier,maxBet}],user.id,jurisdiction{…}}`; `round` only if a round is unfinished |
| `/wallet/balance` | `{ sessionID }` | `balance` |
| `/wallet/play` | `{ sessionID, amount, mode }` | `balance`, `round.{betID,amount,payout,payoutMultiplier,active,mode,state[]}` |
| `/wallet/end-round` | `{ sessionID }` | `balance` |
| `/bet/event` | `{ sessionID, event }` | Saves progress inside an **active** round; returned later as `round.event`. `event` is a non-empty string ≤ 32 bytes. |

Authenticate first; every other session endpoint depends on it.

## 3. Number scales and formulas

| Context | Scale | Example |
| --- | --- | --- |
| Wallet `amount`, `balance.amount`, `payout`, `minBet`, `betLevels`, `defaultBetLevel`, replay `amount` param | integer × 1,000,000 | `1000000` = 1.00 |
| Book/LUT `payoutMultiplier`, book-event win amounts in fixtures and `round.state` | integer × 100 of base bet | `1150` = 11.5× |
| `round.payoutMultiplier` (play) and replay `payoutMultiplier` / `costMultiplier` | plain multiplier | `11.5` = 11.5× |

```
debit          = baseBet × modeCostMultiplier
winFromBook    = baseBet × bookPayout / 100        (NOT multiplied by cost again)
walletAmount   = amountInCurrency × 1_000_000
realReplayCost = amount × costMultiplier
```

Example: base bet 0.20, mode cost 100, book payout 1150 → debit 20.00, win 2.30, wallet payout 2300000.

SDK constants (`packages/constants-shared/bet.ts`): `API_AMOUNT_MULTIPLIER = 1000000`, `BOOK_AMOUNT_MULTIPLIER = 100`. UI state (`stateBet.betAmount`, `balanceAmount`) is in currency units; `requestBet` multiplies by `API_AMOUNT_MULTIPLIER` itself.

## 4. Round lifecycle

1. **Authenticate.** Apply bet config from the response — never hardcoded values. Bet increments follow `stepBet`/`betLevels`; min and max must be selectable. Each mode in `config.gameModes` has its own `costMultiplier` and `maxBet`.
2. **Unfinished round?** If `round.active` is true: restore `round.amount`, `round.mode`, `round.state`, `round.event` and resume it; the selected bet stays `round.amount` afterwards (do not reset to `defaultBetLevel`). If there is no active round: start on `defaultBetLevel`.
3. **Before play:** if `balance < bet × costMultiplier`, do not send `/wallet/play`; show an insufficient-balance message. Applies to the bet button, space bar, autoplay and bonus buy.
4. **Play:** one `/wallet/play`, then play `round.state` events strictly in order.
5. **End round:** `round.active === false` means 0× and already closed by the RGS — never call end-round for it. `active === true` (a win) → call `/wallet/end-round` and use the balance it returns. A winning round that never ends also fails review.
6. Only one round may be active; a play during an active round fails with `ERR_VAL`.

Math `index.json` may set `endRound` per mode (`no_change`, `never`, `always`), so always branch on the actual `round.active`, not on payout size or assumptions.

Fork behaviour to know about: `packages/utils-xstate/src/createPrimaryMachines.ts` ends single-round wins before playback finishes and delays the balance update; bonus wins end after playback. Changing this timing affects resume.

## 5. Errors

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `ERR_VAL` | Invalid request: unknown/unauthenticated/old session, bet outside levels, unknown mode, play while a round is active, end-round without one |
| 400 | `ERR_IPB` | Insufficient balance |
| 400 | `ERR_GLE` | Gambling limits exceeded |
| 429 | `ERR_ACT` | Draw temporarily unavailable — retry after a pause |
| 500 | `ERR_GEN` | Server error |
| 400 | plain `Bad Request` | Malformed JSON / field types / sessionID |
| 423 | on `/wallet/play` | New bets paused; balance and end-round still work |
| 429 | demo launch | IP rate limit |

Bodies are not always JSON. Check `response.ok` before `response.json()`. `packages/rgs-fetcher/src/schema.ts` still lists legacy codes (`ERR_IS`, `ERR_ATE`, `ERR_BE`, …) — don't rely on them.

## 6. Jurisdiction flags

`config.jurisdiction` from authenticate (stored in `stateConfig.jurisdiction`): `socialCasino`, `disabledFullscreen`, `disabledTurbo`, `disabledSuperTurbo`, `disabledAutoplay`, `disabledSlamstop`, `disabledSpacebar`, `disabledBuyFeature`, `displayNetPosition`, `displayRTP`, `displaySessionTimer`, `minimumRoundDuration`. A feature you build or change must respect its flag (hide/disable it when the flag is set; `minimumRoundDuration` is a floor on round playback time).

## 7. Replay

Mandatory for new games. Reviewers request event IDs per mode for: normal win, big win, max win, loss (0×), bonus trigger.

**Query params:** required `replay=true`, `game` (UUID), `version` (math version), `mode`, `event` (simulation ID), `rgs_url`. Optional `currency`, `amount` (API units, `1000000` = 1.00), `lang`, `device`, `social`, `demo`.

**Request:** `GET https://{rgs_url}/bet/replay/{game}/{version}/{mode}/{event}` — no session, no auth. Encode path segments.

**Response:** `{ payoutMultiplier: float, costMultiplier: float, state?: … }`. `state` is omitted when the event has none. Unknown game/version/mode/event → plain `404` with **no body**.

**UX requirements:**
- Show a loader, fetch automatically, then show **Play**.
- Play the round exactly like normal play (all animations and sounds), keep the result visible.
- **Play Again** restarts the same event.
- Hide/disable all betting controls; no balance; no wallet or session calls; no way into normal play.
- Show the bet, the mode cost multiplier and the real cost, e.g. `BONUS: 1.00 SC · REAL COST: 100.00 SC`. A replay with no amount anywhere fails.
- Apply `currency`, `lang`, `amount`; missing or invalid values fall back sensibly (USD, English, a default bet) and never break.
- Fetch failure → visible error message.
- Works and fits at Popout S (400×225).
- Social mode: no restricted words; mode names identical to the game and math.

## 8. Where the SDK implements it

| Concern | File |
| --- | --- |
| URL params | `packages/state-shared/src/stateUrl.svelte.ts` |
| Authenticate, bet config, resume, replay bootstrap | `packages/components-shared/src/components/Authenticate.svelte` |
| Request wrappers | `packages/rgs-requests/src/rgs-requests.ts` |
| Transport (`ok` check, JSON) | `packages/rgs-fetcher/src/rgsFetcher.ts` |
| Bet lifecycle, end-round, replay guards | `packages/utils-xstate/src/createPrimaryMachines.ts`, `createIntermediateMachine*.ts` |
| Bet state, cost multiplier, balance clamp | `packages/state-shared/src/stateBet.svelte.ts` |
| Replay state (`prepare` / `start` / phase) | `packages/state-shared/src/stateReplay.svelte.ts` |
| Replay UI | `packages/components-ui-pixi/src/components/UIReplay.svelte`, `ButtonReplay.svelte` |
| Per-app resume trigger (skipped in replay) | `apps/<game>/src/components/ResumeBet.svelte` |
