---
name: stake-engine-frontend
description: Platform rules, RGS contract and approval requirements for building Stake Engine game frontends with this web-sdk (Svelte 5 + PixiJS + SvelteKit monorepo). Use this whenever you work in apps/* or packages/* of this repo — adding or changing book events, emitter events or Storybook stories, building UI controls (bet, autoplay, bonus buy, turbo, sound), touching authenticate/play/end-round/replay calls, bet levels, currency or win formatting, i18n or social-mode text, loaders, fonts, assets, app.html, or preparing/auditing a game for Stake Engine review — even when the user never says "Stake Engine" or "RGS". Skipping it is how games get rejected in review.
---

# Stake Engine frontend

This repo is a fork of the Stake Engine **web-sdk**: a pnpm + Turborepo monorepo where each `apps/<game>` is a SvelteKit static site (Svelte 5 runes, PixiJS 8, XState) and `packages/*` hold the shared SDK. The game talks to Engine's **RGS** (Remote Game Server) for sessions, bets and replays, and every published game passes a human review against Engine's approval guidelines.

Most frontend mistakes here are not TypeScript errors — they compile, render, and still fail review: a bet list that ignores the server, a "$" in front of social coins, an end-round sent for a losing spin, a "BUY" button in social mode. The rules below exist to stop those. When something in the code or in a user request conflicts with them, raise it rather than silently following either.

## Where the truth lives

| Need | Read |
| --- | --- |
| Endpoints, number units, resume, end-round, replay contract | [references/rgs-contract.md](references/rgs-contract.md) |
| Currency formats, sub-cent wins, languages, social-mode wording | [references/currency-and-i18n.md](references/currency-and-i18n.md) |
| Package map, book/emitter event flow, adding a book event, Storybook, commands | [references/sdk-architecture.md](references/sdk-architecture.md) |
| Every reviewer guideline (with IDs) and how to check it in code | [references/review-checklist.md](references/review-checklist.md) |
| Sample-template defaults in *this* repo that fail review today | [references/known-gaps.md](references/known-gaps.md) |

Read the reference that matches the task before editing — they are short and organised by topic. If the workspace has the full documentation archive at `../docs/` (sibling of this repo: Engine Studio pages under `docs/sources/studio/`), prefer it for exact wording; these references are distilled from that snapshot (2026-10-21).

## Rules that get games rejected

Each of these maps to a reviewer guideline. The "why" matters: when a situation isn't covered literally, reason from it.

**RGS and money**
- Build every RGS URL from the `rgs_url` query param (bare host, add `https://`). Never hardcode or fall back to another host — reviewers launch with `rgs_url=example.com` and expect a visible error, not a game that keeps working.
- Keep the three number scales apart: wallet amounts are integers ×1,000,000 (`1000000` = 1.00); book/fixture payouts and SDK book-event amounts are ×100 of the base bet (`1150` = 11.5×); `payoutMultiplier`/`costMultiplier` in wallet and replay responses are plain multipliers. Use `API_AMOUNT_MULTIPLIER` / `BOOK_AMOUNT_MULTIPLIER` from `constants-shared/bet` and the helpers in `utils-shared/amount` — `requestBet` already multiplies, so don't convert twice.
- Wallet amounts must be exact integers: `Math.round(value * API_AMOUNT_MULTIPLIER)`. Float math turns 4.1 into `4099999.9999999995`, which the RGS rejects. Compare money (balance vs cost) in integer API units for the same reason.
- The player is debited `base bet × mode costMultiplier`. Balance checks, confirmations and "real cost" labels must use that product, not the base bet.
- Call `/wallet/end-round` only for a round that is still `active` (a win). A 0× round is closed by the RGS; ending it again is a review failure. Decide from `round.active`, not from animation progress.
- Never send `/wallet/play` when balance < bet × cost — check first (space bar, autoplay and bonus buy included) and tell the player why. Relying on the server's `ERR_IPB` fails review.
- Error responses are not always JSON (replay 404 has an empty body, some 400s are plain text). Check `response.ok` before parsing and surface a readable error.

**Bets**
- `minBet`, `maxBet`, `stepBet`, `defaultBetLevel`, `betLevels` and `config.gameModes` come from `/wallet/authenticate`. Never hardcode a bet list or default; JPY levels differ from USD.
- The selected bet is always one of `betLevels` and within the mode's `maxBet`. Never derive a bet from `balance / cost` or other arithmetic — that produces off-level amounts the RGS rejects. When the player can't afford the level, disable betting and say why.
- If authenticate returns a `round` with `active: true`, resume it and keep `round.amount` and `round.mode` as the selected bet afterwards. Otherwise start on `defaultBetLevel`.
- Any mode costing more than 2× must not bet from a single press: confirm with the cost shown, or arm the mode for the next bet with the new cost clearly displayed. Autoplay always needs a confirmation step.
- Honour `config.jurisdiction` flags (`disabledSpacebar`, `disabledAutoplay`, `disabledBuyFeature`, `disabledTurbo`, …) when you build or change those features.

**Replay** (`?replay=true`, mandatory for new games)
- No session, no wallet calls, no path into normal play. Fetch `GET https://{rgs_url}/bet/replay/{game}/{version}/{mode}/{event}` automatically, then show **Play**; after it finishes show **Play Again** and keep the result visible.
- Apply optional `currency`, `lang`, `amount` (API units) with sane fallbacks, show the bet, the cost multiplier and the real cost (`amount × costMultiplier`), and make it work at Popout S (400×225).

**Player-facing text**
- Every string goes through i18n with English fallback for unknown `lang` codes — no raw keys, `undefined`, `NaN` or placeholders on screen.
- With `social=true`, no restricted word may appear anywhere a player can see it, including the replay, rules, errors, confirmations and mode names. "Bet", "Buy", "Total Bet" and "Paytable" are the classic misses. The full table is in the currency/i18n reference.
- Currency display follows Engine's table (symbol, decimals, placement). Social `XGC`/`XSC`/`XEC` render as `10.00 GC` / `10.00 SC` with no `$`. Wins must show sub-cent amounts exactly; balance may stay at the currency's normal decimals.

**Display, HTML and assets**
- The build must be static and self-contained: no external fonts, CDNs, analytics or remote images at runtime (Engine's CSP blocks them and the console fills with errors). Ship assets in `static/` and reference them via `asset()` from `$app/paths`.
- No Stake Engine loader, logo or splash at any point (launch, reload, replay). Sample SDK art, symbols, animations and audio must be replaced before publishing.
- No page scroll at any size; disable double-tap zoom (`maximum-scale=1, user-scalable=no` in the viewport meta and/or `touch-action`). `width=device-width` alone fails.
- Space bar triggers the bet button (listener on `window`, `preventDefault`), does nothing while a modal or menu is open or mid-animation, and goes through the same balance check as the button.
- A visible control mutes **all** audio. Multi-win rounds count the win up to the final payout. Fast/turbo play must keep wins and symbols legible.

## How to work on common tasks

**Adding or changing a math book event** — follow the step list in [sdk-architecture.md](references/sdk-architecture.md#adding-a-book-event): fixture data and a Storybook story first, then the `BookEvent` type, the handler in `bookEventHandlerMap.ts`, small typed emitter events in the owning component, and finally render the component in `Game.svelte`. Book events play strictly in sequence; never `Promise.all` across events. Await (`broadcastAsync`) anything the next step depends on. Update both base and bonus fixtures if the event appears in both. If the event carries state that must survive a reconnect, register it for the resume snapshot. Every event type math can emit needs a handler — when you touch fixtures, check for types the handler map is missing.

**Building or changing a UI control or bet mode** — check the bet, confirmation, balance, jurisdiction and social-wording rules above for every path the control can take (button, space bar, autoplay, bonus buy, mobile layout, replay UI). If the user asks for something a rule forbids (e.g. a one-click 100× buy), don't silently comply or silently refuse: build the closest compliant version and tell them which guideline forces the change.

**Touching authenticate / play / end-round / replay code** — read [rgs-contract.md](references/rgs-contract.md) first and keep normal play and replay behaviour separate; guard wallet calls with `stateUrlDerived.replay()`.

**Formatting money or writing text** — use `numberToCurrencyString` (bet/balance) and `numberToWinCurrencyString` / `bookEventAmountToCurrencyString` (wins) from `utils-shared/amount`; never `toFixed(2)` or a hardcoded symbol. Route labels through the package's `i18nDerived` with a social variant (pattern: `bet: () => stateUrlDerived.social() ? 'SPIN' : translate('BET')`).

**Auditing a game before submission** — walk [review-checklist.md](references/review-checklist.md) guideline by guideline, start from [known-gaps.md](references/known-gaps.md), and report each with PASS / FAIL / AT RISK / NEEDS A HUMAN plus `file:line` evidence. A guideline fails if *any* path fails (base and bonus, desktop and mobile, normal and replay, social and non-social).

## Repo conventions

- Node 24 (`.nvmrc`), pnpm workspaces (`workspace:*`), Turborepo tasks. Filter to one game: `pnpm run dev --filter=lines`, `pnpm run build --filter=lines`. Storybook: the apps' `storybook` script currently fails ("too many arguments"); from `apps/<game>` run `PUBLIC_CHROMATIC=true pnpm exec storybook dev -p <free port>` (keep `PUBLIC_CHROMATIC` so stories don't post `/bet/event`).
- SvelteKit 3 / Svelte 5: runes (`$state`, `$derived`, `$props`, `$effect`), `asset()` from `$app/paths` for static files, `dev` from `$app/env`. Shared state lives in `packages/state-shared` (`stateBet`, `stateConfig`, `stateUi`, `stateReplay`, `stateUrlDerived`, …).
- Components only receive emitter events while mounted (`subscribeOnMount`). Context (`eventEmitter`, layout, xstate, app) must be set before game components render — Storybook templates do this for you.
- After changing `packages/pixi-svelte`, rebuild it (`pnpm run build --filter=pixi-svelte`); apps consume its build output.
- ESLint 10 flat config at the root (`eslint.config.cjs`); Prettier with tabs. Match the surrounding code style.

## Before you say it's done

1. `pnpm run lint` and `pnpm run build --filter=<game>` pass (run lint/build for any package you touched).
2. For visual or event work: the relevant Storybook story's Action resolves (an unresolved action means a promise/animation never finished), in the default 1200×675 viewport and the `stake mini player` 400×225 preset.
3. Re-read your diff against the rules above for every path you touched: normal and replay, social and non-social, base and bonus mode, desktop and mobile.
4. Say plainly what you could not verify (e.g. no live RGS session, no device test) instead of implying it works.
