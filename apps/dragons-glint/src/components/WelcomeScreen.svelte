<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import config from '../game/config';
	import { LOADING_LOGO, SYMBOL_SIZE } from '../game/constants';
	import { panelLayout, panelTextStyle } from '../game/panels';
	import GameText from './GameText.svelte';
	import Panel from './Panel.svelte';

	// The welcome screen: the title, the top prize, and the game's three features, each with a
	// picture, so a player knows what to hope for before the first spin.
	const context = getContext();
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// cards side by side where the screen is wide, stacked as rows where it is not
	const wide = $derived(canvas.width >= canvas.height * 1.2);
	// The screen is laid out in a design box of game units, then scaled to fit the canvas with
	// room left at the bottom for the prompt.
	const design = $derived(wide ? { width: 1260, height: 720 } : { width: 800, height: 1240 });
	const fit = $derived.by(() => {
		const prompt = Math.min(90, canvas.height * 0.14);
		const scale = Math.min(
			(canvas.width - 24) / design.width,
			(canvas.height - prompt - 12) / design.height,
		);

		return {
			scale,
			x: (canvas.width - design.width * scale) / 2,
			y: Math.max(6, (canvas.height - prompt - design.height * scale) / 2),
		};
	});
	const main = $derived(design);

	const maxWin = `${config.betModes.base.max_win.toLocaleString('en-US')}×`;
	const features = $derived([
		{
			art: 'spots' as const,
			title: context.i18nDerived.welcomeSpotsTitle(),
			text: context.i18nDerived.welcomeSpotsText(),
		},
		{
			art: 'modeBoost' as const,
			title: context.i18nDerived.welcomeStrikeTitle(),
			text: context.i18nDerived.welcomeStrikeText(),
		},
		{
			art: 'modeBonus' as const,
			title: context.i18nDerived.welcomeFreeSpinsTitle(),
			text: context.i18nDerived.welcomeFreeSpinsText(),
		},
	]);

	const layout = $derived.by(() => {
		if (wide) {
			const card = panelLayout({ key: 'welcomeCard', scale: 1 }).sizes;
			const gap = 28;
			const logoWidth = 330;
			const top = 16;
			const logoHeight = logoWidth / LOADING_LOGO.ratio;
			const cardsY = top + logoHeight + 62 + card.height / 2;

			return {
				key: 'welcomeCard' as const,
				scale: 1,
				logo: { width: logoWidth, height: logoHeight, y: top + logoHeight / 2 },
				tagline: { y: top + logoHeight + 30, fontSize: 34 },
				cards: features.map((_, index) => ({
					x: main.width / 2 + (index - 1) * (card.width + gap),
					y: cardsY,
				})),
			};
		}
		const scale = Math.min(
			1,
			(main.width - 40) / panelLayout({ key: 'welcomeRow', scale: 1 }).sizes.width,
		);
		const row = panelLayout({ key: 'welcomeRow', scale }).sizes;
		const logoWidth = 440;
		const logoHeight = logoWidth / LOADING_LOGO.ratio;
		const top = 10;
		const first = top + logoHeight + 96 + row.height / 2;
		const room = main.height - first - row.height / 2;
		const step = Math.min(row.height + 34, room / 2);

		return {
			key: 'welcomeRow' as const,
			scale,
			logo: { width: logoWidth, height: logoHeight, y: top + logoHeight / 2 },
			tagline: { y: top + logoHeight + 40, fontSize: 38 },
			cards: features.map((_, index) => ({ x: main.width / 2, y: first + index * step })),
		};
	});
</script>

{#snippet picture(art: 'spots' | 'modeBoost' | 'modeBonus', size: number)}
	{#if art === 'spots'}
		<!-- three lit spots, rare to mythic, with what they multiply by -->
		{#each [{ tile: 'glintTile1', value: '×2' }, { tile: 'glintTile3', value: '×32' }, { tile: 'glintTile4', value: '×256' }] as spot, index}
			<Container x={(index - 1) * size * 0.34} y={(index - 1) * -size * 0.16}>
				<Sprite key={spot.tile} anchor={0.5} width={size * 0.42} height={size * 0.42} />
				<GameText
					anchor={0.5}
					text={spot.value}
					style={panelTextStyle({ fontSize: Math.max(22, size * 0.15), tone: 'value' })}
					maxWidth={size * 0.36}
				/>
			</Container>
		{/each}
	{:else}
		<Sprite key={art} anchor={0.5} width={size} height={size} />
	{/if}
{/snippet}

<Container x={fit.x} y={fit.y} scale={fit.scale}>
	<Sprite
		key="logo"
		anchor={0.5}
		x={main.width / 2}
		y={layout.logo.y}
		width={layout.logo.width}
		height={layout.logo.height}
	/>
	<GameText
		anchor={0.5}
		x={main.width / 2}
		y={layout.tagline.y}
		text={context.i18nDerived.welcomeMaxWin(maxWin)}
		style={panelTextStyle({ fontSize: layout.tagline.fontSize, tone: 'value' })}
		maxWidth={main.width * 0.9}
	/>

	{#each features as feature, index}
		<Container x={layout.cards[index].x} y={layout.cards[index].y}>
			<Panel key={layout.key} scale={layout.scale}>
				{#snippet children({ face })}
					{#if wide}
						<Container y={-face.height * 0.24}>
							{@render picture(feature.art, SYMBOL_SIZE * 1.5)}
						</Container>
						<GameText
							anchor={0.5}
							y={face.height * 0.13}
							text={feature.title}
							style={panelTextStyle({ fontSize: 26, tone: 'value' })}
							maxWidth={face.width}
						/>
						<GameText
							anchor={{ x: 0.5, y: 0 }}
							y={face.height * 0.22}
							text={feature.text}
							style={{
								...panelTextStyle({ fontSize: 17, tone: 'hint' }),
								wordWrap: true,
								wordWrapWidth: face.width,
								lineHeight: 22,
							}}
						/>
					{:else}
						<Container x={-face.width * 0.37}>
							{@render picture(feature.art, face.height * 0.92)}
						</Container>
						<GameText
							anchor={{ x: 0, y: 0.5 }}
							x={-face.width * 0.2}
							y={-face.height * 0.3}
							text={feature.title}
							style={{
								...panelTextStyle({ fontSize: 40 * layout.scale, tone: 'value' }),
								align: 'left',
							}}
							maxWidth={face.width * 0.7}
						/>
						<GameText
							anchor={{ x: 0, y: 0 }}
							x={-face.width * 0.2}
							y={-face.height * 0.1}
							text={feature.text}
							style={{
								...panelTextStyle({ fontSize: 27 * layout.scale, tone: 'hint' }),
								align: 'left',
								wordWrap: true,
								wordWrapWidth: face.width * 0.7,
								lineHeight: 34 * layout.scale,
							}}
						/>
					{/if}
				{/snippet}
			</Panel>
		</Container>
	{/each}
</Container>
