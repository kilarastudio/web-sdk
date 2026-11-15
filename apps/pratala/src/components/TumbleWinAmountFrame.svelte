<script lang="ts" module>
	import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

	// The tumble win has no panel: its amount stands in a bed of fire that burns on the board
	// frame's top edge. Sizes in the board's units, measured up from the fire's foot; the bed's
	// own in art pixels.
	export const TUMBLE_WIN = { width: 300, amount: 30, label: 70 };

	// The fire is as big as the win, and it is a different fire at each size, drawn at the game's
	// own pixel size and never stretched: a win under a tenth of the bet burns as a low line of
	// short, even flames, and each tenfold makes the bed longer, its flames taller and the burning
	// wilder, up to a blaze as wide as the board at 1,000 bets. It grows as the tumbles pay and
	// is low again at the next spin's first small win. Sizes in art pixels.
	const FIRE = {
		steps: 8,
		length: [56, 240],
		depth: [9, 78],
		wild: [0.7, 2],
	};
	export const tumbleFire = (amount: number) => {
		const bets = amount / BOOK_AMOUNT_MULTIPLIER;
		const size = bets > 0 ? Math.min(1, Math.max(0, (Math.log10(bets) + 1) / 4)) : 0;
		const step = Math.round(size * FIRE.steps) / FIRE.steps;
		const at = ([from, to]: number[]) => from + (to - from) * step;

		return {
			length: Math.round(at(FIRE.length) / 2) * 2,
			depth: Math.round(at(FIRE.depth)),
			wild: Math.round(at(FIRE.wild) * 100) / 100,
		};
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import GameText from './GameText.svelte';
	import FireBed from './FireBed.svelte';
	import { getContext } from '../game/context';
	import { panelTextStyle, type PanelFace } from '../game/panels';

	type Props = {
		lit: boolean;
		// the tumble win so far, in book amounts: the fire leaps each time it grows
		amount: number;
		children: Snippet<[{ face: PanelFace }]>;
	};

	const props: Props = $props();
	const context = getContext();
	const face = { x: 0, y: -TUMBLE_WIN.amount, width: TUMBLE_WIN.width, height: 50 };
</script>

<!-- every win of a spin's tumbles feeds the fire -->
<FireBed {...tumbleFire(props.amount)} lit={props.lit} flare={props.amount} />
{@render props.children({ face })}
<GameText
	anchor={0.5}
	y={-TUMBLE_WIN.label}
	text={context.i18nDerived.tumbleWin()}
	style={{
		...panelTextStyle({ fontSize: 22, tone: 'label' }),
		stroke: { color: 0x10171d, width: 4 },
	}}
	maxWidth={TUMBLE_WIN.width}
/>
