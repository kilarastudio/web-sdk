<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	import { getContextEventEmitter } from 'utils-event-emitter';
	import { stateModal, stateUi } from 'state-shared';

	import type { EmitterEventHotKey } from '../types';

	const context = getContextEventEmitter<EmitterEventHotKey>();
	const PREVENT_DEFAULT_KEYS = ['Space', 'ArrowUp', 'ArrowDown'];
	const EXCLUDED_TAGS = ['input', 'textarea', 'select'];

	const getValidElement = (e: KeyboardEvent) =>
		!EXCLUDED_TAGS.includes(e?.target?.tagName?.toLowerCase());
	// while a modal, sheet or the HUD menu is open, SPACE does nothing: it must not place a bet
	// behind it. Key-ups still pass, so a SPACE hold that started before ends cleanly.
	const isBlockedBehindOverlay = (key: string) =>
		key === 'Space' && (stateModal.modal !== null || stateUi.menuOpen);

	function handleKeydown(e: KeyboardEvent) {
		if (getValidElement(e)) {
			const isSpace = e.key === ' ';
			const key = isSpace ? 'Space' : e.key;
			if (PREVENT_DEFAULT_KEYS.includes(key)) e.preventDefault();
			if (isBlockedBehindOverlay(key)) return;
			if (key) context.eventEmitter.broadcast({ type: 'hotKey', key, action: 'keyDown' });
		}
	}

	function handleKeyup(e: KeyboardEvent) {
		if (getValidElement(e)) {
			const isSpace = e.key === ' ';
			const key = isSpace ? 'Space' : e.key;
			if (PREVENT_DEFAULT_KEYS.includes(key)) e.preventDefault();
			if (key) context.eventEmitter.broadcast({ type: 'hotKey', key, action: 'keyUp' });
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('keyup', handleKeyup);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('keyup', handleKeyup);
	});
</script>
