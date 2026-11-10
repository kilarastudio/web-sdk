<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle, StudioIntro } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { stateApp } from '../game/stateApp';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	// the preloaded assets (loader, progress bar) are in, so the loading screen can draw
	const loadingScreenReady = $derived(Object.keys(stateApp.loadedAssets).length > 0);

	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!-- The Kilara Studio intro. Never show a Stake Engine loader or logo. -->
<StudioIntro ready={loadingScreenReady} />

{@render props.children()}
