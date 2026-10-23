<script lang="ts">
	import { stateSound } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();
	const label = $derived(
		stateSound.volumeValueMaster === 0 ? i18nDerived.soundOff() : i18nDerived.soundOn(),
	);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (stateSound.volumeValueMaster === 0) {
			stateSound.volumeValueMaster = 50;
		} else {
			stateSound.volumeValueMaster = 0;
		}
	};
</script>

<UiButton {label} {onpress} variant="light" size="large" />
