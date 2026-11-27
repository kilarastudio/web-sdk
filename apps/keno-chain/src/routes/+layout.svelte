<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle, StudioIntro } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!--
	The Kilara Studio intro. hooks.server.ts writes it into the page to end on time by itself, onto
	the game's HTML loading screen (LoadingScreen), so it waits for nothing.
-->
<StudioIntro />

{@render props.children()}
