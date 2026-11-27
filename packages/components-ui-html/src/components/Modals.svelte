<script lang="ts">
	import type { Snippet } from 'svelte';

	import ModalError from './ModalError.svelte';
	import ModalBetMenu from './ModalBetMenu.svelte';
	import ModalBuyBonus from './ModalBuyBonus.svelte';
	import ModalBuyBonusConfirm from './ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from './ModalAutoSpin.svelte';
	import type { AutoplayOptions } from '../types';
	import ModalAutoSpinMessage from './ModalAutoSpinMessage.svelte';
	import ModalPayTable from './ModalPayTable.svelte';
	import ModalGameRules from './ModalGameRules.svelte';
	import ModalSettings from './ModalSettings.svelte';
	import ModalReplay from './ModalReplay.svelte';

	type Props = {
		version: Snippet;
		// what the game's paytable and rules modals show, above the version
		payTable?: Snippet;
		gameRules?: Snippet;
		gameRulesSize?: 'medium' | 'large';
		// what the game adds to the autoplay sheet (ModalAutoSpin); nothing keeps it as it was
		autoplay?: AutoplayOptions;
	};

	const props: Props = $props();
</script>

<ModalError />
<ModalBetMenu />
<ModalBuyBonus />
<ModalBuyBonusConfirm keepLimits={props.autoplay?.limitsInModes} />
<ModalAutoSpin options={props.autoplay} />
<ModalAutoSpinMessage />
<ModalPayTable>
	{@render props.payTable?.()}
	{@render props.version()}
</ModalPayTable>
<ModalGameRules size={props.gameRulesSize}>
	{@render props.gameRules?.()}
	{@render props.version()}
</ModalGameRules>
<ModalSettings />
<ModalReplay />
