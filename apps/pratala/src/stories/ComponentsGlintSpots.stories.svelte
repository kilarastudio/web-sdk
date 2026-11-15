<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'COMPONENTS/<GlintSpots>' });
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import {
		StoryGameTemplate,
		StoryLocale,
		templateArgs,
		type TemplateArgs,
	} from 'components-storybook';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { emptyGlint, stateGame } from '../game/stateGame.svelte';
	import { glintChanges } from '../game/glint';
	import { playBookEvent } from '../game/utils';
	import { eventEmitter } from '../game/eventEmitter';
	import type { GlintCellPosition } from '../game/glint';

	setContext();
	type Sample = { turbo: boolean; spots: GlintCellPosition[] };
	const sample = async ({ turbo, spots }: Sample) => {
		const previousTurbo = stateBet.isTurbo;
		stateBet.isTurbo = turbo;
		try {
			stateGame.glint = emptyGlint();
			await tick();
			const primed = emptyGlint();
			spots.forEach(({ reel, row }) => (primed[reel][row] = 1));
			await playBookEvent({ index: 0, type: 'updateGlint', glint: primed }, { bookEvents: [] });
			await waitForTimeout(turbo ? 250 : 500);
			const lit = emptyGlint();
			spots.forEach(({ reel, row }) => (lit[reel][row] = 2));
			await playBookEvent({ index: 1, type: 'updateGlint', glint: lit }, { bookEvents: [] });
		} finally {
			stateBet.isTurbo = previousTurbo;
		}
	};
	const center = [{ reel: 2, row: 2 }];
	const progression = async ({ turbo }: Sample) => {
		const previousTurbo = stateBet.isTurbo;
		stateBet.isTurbo = turbo;
		try {
			stateGame.glint = emptyGlint();
			await tick();
			for (const value of [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]) {
				const glint = emptyGlint();
				[1, 2, 3, 4].forEach((reel) => (glint[reel][2] = value));
				await playBookEvent({ index: 0, type: 'updateGlint', glint }, { bookEvents: [] });
				await waitForTimeout(turbo ? 150 : 300);
			}
		} finally {
			stateBet.isTurbo = previousTurbo;
		}
	};
</script>

{#snippet template(args: TemplateArgs<Sample>)}
	<StoryGameTemplate
		skipLoadingScreen={true}
		action={async () => {
			await args.action?.(args.data);
		}}
	>
		<StoryLocale lang="en"><Game /></StoryLocale>
	</StoryGameTemplate>
{/snippet}

<Story
	name="applyAndReset"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			const glint = emptyGlint();
			glint[1][2] = 4;
			glint[2][2] = 16;
			glint[3][2] = 8;
			stateGame.glint = glint;
			await tick();
			await waitForTimeout(600);
			await playBookEvent(
				{
					index: 0,
					type: 'winInfo',
					totalWin: 1600,
					wins: [
						{
							symbol: 'L1',
							win: 1600,
							positions: [
								{ reel: 1, row: 3 },
								{ reel: 2, row: 3 },
								{ reel: 3, row: 3 },
							],
							meta: {
								globalMult: 1,
								clusterMult: 16,
								winWithoutMult: 100,
								overlay: { reel: 3, row: 2 },
							},
						},
					],
				},
				{ bookEvents: [] },
			);
			await waitForTimeout(500);
			await eventEmitter.broadcastAsync({ type: 'glintResetShow' });
			stateGame.glint = emptyGlint();
		},
	})}
	{template}
/>

<Story
	name="superStart"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			stateGame.glint = emptyGlint();
			await tick();
			await waitForTimeout(300);
			const lit = emptyGlint().map((column) => column.map(() => 8));
			const spots = glintChanges(stateGame.glint, lit);
			stateGame.glint = lit;
			await eventEmitter.broadcastAsync({ type: 'glintAnimateShow', spots });
		},
	})}
	{template}
/>

<Story
	name="prime"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			stateGame.glint = emptyGlint();
			await tick();
			const glint = emptyGlint();
			[{ reel: 0, row: 0 }, ...center, { reel: 5, row: 4 }].forEach(
				({ reel, row }) => (glint[reel][row] = 1),
			);
			await playBookEvent({ index: 0, type: 'updateGlint', glint }, { bookEvents: [] });
		},
	})}
	{template}
/>

<Story
	name="light"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: sample,
	})}
	{template}
/>
<Story
	name="lightTurbo"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: true, spots: center },
		action: sample,
	})}
	{template}
/>
<Story
	name="lightMultiple"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: [{ reel: 0, row: 0 }, ...center, { reel: 5, row: 4 }] },
		action: sample,
	})}
	{template}
/>
<Story
	name="tierComparison"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			const glint = emptyGlint();
			[1, 2, 16, 128, 1024, 4096].forEach((value, reel) => (glint[reel][2] = value));
			stateGame.glint = glint;
			await tick();
		},
	})}
	{template}
/>

<Story
	name="tierOneFullBoard"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			stateGame.glint = emptyGlint().map((column, reel) =>
				column.map((_, row) => ((reel + row) % 2 === 0 ? 2 : 4)),
			);
			await tick();
		},
	})}
	{template}
/>

<Story
	name="allTiers"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
			stateGame.glint = emptyGlint().map((column, reel) =>
				column.map((_, row) => values[(row * 6 + reel) % values.length]),
			);
			await tick();
		},
	})}
	{template}
/>
<Story
	name="progression"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: progression,
	})}
	{template}
/>
<Story
	name="progressionTurbo"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: true, spots: center },
		action: progression,
	})}
	{template}
/>
<Story
	name="maxFullBoard"
	args={templateArgs({
		skipLoadingScreen: true,
		data: { turbo: false, spots: center },
		action: async () => {
			stateGame.glint = emptyGlint().map((column) => column.map(() => 4096));
			await tick();
		},
	})}
	{template}
/>
