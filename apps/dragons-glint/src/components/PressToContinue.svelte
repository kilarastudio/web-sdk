<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateUi } from 'state-shared';
	import GameText from './GameText.svelte';

	import { getContext } from '../game/context';
	import { gameTextStyle } from '../game/typography';

	type Props = {
		// what the prompt says; "press anywhere to continue" unless given
		text?: string;
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const maxWidth = $derived(Math.min(canvas.width - 32, 560) / layout.scale);
	// Use screen pixels for the instruction so portrait layouts keep a readable minimum size.
	const fontSize = $derived(Math.max(14, Math.min(18, canvas.width * 0.013)) / layout.scale);
	// Short landscape screens need the prompt closer to the HUD to clear the panel.
	const bottomGap = $derived(canvas.height < 360 ? 4 : 32);
</script>

<!-- sits on top of the HUD's controls, so they never cover it -->
<MainContainer alignVertical="bottom">
	<GameText
		text={props.text ?? context.i18nDerived.pressToContinue()}
		{maxWidth}
		anchor={{ x: 0.5, y: 1 }}
		x={layout.width * 0.5}
		y={layout.height - (stateUi.hudInset.bottom + bottomGap) / layout.scale}
		style={{
			...gameTextStyle({ fontSize, tone: 'hint', onArt: true }),
			wordWrap: true,
			wordWrapWidth: maxWidth,
			lineHeight: fontSize * 1.35,
		}}
	/>
</MainContainer>
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
