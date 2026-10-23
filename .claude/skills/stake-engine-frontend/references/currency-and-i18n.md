# Currency, languages and social-mode wording

Distilled from Engine Studio docs (RGS → Money, RGS communication, Jurisdiction requirements), snapshot 2026-10-21. Archive copies, if present: `../docs/sources/studio/rgs.md#money`, `approval-guidelines/rgs-communication.md`, `approval-guidelines/jurisdiction-requirements.md`.

## Contents
1. Currency display rules
2. Currency table
3. Sub-cent wins
4. SDK formatters
5. Languages
6. Social mode
7. Restricted phrases

## 1. Currency display rules

- Currency changes **only** the display layer. Bet levels per currency come from authenticate (JPY levels differ from USD).
- Decimals follow ISO 4217 minor units, except IDR (shown without decimals).
- Placement: symbols that are letter codes (`CLP`, `ARS`, `SAR`, `AED`, `TND`, `OMR`, `QAR`, `EGP`, `MAD`) and `kr`, `zł`, `₫`, `CFA`, `GC`, `SC` go **after** the amount with a space (`10.00 AED`). Everything else goes before with no space (`CA$10.00`, `KD10.000`).
- Unknown code returned by the RGS → show the amount followed by the code (`10.00 XYZ`), 2 decimals.
- Social currencies: `XGC → GC`, `XSC → SC`, `XEC → SC`, never prefixed with `$`.
- Reviewers test USD, EUR, CAD, MXN, JPY, and XSC/XGC with `social=true`. Long symbols (`CA$`, `MX$`) must not clip or overlap in balance, bet, win or modal labels.

## 2. Currency table

Engine's helper (`DisplayBalance`) is the reference implementation; `packages/utils-shared/currency.ts` (`CURRENCY_META`, `after: true` = symbol after) must match it exactly.

| Code | Decimals | Example |
| --- | --- | --- |
| USD | 2 | $10.00 |
| CAD | 2 | CA$10.00 |
| JPY | 0 | ¥10 |
| EUR | 2 | €10.00 |
| RUB | 2 | ₽10.00 |
| CNY | 2 | CN¥10.00 |
| PHP | 2 | ₱10.00 |
| INR | 2 | ₹10.00 |
| IDR | 0 | Rp10 |
| KRW | 0 | ₩10 |
| BRL | 2 | R$10.00 |
| MXN | 2 | MX$10.00 |
| DKK | 2 | 10.00 kr |
| PLN | 2 | 10.00 zł |
| VND | 0 | 10 ₫ |
| TRY | 2 | ₺10.00 |
| CLP | 0 | 10 CLP |
| ARS | 2 | 10.00 ARS |
| PEN | 2 | S/10.00 |
| NGN | 2 | ₦10.00 |
| SAR | 2 | 10.00 SAR |
| ILS | 2 | ₪10.00 |
| AED | 2 | 10.00 AED |
| TWD | 2 | NT$10.00 |
| NOK | 2 | 10.00 kr |
| KWD | 3 | KD10.000 |
| JOD | 3 | JD10.000 |
| CRC | 2 | ₡10.00 |
| TND | 3 | 10.000 TND |
| SGD | 2 | SG$10.00 |
| MYR | 2 | RM10.00 |
| OMR | 3 | 10.000 OMR |
| QAR | 2 | 10.00 QAR |
| BHD | 3 | BD10.000 |
| PKR | 2 | ₨10.00 |
| EGP | 2 | 10.00 EGP |
| NZD | 2 | NZ$10.00 |
| BOB | 2 | Bs10.00 |
| GHS | 2 | GH₵10.00 |
| KES | 2 | KSh10.00 |
| MAD | 2 | 10.00 MAD |
| BAM | 2 | KM10.00 |
| ISK | 0 | 10 kr |
| TZS | 2 | TSh10.00 |
| UGX | 0 | USh10 |
| XOF | 0 | 10 CFA |
| XGC | 2 | 10.00 GC |
| XSC | 2 | 10.00 SC |
| XEC | 2 | 10.00 SC |
|  |  |  |

