<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
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

	// The game opens in three steps: the logo over a loading bar, then the welcome screen with the
	// game's features, then a screen wipe into the game once the player presses.
	let pressed = $state(false);
	const stage = $derived(pressed ? 'transition' : context.stateApp.loaded ? 'welcome' : 'loading');
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
			<LoadingProgress y={140} {...BAR}>
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
