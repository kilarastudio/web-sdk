<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, Sprite } from 'pixi-svelte';
	import { stateUi } from 'state-shared';
	import { FadeContainer, LoadingProgress } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { ART_PIXEL, LOADING_LOGO } from '../game/constants';
	import { sound } from '../game/sound';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WelcomeScreen from './WelcomeScreen.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// The game opens in three steps, after the Kilara Studio intro: the logo over a loading bar,
	// then the welcome screen with the game's features, then a screen wipe into the game once the
	// player presses.
	let pressed = $state(false);

	// The assets keep loading under the studio intro, so they are often all in by the time it ends.
	// The bar starts filling only once the intro is gone, follows the real progress at most this
	// fast (never ahead of it), and holds a moment when full, so the player always sees it.
	const FILL_MS_PER_PERCENT = 9; // an empty bar fills in 0.9 s
	const FULL_HOLD = 300;
	const loadProgress = $derived(context.stateApp.loaded ? 100 : context.stateApp.loadingProgress);
	const bar = new Tween(0, {
		duration: (from, to) => Math.abs(to - from) * FILL_MS_PER_PERCENT,
	});
	let filled = $state(false);

	$effect(() => {
		if (stateUi.studioIntro !== 'showing') bar.target = loadProgress;
	});

	$effect(() => {
		if (filled || !context.stateApp.loaded || bar.current < 100) return;
		const timeout = setTimeout(() => (filled = true), FULL_HOLD);
		return () => clearTimeout(timeout);
	});

	const stage = $derived(pressed ? 'transition' : filled ? 'welcome' : 'loading');
	// the bar is 120 × 12 art pixels
	const BAR = { width: 120 * ART_PIXEL, height: 12 * ART_PIXEL };

	const start = () => {
		// the press is the player's first gesture, which is what lets the browser play sound
		sound.players.once.play({ name: 'sfx_welcome_start' });
		pressed = true;
	};
</script>

<!-- logo and loading progress -->
<FadeContainer show={stage === 'loading'}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			<Sprite
				key="logo"
				anchor={0.5}
				y={-40}
				width={LOADING_LOGO.width}
				height={LOADING_LOGO.width / LOADING_LOGO.ratio}
			/>
			<LoadingProgress y={140} {...BAR} value={bar.current}>
				{#snippet background(sizes)}
					<Sprite key="loadingTrough" {...sizes} />
				{/snippet}
				{#snippet progress(sizes)}
					<Sprite key="loadingFill" {...sizes} />
				{/snippet}
				{#snippet frame()}{/snippet}
			</LoadingProgress>
		</Container>
	</MainContainer>
</FadeContainer>

<!-- the welcome screen: features, and press to start -->
<FadeContainer show={stage === 'welcome'}>
	<WelcomeScreen />
	{#if stage === 'welcome'}
		<PressToContinue text={context.i18nDerived.pressToStart()} onpress={start} />
	{/if}
</FadeContainer>

<!-- the wipe between the welcome screen and the game -->
{#if stage === 'transition'}
	<TransitionAnimation mode="cover" oncomplete={props.onloaded} />
{/if}
