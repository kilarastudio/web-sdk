<script lang="ts">
	import { type Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { GlobalStyle, StudioIntro } from 'components-ui-html';
	import { Authenticate, LoadI18n } from 'components-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	setContext();

	// the dev server's page for looking at the symbols' animations: the game's address with ?symbols
	const gallery = dev && new URLSearchParams(location.search).has('symbols');
</script>

<GlobalStyle>
	{#if gallery}
		{#await import('../dev/SymbolGallery.svelte') then { default: SymbolGallery }}
			<LoadI18n {messagesMap}>
				<SymbolGallery />
			</LoadI18n>
		{/await}
	{:else}
		<Authenticate>
			<LoadI18n {messagesMap}>
				<Game />
			</LoadI18n>
		</Authenticate>
	{/if}
</GlobalStyle>

<!--
	The Kilara Studio intro. Never show a Stake Engine loader or logo. hooks.server.ts writes it into
	the page to end on time by itself, onto the game's HTML loading screen (LoadingScreen), so it
	waits for nothing.
-->
<StudioIntro />

{@render props.children()}
