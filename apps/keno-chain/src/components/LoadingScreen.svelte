<script lang="ts">
	import { OnHotkey } from 'components-shared';
	import { GameLoader } from 'components-ui-html';
	import { stateI18nDerived } from 'state-shared';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import { isPremium, levelPicks, type Level } from '../game/keno';
	import { LEVEL_LABELS } from '../game/betModeMeta';
	import { loaderHtml } from '../game/loader';
	import { sound } from '../game/sound';

	// The game opens in three steps, after the Kilara Studio intro: the loading screen (HTML, already
	// in the page from the server; GameLoader carries its bar on and fades it out when it is full),
	// then this welcome screen, the first to stand on the game's navy: the name, the most a round
	// of the 1× game can win, and the three things that make the game, each drawn with the board's
	// own tiles. A press anywhere, or Space, opens the game.
	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const t = stateI18nDerived.translate;

	let filled = $state(false);
	let pressed = $state(false);

	const basic = config.levels.filter((level) => !isPremium(level as Level)) as Level[];
	const sizes = levelPicks(basic[0]);
	const topWin = Math.max(
		...Object.values(config.betModes)
			.filter((mode) => !isPremium(mode.level as Level))
			.map((mode) => mode.maxWin),
	);
	const topMultiplier = config.ladder[config.ladder.length - 1];

	const start = () => {
		if (!filled || pressed) return;
		pressed = true;
		// the press is the player's first gesture, which is what lets the browser play sound
		sound.press();
		setTimeout(() => props.onloaded(), 220);
	};
</script>

<GameLoader
	html={loaderHtml()}
	progress={context.stateApp.loadingProgress}
	loaded={context.stateApp.loaded}
	onend={() => (filled = true)}
/>

{#if filled}
	<button type="button" class="welcome" class:leaving={pressed} data-test="welcome" onclick={start}>
		<span class="column">
			<span class="logo" aria-label="Keno Chain">KENO<span>CHAIN</span></span>
			<span class="top">
				{t('WIN UP TO {amount}', { amount: stateI18nDerived.times(topWin) })}
			</span>

			<span class="features">
				<span class="feature">
					<span class="art" aria-hidden="true">
						<i></i><i class="pick"></i><i></i><i class="pick"></i><i class="pick"></i><i></i>
					</span>
					<span class="title">{t('PICK YOUR NUMBERS')}</span>
					<span class="text">
						{t('Play {min} to {max} numbers at the risk you choose: {levels}.', {
							min: sizes[0],
							max: sizes[sizes.length - 1],
							levels: basic.map((level) => LEVEL_LABELS[level]).join(', '),
						})}
					</span>
				</span>
				<span class="feature">
					<span class="art chain" aria-hidden="true">
						<i class="hit"></i><i class="hit"></i><i class="hit"></i>
						<b></b><b></b><b></b>
					</span>
					<span class="title">{t('CHAIN YOUR HITS')}</span>
					<span class="text">
						{t('Hits in a row raise the multiplier, up to {top}.', {
							top: `×${topMultiplier}`,
						})}
					</span>
				</span>
				<span class="feature">
					<span class="art" aria-hidden="true">
						<i class="hit"></i><i class="lucky"><u></u></i><i class="hit"></i>
					</span>
					<span class="title">{t('LUCKY NUMBERS')}</span>
					<span class="text">
						{t('A lucky ball adds a streak level and never breaks the chain.')}
					</span>
				</span>
			</span>

			<span class="prompt">{t('PRESS TO START')}</span>
		</span>
	</button>
	<OnHotkey hotkey="Space" onpress={start} />
{/if}

<style lang="scss">
	.welcome {
		--u: min(calc(100vw / 34), calc(100dvh / 66), 18px);
		--tile: #28344c;
		--tile-lip: #171f2f;

		position: fixed;
		inset: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		padding: calc(var(--u) * 2);
		border: 0;
		background: #0e1422;
		color: #f3f5fb;
		font: inherit;
		font-size: var(--u);
		line-height: 1.4;
		text-align: center;
		cursor: pointer;
		user-select: none;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		transition: opacity 0.22s ease-out;

		&.leaving {
			opacity: 0;
			pointer-events: none;
		}
	}

	.column,
	.features,
	.feature {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.logo {
		font-size: 4.6em;
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0.02em;
		white-space: nowrap;

		span {
			margin-left: 0.18em;
			color: #ffc93c;
		}
	}

	.top {
		margin-top: 1em;
		padding: 0.35em 0.9em;
		background: #2a2210;
		box-shadow: inset 0 0 0 0.1em #4a3a0c;
		color: #ffc93c;
		font-size: 1.5em;
		font-weight: 700;
		letter-spacing: 0.06em;
	}

	.features {
		gap: 2.4em;
		margin: 3.4em 0 3.6em;
	}

	.feature {
		max-width: 30em;
	}

	.art {
		position: relative;
		display: flex;
		align-items: flex-end;
		gap: 0.45em;
		height: 2.5em;
		margin-bottom: 1em;

		i {
			position: relative;
			display: block;
			width: 2.5em;
			height: 2.2em;
			background: var(--tile);
			box-shadow: 0 0.3em 0 var(--tile-lip);
		}

		.pick {
			background: #9b87ff;
			box-shadow: 0 0.3em 0 #6450d6;
		}

		.hit {
			background: #3fe082;
			box-shadow: 0 0.3em 0 #1c9f55;
		}

		.lucky {
			background: #ffcf45;
			box-shadow: 0 0.3em 0 #c2850a;

			/* the lucky number's token: a flat octagon, as on the board */
			u {
				position: absolute;
				top: 50%;
				left: 50%;
				width: 1.1em;
				height: 1.1em;
				background: #2e2100;
				clip-path: polygon(29.3% 0, 70.7% 0, 100% 29.3%, 100% 70.7%, 70.7% 100%, 29.3% 100%, 0 70.7%, 0 29.3%);
				transform: translate(-50%, -50%);
			}
		}

		/* the chain: gold links that join each hit to the next, and the stairs they climb */
		&.chain {
			i:nth-of-type(2)::before,
			i:nth-of-type(3)::before {
				content: '';
				position: absolute;
				top: 50%;
				left: -0.75em;
				width: 1.05em;
				height: 0.36em;
				background: #ffc93c;
				transform: translateY(-50%);
				z-index: 1;
			}

			b {
				display: block;
				width: 0.9em;
				margin-left: -0.25em;
				background: #ffc93c;

				&:nth-of-type(1) {
					height: 0.8em;
					margin-left: 0.5em;
				}

				&:nth-of-type(2) {
					height: 1.6em;
				}

				&:nth-of-type(3) {
					height: 2.4em;
				}
			}
		}
	}

	.title {
		font-size: 1.6em;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	.text {
		margin-top: 0.25em;
		color: #95a3bc;
		font-size: 1.4em;
	}

	.prompt {
		color: #95a3bc;
		font-size: 1.5em;
		font-weight: 600;
		letter-spacing: 0.12em;
		animation: prompt 1.6s ease-in-out infinite;
	}

	@keyframes prompt {
		50% {
			opacity: 0.45;
		}
	}

	/* wide screens (the same ones the game lays out wide): the three features side by side */
	@media (min-aspect-ratio: 27 / 20) {
		.welcome {
			--u: min(calc(100vw / 104), calc(100dvh / 46), 18px);
		}

		.features {
			flex-direction: row;
			align-items: flex-start;
			gap: 3em;
		}

		.feature {
			width: 28em;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.prompt {
			animation: none;
		}
	}
</style>
