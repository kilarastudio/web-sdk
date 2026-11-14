<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'MODE_BASE/bookEvent',
	});
</script>

<script lang="ts">
	import {
		StoryGameTemplate,
		StoryLocale,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBookEvent } from '../game/utils';
	import { eventEmitter } from '../game/eventEmitter';
	import events from './data/base_events';

	setContext();
</script>

{#snippet template(args: TemplateArgs<any>)}
	<StoryGameTemplate
		skipLoadingScreen={args.skipLoadingScreen}
		action={async () => {
			await args.action?.(args.data);
		}}
	>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
{/snippet}

<Story
	name="reveal"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.reveal,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="setTotalWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.setTotalWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="freeSpinTrigger"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.freeSpinTrigger,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="freeSpinRetrigger"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.freeSpinRetrigger,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="updateFreeSpin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.updateFreeSpin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="winInfo"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.winInfo,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="updateTumbleWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.updateTumbleWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!-- the tumble win's fire is as big as the win: from 0.08 to 1,000 bets, then a small win again -->
<Story
	name="tumbleWinFire"
	args={templateArgs({
		skipLoadingScreen: true,
		data: [8, 30, 100, 300, 1000, 3000, 10000, 30000, 100000, 0, 8],
		action: async (amounts: number[]) => {
			for (const amount of amounts) {
				if (amount === 0) eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
				else await playBookEvent({ index: 0, type: 'updateTumbleWin', amount }, { bookEvents: [] });
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		},
	})}
	{template}
/>

<Story
	name="tumbleBoard"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.tumbleBoard,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="updateGlint"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.updateGlint,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="glintStrike"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.glintStrike,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="setWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.setWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!-- a big win that climbs to BIG: what the hall does at each level it passes -->
<Story
	name="setWin BIG"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { ...events.setWin, amount: 1500 },
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!-- a big win that climbs to SUPER: what the hall does at each level it passes -->
<Story
	name="setWin SUPER"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { ...events.setWin, amount: 5000 },
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!-- a big win that climbs to MEGA: what the hall does at each level it passes -->
<Story
	name="setWin MEGA"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { ...events.setWin, amount: 20000 },
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!-- a big win that climbs to EPIC: what the hall does at each level it passes -->
<Story
	name="setWin EPIC"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { ...events.setWin, amount: 150000 },
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<!-- a big win that climbs to MAX: what the hall does at each level it passes -->
<Story
	name="setWin MAX"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { ...events.setWin, amount: 2500000 },
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="freeSpinEnd"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.freeSpinEnd,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="wincap"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.wincap,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>

<Story
	name="finalWin"
	args={templateArgs({
		skipLoadingScreen: true,
		data: events.finalWin,
		action: async (data) => await playBookEvent(data, { bookEvents: [] }),
	})}
	{template}
/>