## 3. Sub-cent wins

- New games should support small bets (USD 0.01, 0.02, 0.05, 0.10, …), so wins can be below one cent.
- Minimum win ≥ 0.1× → wins need **3** decimals (`0.1 × 0.01 = 0.001`); minimum win < 0.1× → **4** decimals.
- Displayed wins must match the RGS amount exactly — never round a 0.001 win to `0.00` or up to `0.01`.
- Engine recommends showing the extra precision only when the base bet is below 0.10. The **balance** never needs more than the currency's normal decimals.

## 4. SDK formatters

`packages/utils-shared/amount.ts`:

| Function | Use for |
| --- | --- |
| `numberToCurrencyString(value)` | Balance, bet, cost labels (currency decimals) |
| `numberToWinCurrencyString(value)` | Win amounts (currency decimals, up to 4 when needed) |
| `bookEventAmountToCurrencyString(bookAmount)` | Win amounts straight from book events (÷100 × bet, then win format) |
| `bookEventAmountToNormalisedAmount(bookAmount)` | Converting a book amount to currency units |

Both read `stateBet.currency`. Never format money with `toFixed(2)`, template strings with `$`, or `Intl.NumberFormat` `style: 'currency'` (its symbols and placement differ from Engine's table).

## 5. Languages

English is required; every other language is optional. Unsupported or missing `lang` → English, and a partial translation must fall back to English per key. No raw keys, `undefined`, `NaN`, `{placeholder}` or missing glyphs on screen — including rules and every modal. Localised images/sprites need the same fallback.

Codes Engine may send: `ar, de, en, es, fi, fr, hi, id, ja, ko, pl, pt, ru, tr, zh, vi, da` (the SDK maps `br` → `pt`).

SDK i18n: Lingui (`packages/config-lingui` for the supported `locales`), messages per package under `src/i18n/messagesMap`, accessed through each package's `i18nDerived.ts` (`stateI18nDerived.translate('KEY')`). Apps load messages via `LoadI18n` in `+layout.svelte`.

## 6. Social mode

Active when the URL has `social=true` (Engine also reports `config.jurisdiction.socialCasino`). Engine recommends a separate `sweeps_<lang>` dictionary; the SDK pattern is a social branch in `i18nDerived`:

```ts
bet: () => (stateUrlDerived.social() ? 'SPIN' : stateI18nDerived.translate('BET')),
buyBonus: () => (stateUrlDerived.social() ? 'PLAY BONUS' : stateI18nDerived.translate('BUY BONUS')),
```

- English is the only language in social mode.
- Every player-visible surface counts: buttons, labels, rules/paytable, help, loading screen, popups, confirmations, errors, settings, autoplay menus, text baked into images, mode names, and the replay window.
- Mode names must avoid restricted words ("BONUS BUY", "BUY FEATURE", "SUPER BET" all fail) and be named the same in the game, the replay and the math files.
- Common misses: "Bet" on the main button, "Bet Amount", "Auto Bet", "Number of Bets", "Total Bet", "Buy" on bonus buttons and confirmations, insufficient-funds errors, and **"Paytable" / "Pay table"** (use e.g. "Win table" or "Symbol wins").
- Matching is whole-word and case-insensitive.

## 7. Restricted phrases

| Restricted | Use instead | Restricted | Use instead |
| --- | --- | --- | --- |
| at the cost of | for | gamble | play |
| be awarded to player's accounts | appear in player's accounts | money | coins |
| bet / bets / bet/s | play / plays / play/s | paid | won |
| betting | play / playing | paid out | win |
| bonus buy | bonus / feature | pay | win |
| bought | instantly triggered | pay out | win / won |
| buy | play | payer | winner |
| buy bonus | get bonus | pays | wins |
| cash | coins | pays out | won |
| cost of | can be played for | place your bets | come and play / join in the game |
| credit | balance | purchase | play |
| currency | token | rebet | respin |
| deposit | get coins | stake | play amount |
| fund | balance | total bet | total play |
| withdraw | redeem | wager | play |
| win feature | play feature | | |
