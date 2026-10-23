<script lang="ts">
	import type { Snippet } from 'svelte';

	import { EnableSpaceHold } from 'components-shared';

	import UiFadeContainer from './UiFadeContainer.svelte';
	import UiHeader from './UiHeader.svelte';
	import LayoutDesktop from './LayoutDesktop.svelte';
	import LayoutPortrait from './LayoutPortrait.svelte';
	import LayoutLandscape from './LayoutLandscape.svelte';
	import LayoutTablet from './LayoutTablet.svelte';
	import { getContext } from '../context';

	type Props = {
		gameName: Snippet;
		logo?: Snippet;
	};

	const props: Props = $props();
	const context = getContext();

	const LAYOUT_COMPONENT_MAP = {
		desktop: LayoutDesktop,
		portrait: LayoutPortrait,
		landscape: LayoutLandscape,
		tablet: LayoutTablet,
	};

	const LayoutComponent = $derived(LAYOUT_COMPONENT_MAP[context.stateLayoutDerived.layoutType()]);
</script>

<EnableSpaceHold />

<UiFadeContainer>
	<UiHeader gameName={props.gameName} logo={props.logo} />
	<LayoutComponent />
</UiFadeContainer>
