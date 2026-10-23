# web-sdk architecture and workflows

Distilled from Engine Studio front-end docs (file structure, flowchart, adding new events, task breakdown, context, Storybook, UI) plus this repo's code, 2026-10. Archive copies, if present: `../docs/sources/studio/front-end/*.md`.

## Contents
1. Package map
2. Event model
3. Adding a book event
4. Resume and progress recording
5. Task breakdown
6. Context
7. Storybook
8. UI packages
9. Commands and build output

## 1. Package map

| Location | Responsibility |
| --- | --- |
| `apps/<game>/src/game/` | `config.ts`, `constants.ts`, `stateGame.svelte.ts`, `typesBookEvent.ts`, `typesEmitterEvent.ts`, `bookEventHandlerMap.ts`, `eventEmitter.ts`, `context.ts`, `utils.ts` (`playBookEvent(s)`, resume conversion), `assets.ts`, `sound.ts` |
| `apps/<game>/src/components/` | Svelte components: visuals, animation, one concern per component (`Game.svelte` composes them) |
| `apps/<game>/src/stories/` | Storybook stories; `data/{base,bonus}_{books,events}.ts` fixtures copied from math output |
| `apps/<game>/src/routes/+layout.svelte` | Entry: context, `Authenticate`, `LoadI18n`, loader, `Game` (`+page.svelte` is empty) |
| `apps/<game>/static/` | Runtime assets (spines, sprites, audio, loader gif) referenced with `asset('…')` |
| `packages/state-shared` | `stateBet`, `stateConfig`, `stateUi`, `stateModal`, `stateMeta`, `stateReplay`, `stateI18n`, `stateUrlDerived` |
| `packages/rgs-fetcher`, `rgs-requests` | Transport + typed request wrappers |
| `packages/utils-book` | `createPlayBookUtils` (sequential playback), `recordBookEvent` |
| `packages/utils-event-emitter` | `createEventEmitter` → `broadcast`, `broadcastAsync`, `subscribeOnMount` |
| `packages/utils-xstate` | Bet lifecycle machines (bet, autoBet, resumeBet) |
| `packages/components-ui-pixi`, `components-ui-html` | Default UI (Pixi) and HTML modals (rules, paytable, buy bonus, settings, autoplay) — examples to restyle |
| `packages/components-shared` | `Authenticate`, `LoadI18n`, hotkeys, loaders |
| `packages/pixi-svelte` | Declarative Svelte components for PixiJS (consumed as a built package) |
| `packages/utils-shared` | `amount.ts`, `currency.ts`, `sequence`, `wait`, … |
| `packages/config-*` | Shared Svelte/Vite/TS/Storybook/Lingui config |

Local packages link with `workspace:*`.

## 2. Event model

```
RGS round.state  /  fixture book.events
  → playBookEvents(bookEvents)            sequential, awaits each event
    → bookEventHandlerMap[event.type]      one handler per book event type
      → eventEmitter.broadcast(...)        fire-and-forget emitter event
      → await eventEmitter.broadcastAsync  wait for components' async handlers
        → component subscribeOnMount({...}) handlers update state / run animations
```

- **Book**: one round's result, a sequence of book events from math.
- **Book event**: `{ index, type, ...payload }` — information math says must be shown.
- **Emitter event**: a small frontend command (`xShow`, `xHide`, `xUpdate`, `xAnimate`) owned by one component.
- Use `broadcastAsync` when the next step must wait (animations, counters); `broadcast` otherwise.
- Never `Promise.all` across book events — order is game logic.
- Missing handler → `console.error('Missing bookEventHandler…')`; every type in the math output needs a handler.

## 3. Adding a book event

Example: math adds `updateGlobalMult { globalMult }` to the BONUS mode of `apps/lines`. Do the steps in this order so you can test as soon as the handler exists.

1. **Fixtures.** Add the event to `src/stories/data/bonus_events.ts` (keyed by type) and to at least one book in `bonus_books.ts`, copying real values from the math output. Do the same for `base_*` if base mode can emit it.
2. **Story.** In `src/stories/ModeBonusBookEvent.stories.svelte` add
   ```svelte
   <Story
   	name="updateGlobalMult"
   	args={templateArgs({
   		skipLoadingScreen: true,
   		data: events.updateGlobalMult,
   		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
   	})}
   	{template}
   />
   ```
3. **Type.** In `src/game/typesBookEvent.ts` add `type BookEventUpdateGlobalMult = { index: number; type: 'updateGlobalMult'; globalMult: number }` and include it in the `BookEvent` union.
4. **Handler.** In `src/game/bookEventHandlerMap.ts` add `updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => { … }` that only orchestrates emitter events (and shared state).
5. **Emitter types.** In the owning component, export them from a module script:
   ```svelte
   <script lang="ts" module>
   	export type EmitterEventGlobalMultiplier =
   		| { type: 'globalMultiplierShow' }
   		| { type: 'globalMultiplierHide' }
   		| { type: 'globalMultiplierUpdate'; multiplier: number };
   </script>
   ```
   and add the union to `EmitterEventGame` in `src/game/typesEmitterEvent.ts` (which feeds `EmitterEvent` in `eventEmitter.ts`).
