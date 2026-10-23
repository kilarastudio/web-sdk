<script lang="ts">
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateReplay, stateReplayDerived } from 'state-shared';
	import { getContext } from '../context';

	type Props = Partial<Omit<ButtonProps, 'children' | 'onpress' | 'sizes'>>;
	const props: Props = $props();
	const context = getContext();
	const sizes = { width: 320, height: 100 };
	const disabled = $derived(
		!stateReplay.bet || stateReplay.phase === 'playing' || !context.stateXstateDerived.isIdle(),
	);
	const label = $derived(
		stateReplay.phase === 'ready'
			? 'PLAY'
			: stateReplay.phase === 'playing'
				? 'PLAYING'
				: 'PLAY AGAIN',
	);

	const onpress = () => {
		if (disabled || !stateReplayDerived.start()) return;
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};
</script>

<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center })}
		<Rectangle {...sizes} backgroundColor={disabled ? 0x555555 : 0x000000} />
		<Container {...center}>
			<Text anchor={0.5} text={label} style={{ fill: 0xffffff, fontSize: 36, fontWeight: '600' }} />
		</Container>
	{/snippet}
</Button>
