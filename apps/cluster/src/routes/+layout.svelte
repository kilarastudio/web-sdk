<script lang="ts">
	import { asset } from '$app/paths';
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, Loader, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	const loaderUrl = asset('loader.gif');

	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!-- Replace static/loader.gif with the studio loader. Never show a Stake Engine loader or logo. -->
<Loader src={loaderUrl} />

{@render props.children()}
