<script lang="ts">
	import { stateI18nDerived } from 'state-shared';

	import config from '../game/config';

	// The multiplier ladder as the game's own meter draws it (StreakMeter): seven blocks, each
	// taller and a lighter gold, here with every step filled and its level written under it.
	const t = stateI18nDerived.translate;
	const GOLD = ['#5f4a12', '#7d6014', '#9c7917', '#bb921c', '#d9aa24', '#f0bc30', '#ffc93c'];
	const last = config.ladder.length - 1;
</script>

<figure class="stairs">
	<ol>
		{#each config.ladder as step, index}
			<li>
				<b
					style:--i={index}
					style:background-color={GOLD[index]}
					style:color={index < 3 ? '#ffe9a8' : '#2e2100'}>×{step}</b
				>
				<span>{index + 1}{index === last ? '+' : ''}</span>
			</li>
		{/each}
	</ol>
	<figcaption>{t('STREAK LEVEL')}</figcaption>
</figure>

<style lang="scss">
	.stairs {
		margin: 0;
	}

	ol {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 2px;
		align-items: end;
		max-width: 520px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-variant-numeric: tabular-nums;
	}

	li {
		display: flex;
		flex-direction: column;
		text-align: center;
	}

	b {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: calc(2em + 0.5em * var(--i));
		padding-bottom: 0.25em;
		font-size: 1.07em;
		font-weight: 700;
		line-height: 1.2;
	}

	span {
		padding-top: 0.35em;
		color: var(--ui-text-muted);
		font-size: 0.87em;
		font-weight: 600;
	}

	figcaption {
		max-width: 520px;
		padding-top: 0.1em;
		color: var(--ui-text-muted);
		font-size: 0.73em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-align: center;
	}
</style>
