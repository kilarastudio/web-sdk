// Shrinks the labels inside an element until they fit its width, so long amounts (weak currencies,
// large wins) are never cut off and never run into the controls beside them. The element must get
// its width from the layout (a flex or grid slot with min-width: 0, or a max-width), not from its
// text. The scale goes to --ui-fit, which UiLabel multiplies its font size by; every label inside
// shrinks by the same amount so they stay alike. It is worked out again whenever the element's
// size or text changes.

// below half size an amount stops being readable; past that it may overflow. A place with very
// little room (a mode card in the mini player) may allow less, as its other text is small too.
const SMALLEST = 0.5;

export const fitText = (node: HTMLElement, options: { smallest?: number; items?: string } = {}) => {
	const smallest = options.smallest ?? SMALLEST;
	// with `items`, every matching element inside must fit, and all of them share the one scale
	// set on the node (so a row of cards shows its prices alike); without it, the node itself
	const boxes = () =>
		options.items ? [...node.querySelectorAll<HTMLElement>(options.items)] : [node];
	let frame = 0;

	const fit = () => {
		frame = 0;
		node.style.setProperty('--ui-fit', '1');

		// a few rounds, because gaps and padding do not shrink with the text
		let scale = 1;
		for (let round = 0; round < 4; round++) {
			const ratio = Math.min(
				1,
				...boxes().map((box) => box.clientWidth / Math.max(1, box.scrollWidth)),
			);
			if (ratio >= 0.999 || scale === smallest) break;

			scale = Math.max(smallest, scale * ratio);
			node.style.setProperty('--ui-fit', `${scale}`);
		}
	};

	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(fit);
	};

	const resize = new ResizeObserver(schedule);
	const text = new MutationObserver(schedule);
	resize.observe(node);
	text.observe(node, { subtree: true, childList: true, characterData: true });
	fit();

	return {
		destroy() {
			cancelAnimationFrame(frame);
			resize.disconnect();
			text.disconnect();
		},
	};
};
