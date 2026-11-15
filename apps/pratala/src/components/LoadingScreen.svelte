<script lang="ts">
	import { FadeContainer } from 'components-pixi';
	import { GameLoader } from 'components-ui-html';

	import { getContext } from '../game/context';
	import { loaderHtml } from '../game/loader';
	import { sound } from '../game/sound';
	import PressToContinue from './PressToContinue.svelte';
	import WelcomeScreen from './WelcomeScreen.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// The game opens in three steps, after the Kilara Studio intro: the loading screen, then the
	// welcome screen with the game's features, which stands in the hall itself and leaves it
	// once the player presses, so the game opens in the same hall with nothing covering it. The loading screen is HTML (game/loader.ts), already in the page from the server, so
	// it shows the moment the intro ends; GameLoader carries its bar on with the assets' progress
	// and fades it out over the welcome screen when it is full.
	let pressed = $state(false);
	let filled = $state(false);

	const stage = $derived(pressed ? 'leaving' : filled ? 'welcome' : 'loading');

	const start = () => {
		// the press is the player's first gesture, which is what lets the browser play sound
		sound.players.once.play({ name: 'sfx_welcome_start' });
		pressed = true;
	};
</script>

<GameLoader
	html={loaderHtml()}
	progress={context.stateApp.loadingProgress}
	loaded={context.stateApp.loaded}
	onend={() => (filled = true)}
/>

<!-- the welcome screen: features, and press to start -->
<FadeContainer
	show={stage === 'welcome'}
	duration={320}
	oncomplete={() => pressed && props.onloaded()}
>
	<WelcomeScreen />
	{#if stage === 'welcome'}
		<PressToContinue text={context.i18nDerived.pressToStart()} onpress={start} />
	{/if}
</FadeContainer>
