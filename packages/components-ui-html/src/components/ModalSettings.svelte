<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateSound } from 'state-shared';

	import UiSheet from './UiSheet.svelte';
	import UiSheetSection from './UiSheetSection.svelte';
	import UiSlider from './UiSlider.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
</script>

<!-- sound: one level for everything, and one each for music and effects -->
{#if stateModal.modal?.name === 'settings'}
	<UiSheet
		title={i18nDerived.settings()}
		size="small"
		zIndex={zIndex.modal}
		onclose={() => (stateModal.modal = null)}
	>
		<UiSheetSection label={i18nDerived.masterVolume()}>
			<UiSlider label={i18nDerived.masterVolume()} bind:value={stateSound.volumeValueMaster} />
		</UiSheetSection>

		<UiSheetSection label={i18nDerived.musicVolume()}>
			<UiSlider label={i18nDerived.musicVolume()} bind:value={stateSound.volumeValueMusic} />
		</UiSheetSection>

		<UiSheetSection label={i18nDerived.soundEffectVolume()}>
			<UiSlider
				label={i18nDerived.soundEffectVolume()}
				bind:value={stateSound.volumeValueSoundEffect}
			/>
		</UiSheetSection>
	</UiSheet>
{/if}