6. **Subscribe.** In the component: `context.eventEmitter.subscribeOnMount({ globalMultiplierShow: …, globalMultiplierUpdate: async (e) => { … } })`. Return/await promises for anything `broadcastAsync` waits on.
7. **Render.** Mount the component in `Game.svelte` (inside `<App>`); unmounted components receive nothing.
8. **Resume.** If the event carries state that must survive a reconnect mid-bonus (multipliers, counters, totals), add its type to `BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT` in `src/game/utils.ts` and restore it in the `createBonusSnapshot` handler. See section 4.
9. **Money/text.** Win amounts in book events are ×100 of the bet — format with `bookEventAmountToCurrencyString`. Any new label goes through i18n with a social variant.
10. **Test.** Run the single-event story (Action must resolve ✅), then `MODE_BONUS/book/random` until the event appears. If a component is hard to debug, add a props-driven `COMPONENTS/<X>/component` story.

## 4. Resume and progress recording

- In bonus games the handler for each reveal calls `recordBookEvent({ bookEvent })`, which posts `/bet/event` with the event index (skipped in replay and Chromatic). Authenticate later returns it as `round.event`.
- On resume, `convertTorResumableBet` (`apps/<game>/src/game/utils.ts`) keeps book events from `round.event` onward and replaces earlier ones with one synthetic `createBonusSnapshot` event built from the types in `BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT`. A stateful event missing from that list is silently lost on resume.
- Replay does not use this conversion: it plays the full book from event `0`.

## 5. Task breakdown

If an emitter handler does too much, split it. Cluster's `tumbleBoard` book event becomes `tumbleBoardInit → tumbleBoardExplode (await) → tumbleBoardRemoveExploded → tumbleBoardSlideDown (await) → boardSettle → tumbleBoardReset/Hide → boardShow`. Small steps are testable one by one in `COMPONENTS/<Game>/emitterEvent` stories and isolate timing bugs. Different emitter events of one book event may belong to different components.

Stateless games (slots): one RGS request finishes the round. Stateful games (e.g. mines) need several requests — design those flows explicitly.

## 6. Context

Contexts must exist before game components render (`setContext()` in `+layout.svelte` and at the top of every story file):

- `eventEmitter` — the bus between book handlers, UI and components
- layout — sizes, orientation, responsive layout (`stateLayoutDerived`)
- xstate — bet lifecycle (`stateXstateDerived.isIdle()`, etc.)
- app — Pixi application / renderer state

See `apps/<game>/src/game/context.ts`.

## 7. Storybook

From `apps/<game>`: `PUBLIC_CHROMATIC=true pnpm exec storybook dev -p <free port>`. The app's own `storybook` script is currently broken (see known-gaps.md); keep `PUBLIC_CHROMATIC` so stories don't post `/bet/event`.

| Story | Tests |
| --- | --- |
| `COMPONENTS/<Game>/component` | Game with loading screen |
| `COMPONENTS/<Game>/preSpin` | Pre-bet transition |
| `COMPONENTS/<Game>/emitterEvent: <name>` | One emitter event in isolation |
| `COMPONENTS/<Symbol>/component`, `/symbols` | Symbol states via controls |
| `MODE_<MODE>/bookEvent/<type>` | One book event |
| `MODE_<MODE>/book/random` | A full random round from fixtures |

- Viewports: default `stake iframe` 1200×675; also `stake mini player` 400×225 and `stake mini player (expanded)` 800×450 (`packages/config-storybook/src/preview.ts`).
- An Action that never shows "resolved" means a promise or animation never completed.
- Fixtures must track the latest math output, or the stories prove nothing.
- `number-picker` has no stories.

## 8. UI packages

`<UI>` (components-ui-pixi) renders the default UI, or `UIReplay` when `stateUi.config.mode === 'replay'` (set by `Authenticate`). `<Modals>` (components-ui-html) renders buy bonus, rules, paytable, settings, autoplay. They are deliberately plain examples — restyle or replace them, but keep their behaviours (confirmations, social text, sound toggle, bet menu from server levels). Social text lives in each package's `src/i18n/i18nDerived.ts`.

## 9. Commands and build output

```sh
pnpm install
pnpm run dev --filter=lines          # needs RGS launch params for normal play; use Storybook otherwise
(cd apps/lines && PUBLIC_CHROMATIC=true pnpm exec storybook dev -p 6001)
pnpm run build --filter=lines        # static site in apps/lines/build (adapter-static, inline bundle)
pnpm run build --filter=pixi-svelte  # after editing packages/pixi-svelte
pnpm run lint
```

The old README flow of assembling `.svelte-kit/output` by hand is obsolete; `apps/<game>/build` is the upload artifact.
