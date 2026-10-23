# Review checklist

What Engine reviewers check, with the guideline IDs they use in feedback, and how to check each one in this codebase. Distilled from the Studio approval guidelines and Engine's published AI-review prompt (https://studio.engine.io/docs/ai-review; archive copy, if present: `../docs/sources/studio/assets/docs-content/prompt.md` — use it verbatim for a full formal audit).

## Contents
1. How to audit
2. Pre-checks
3. Compliance
4. Bet levels
5. Currency
6. RGS requests
7. Front end
8. Game rules
9. Responsive
10. Language
11. Social mode
12. Replay
13. Also causes rejections
14. Runtime checks (interceptions)
15. Report format

## 1. How to audit

- Stay read-only until the user asks for fixes.
- Every verdict needs evidence: `file:line`, the exact player-facing text, or a network observation.
- Verdicts: **PASS** (positive evidence), **FAIL** (evidence it's broken), **AT RISK** (suspect or unconfirmed — say what would settle it), **NEEDS A HUMAN** (art, layout feel, sound fully off — give a short checklist), **N/A** (feature absent — say how you know).
- A guideline fails if any path fails: base and bonus, desktop and mobile, normal play and replay, main UI and menus, social and non-social.
- Don't guess a PASS. A wrong PASS costs a review round; AT RISK is the honest answer when you couldn't confirm.

## 2. Pre-checks

| ID | Guideline | Check |
| --- | --- | --- |
| 181 | Authenticates on launch against `rgs_url` with the URL `sessionID` | Host only from `stateUrlDerived.rgsUrl()`; grep for hardcoded `http(s)://` RGS/dev hosts |
| 274 | Invalid `rgs_url` shows a connection/auth error | `rgs_url=example.com` → visible error, not endless spinner or normal load |
| 183 | Bet sends `/wallet/play` `{sessionID, amount, mode}` and plays the round | `requestBet` + bet machine |
| 275 | No Stake Engine loader/logo at any point (launch, reload, replay) | grep `stake engine`, `stake-engine`, `stakeengine`, `powered by stake`, `LoaderStakeEngine`, `stake-engine-loader` |

## 3. Compliance

| ID | Guideline | Check |
| --- | --- | --- |
| 213 | Title unique, no restricted terms | No Megaways, XWays, Enhanced, Boosted (or synonyms), RTP/percentages, "Gates of…", "…Bonanza", Olympus, Rush, Kraken, Waylanders, or implied ties to other publishers. Check code title, HTML `<title>`, logo text, loading screen |
| 217 | No offensive content, no imagery of minors | NEEDS A HUMAN unless images can be viewed |
| 253 | Distinct from existing games | NEEDS A HUMAN (title, logo, characters, theme, mechanic, presentation) |

## 4. Bet levels

| ID | Guideline | Check |
| --- | --- | --- |
| 242 | `minBet`, `maxBet`, `stepBet`, `defaultBetLevel`, `betLevels` all from authenticate; opens on default; steps only through levels; stops at both ends | `Authenticate.svelte` → `stateConfig`; bet menu and +/- use server levels; no hardcoded list/default; no free-entry field |
| 187 | Active round restores `round.amount` (and mode); it stays selected after the resumed round | Follow `round.active` in `Authenticate.svelte`; nothing later resets to default |

## 5. Currency

| ID | Guideline | Check |
| --- | --- | --- |
| 219 | USD, EUR, CAD, MXN, JPY load, bet and display correctly in balance, bet, win, modals; no clipping of `CA$`/`MX$` | `utils-shared/amount.ts` + `currency.ts` against the Engine table; no `$` literals, no fixed 2 decimals |
| 273 | Sub-cent payouts show exactly (no `0.00`, no rounding up) | Win formatter precision vs minimum win |

## 6. RGS requests

| ID | Guideline | Check |
| --- | --- | --- |
| 221 | No end-round for 0× rounds; winning rounds do end | End-round conditional on `round.active` (or payout > 0) in `createPrimaryMachines.ts` |
| 222 | No `/wallet/play` when balance < bet × cost; player is told why | Pre-bet check for button, space bar, autoplay, bonus buy, using the mode's cost multiplier |

## 7. Front end

| ID | Guideline | Check |
| --- | --- | --- |
| 228 | Space bar = bet button; `preventDefault`; listener on `window`/`document`; harmless in menus/mid-animation; respects `disabledSpacebar` | `components-shared/EnableHotkey.svelte`, `EnableSpaceHold.svelte` |
| 227 | No scrolling at any size | `html, body { margin:0; overflow:hidden; height:100% }` or equivalent; canvas fits viewport |
| 104 | Autoplay needs a confirmation step (panel/menu) | `ModalAutoSpin` flow; one press never starts auto-betting |
| 31 | Modes costing > 2× need confirmation stating the cost, or arm-for-next-bet with cost clearly shown | Every mode with cost > 2 traced from its button to the play call (`ModalBuyBonus`, `ModalBuyBonusConfirm`) |
| 107 | A visible control mutes **all** audio (effects, music, ambience, bonus, big win) | Every sound goes through the sound state; nothing bypasses mute |

## 8. Game rules (info/help screens, `lang=en`)

| ID | Guideline | Check |
| --- | --- | --- |
| 25 | RTP and max win stated, per mode where they differ; match math | Compare with `index.json` + lookup tables if available |
| 24 | Every paying symbol's payouts listed | Paytable vs math |
| 26 | How wins form (lines, ways, clusters, scatters, tumbles, multipliers) | Rules text vs actual payment logic |
| 27 | Every non-base mode described with its cost | Every `index.json` mode present; costs match |
| 29 | Free games: triggers, awards per trigger, retriggers | N/A only if no free games |
| 235 | Every control explained (bet, +/-, autoplay, turbo, bonus buy, sound, settings, info, fullscreen, menu, game-specific) | Diff UI buttons vs the guide |
| 185 | General disclaimer present (malfunction voids, connection required, reload to finish rounds, expected return over many plays, illustrative display, settlement by RGS amount) | Missing entirely = FAIL; missing points = AT RISK |
| 266 | Displayed chances (e.g. Mystery Mode) match math | N/A if no such feature |

## 9. Responsive

| ID | Guideline | Check |
| --- | --- | --- |
| 193 / 195 / 194 | Laptop 1024×576, Popout S 400×225 and L 800×450, mobile 425×812 (touch, `device=mobile`): loads, all controls visible and reachable, no overlap, readable, can bet | Layout code for minimum-size assumptions; screenshots if runnable (usually NEEDS A HUMAN for final look) |
| 223 | Double-tap zoom disabled on mobile | Viewport meta with `maximum-scale=1, user-scalable=no` and/or `touch-action: none`/`manipulation`. `width=device-width` alone FAILS |

## 10. Language

| ID | Guideline | Check |
| --- | --- | --- |
| 239 | English everywhere with `lang=en`; no keys, `undefined`, `NaN`, `{placeholder}`, missing glyphs | Rules and every modal |
| 240 | Unsupported `lang` (e.g. `zz`) falls back to English cleanly, per key too | `stateUrlDerived.lang()` + i18n loader + localised sprites |

## 11. Social mode (`social=true`)

| ID | Guideline | Check |
| --- | --- | --- |
| 77 | All text uses social wording | Diff social string set against the restricted table (see currency-and-i18n.md); find strings that bypass the social switch (hardcoded labels, text in images, mode names shown raw). Report all words in one finding |
| 78 | `XSC`/`XGC` load and bet; amounts read `10.00 SC` / `10.00 GC`; no `$` anywhere | |
| 225 | Mode names avoid restricted words and match across game, rules, replay, math | |
| 188 | Replay has no restricted words | Open replay with `social=true&currency=XSC` |

## 12. Replay

| ID | Guideline | Check |
| --- | --- | --- |
| 171 | Replay URL loads automatically, calls `GET /bet/replay/…`, **no** wallet calls, shows Play, plays exactly, leaves result, hides/disables betting, no way into normal play, fetch failure shows an error | `Authenticate.handleReplay`, `stateReplay`, `UIReplay`, machine guards |
| 172 | `currency`, `lang`, `amount` applied; missing/invalid don't break; a bet amount is shown | e.g. `currency=EUR&lang=fr&amount=5000000` → €5.00 |
| 173 | Play Again restarts the same event | `ButtonReplay` phase handling, including after an error |
| 174 | Bet, multiplier and real cost (`amount × costMultiplier`) shown | `UIReplay` labels |
| 243 | Works and fits at Popout S 400×225 | |

## 13. Also causes rejections

- Build loads anything from external hosts (Google Fonts, Typekit, CDNs, analytics, S3 images). Search the built `apps/<game>/build` for `http://`/`https://` that aren't the RGS.
- Displayed win ≠ `bet × payoutMultiplier` or disagrees with the paytable.
- Console errors during launch, play or replay; game information logged to the console.
- Sample SDK art, symbols, animations or audio still in the game.
- More than 20 modes without an Engine exception.

## 14. Runtime checks (interceptions)

With a real Studio session URL (preferred) or a local mock RGS serving real books, reproduce reviewer tests with Playwright `page.route()`:

| To test | Do |
| --- | --- |
| 242 dynamic bet config | Rewrite authenticate: short `betLevels` (e.g. 1.00–2.00 in 4 steps), matching min/max, default in the middle. Game opens on that default and stays within the levels |
| 187 active round | Win at a non-default stake, abort its end-round, reload. Relaunch shows/bets `round.amount` |
| 221 zero-win | Bet until 0×, bet again; no end-round between them |
| 222 insufficient balance | Balance 0 in authenticate/balance responses; try to bet; no `/wallet/play` leaves the browser; message shown |
| 274 invalid host | `rgs_url=example.com`; visible error |
| 104 / 31 confirmations | Abort `/wallet/play`; press autoplay once, bonus buy once; neither sends a play |

Viewports: 1024×576, 400×225, 800×450, 425×812 (touch). Never place more bets than a check needs; never leave autoplay running. Ask before installing Playwright or browsers.

## 15. Report format

1. Summary line of verdict counts, and whether the game was run or only read.
2. FAIL then AT RISK items: `[id] title — verdict`, **Found:** evidence, **Fix:** concrete change and file.
3. Full table in checklist order: ID | Guideline | Verdict | Evidence.
4. NEEDS A HUMAN checklist (screen, size, what to look for).
5. Offer to fix FAIL items one guideline at a time, re-checking after each.
