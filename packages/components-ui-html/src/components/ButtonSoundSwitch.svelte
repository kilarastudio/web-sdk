<script lang="ts">
	import { stateSound } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const context = getContext();
	const silent = $derived(stateSound.volumeValueMaster === 0);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (stateSound.volumeValueMaster === 0) {
			stateSound.volumeValueMaster = 50;
		} else {
			stateSound.volumeValueMaster = 0;
		}
	};
</script>

<UiButton
	kind="row"
	label={i18nDerived.audio()}
	icon={silent ? 'soundOff' : 'soundOn'}
	active={!silent}
	toggle
	{onpress}
>
	<span class="switch" class:on={!silent} aria-hidden="true"></span>
</UiButton>

<style lang="scss">
	.switch {
		position: relative;
		width: 2.1em;
		height: 1.2em;
		margin-left: auto;
		border-radius: 999px;
		background-color: var(--ui-disabled-bg);
		transition: background-color 0.2s;

		&::after {
			content: '';
			position: absolute;
			top: 0.15em;
			left: 0.15em;
			width: 0.9em;
			height: 0.9em;
			border-radius: 50%;
			background-color: var(--ui-text);
			transition: transform 0.2s;
		}

		&.on {
			background-color: var(--ui-accent);

			&::after {
				transform: translateX(0.9em);
			}
		}
	}
</style>
