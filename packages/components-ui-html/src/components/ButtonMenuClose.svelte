<script lang="ts">
	import { stateUi } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = false;
	};
</script>

<UiButton label={i18nDerived.menuExit()} {onpress} />
