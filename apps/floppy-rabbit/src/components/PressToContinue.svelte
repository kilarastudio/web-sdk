<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateI18nDerived } from 'state-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { FONT, GREY } from '../game/constants';

	type Props = {
		onpress: () => void;
		// false: a press is taken without the words being shown (skipping a small win's count)
		label?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
</script>

{#if props.label ?? true}
	<MainContainer alignVertical="bottom">
		<Text
			anchor={{ x: 0.5, y: 1 }}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height - 150}
			text={stateI18nDerived.translate('PRESS TO CONTINUE')}
			style={{ fontFamily: FONT, fontSize: 34, fontWeight: '600', fill: GREY.muted }}
		/>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
