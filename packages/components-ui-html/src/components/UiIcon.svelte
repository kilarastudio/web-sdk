<script lang="ts" module>
	// Phosphor icons (MIT, phosphoricons.com), bundled with the game: never load icons from a CDN.
	// To switch to the Kilara icon set, change this map; the buttons only know the names.
	import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';
	import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
	import CaretDown from 'phosphor-svelte/lib/CaretDown';
	import GearSix from 'phosphor-svelte/lib/GearSix';
	import Info from 'phosphor-svelte/lib/Info';
	import Lightning from 'phosphor-svelte/lib/Lightning';
	import List from 'phosphor-svelte/lib/List';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Play from 'phosphor-svelte/lib/Play';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Repeat from 'phosphor-svelte/lib/Repeat';
	import SpeakerHigh from 'phosphor-svelte/lib/SpeakerHigh';
	import SpeakerSlash from 'phosphor-svelte/lib/SpeakerSlash';
	import Stop from 'phosphor-svelte/lib/Stop';
	import Table from 'phosphor-svelte/lib/Table';
	import X from 'phosphor-svelte/lib/X';

	const ICONS = {
		spin: ArrowClockwise,
		stop: Stop,
		autoSpin: Repeat,
		turbo: Lightning,
		decrease: Minus,
		increase: Plus,
		menu: List,
		close: X,
		payTable: Table,
		info: Info,
		settings: GearSix,
		soundOn: SpeakerHigh,
		soundOff: SpeakerSlash,
		drawer: CaretDown,
		play: Play,
		playAgain: ArrowCounterClockwise,
	};

	export type UiIconName = keyof typeof ICONS;
	export type UiIconWeight = 'bold' | 'fill';
</script>

<script lang="ts">
	type Props = {
		name: UiIconName;
		weight?: UiIconWeight;
		rotation?: number;
	};

	const { name, weight = 'bold', rotation = 0 }: Props = $props();
	const Icon = $derived(ICONS[name]);
</script>

<!-- decorative: the button around it carries the (translated) label -->
<span class="ui-icon" style:transform={rotation ? `rotate(${rotation}deg)` : undefined}>
	<Icon {weight} size="100%" aria-hidden="true" focusable="false" />
</span>

<style lang="scss">
	.ui-icon {
		display: block;
		width: 1em;
		height: 1em;
		flex-shrink: 0;

		:global(svg) {
			display: block;
		}
	}
</style>
