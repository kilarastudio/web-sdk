<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'COMPONENTS/<ModalError>' });
</script>

<script lang="ts">
	import { ModalError } from 'components-ui-html';
	import { stateModal } from 'state-shared';

	// the shapes that reach stateModal.modal.error in the SDK
	const ERRORS = {
		balance: { error: 'ERR_IPB', message: 'Insufficient player balance' },
		limit: { error: 'ERR_GLE', message: 'Gambling limits exceeded' },
		busy: { error: 'ERR_ACT', message: 'Draw temporarily unavailable' },
		session: { error: 'ERR_VAL', message: 'Invalid session' },
		connection: new TypeError('Failed to fetch'),
		general: { error: 'Empty state in data.round', message: '{"data":{"round":null}}' },
	} as const;

	type Kind = keyof typeof ERRORS;

	const show = (kind: Kind) => (stateModal.modal = { name: 'error', error: ERRORS[kind] });
	// opens the story's error once it mounts (a state change can't happen during render)
	const open = (_node: HTMLElement, kind: string) => show(kind as Kind);
</script>

{#snippet switcher()}
	<div class="switcher">
		{#each Object.keys(ERRORS) as kind}
			<button onclick={() => show(kind as Kind)}>{kind}</button>
		{/each}
	</div>
{/snippet}

<Story name="balance">
	<div class="game" use:open={'balance'}></div>
	<ModalError />
	{@render switcher()}
</Story>

<Story name="limit">
	<div class="game" use:open={'limit'}></div>
	<ModalError />
	{@render switcher()}
</Story>

<Story name="busy">
	<div class="game" use:open={'busy'}></div>
	<ModalError />
	{@render switcher()}
</Story>

<Story name="session">
	<div class="game" use:open={'session'}></div>
	<ModalError />
	{@render switcher()}
</Story>

<Story name="connection">
	<div class="game" use:open={'connection'}></div>
	<ModalError />
	{@render switcher()}
</Story>

<Story name="general">
	<div class="game" use:open={'general'}></div>
	<ModalError />
	{@render switcher()}
</Story>

<style>
	/* a stand-in for game art behind the scrim */
	.game {
		position: fixed;
		inset: 0;
		background:
			radial-gradient(circle at 30% 40%, #2b4c7e, transparent 60%),
			radial-gradient(circle at 75% 65%, #7e4a2b, transparent 55%), #0e1014;
	}

	.switcher {
		position: fixed;
		left: 8px;
		top: 8px;
		z-index: 1000;
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.switcher button {
		padding: 6px 10px;
		border: none;
		background: #1a1d24;
		color: #f3f4f6;
		font: 600 11px sans-serif;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
	}
</style>
