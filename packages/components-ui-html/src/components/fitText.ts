// Shrinks the labels inside an element until they fit its width, so long amounts (weak currencies,
// large wins) are never cut off and never run into the controls beside them. The element must get
// its width from the layout (a flex or grid slot with min-width: 0, or a max-width), not from its
// text. The scale goes to --ui-fit, which UiLabel multiplies its font size by; every label inside
// shrinks by the same amount so they stay alike. With `height`, the text must also fit the box's
// height (a max-height), for wrapping labels such as the buy bonus badge. It is worked out again
// whenever the element's size or text changes.

// below half size an amount stops being readable; past that it may overflow. A place with very
// little room (a mode card in the mini player) may allow less, as its other text is small too.
const SMALLEST = 0.5;

export const fitText = (
	node: HTMLElement,
	options: { smallest?: number; items?: string; height?: boolean } = {},
) => {
	const smallest = options.smallest ?? SMALLEST;
	// with `items`, every matching element inside must fit, and all of them share the one scale
	// set on the node (so a row of cards shows its prices alike); without it, the node itself
	const boxes = () =>
		options.items ? [...node.querySelectorAll<HTMLElement>(options.items)] : [node];
	let frame = 0;

	// only text past the box's max-height counts: the glyphs of a tight line-height always reach a
	// little past their line box, which would otherwise shrink a label that already fits
	const heightRatio = (box: HTMLElement) => {
		const style = getComputedStyle(box);
		const max = parseFloat(style.maxHeight);
		if (Number.isNaN(max)) return 1;
		const slack = parseFloat(style.fontSize) * 0.25;
		return box.scrollHeight <= max + slack ? 1 : max / box.scrollHeight;
	};

	const fits = () =>
		boxes().every((box) => box.scrollWidth <= box.clientWidth + 0.5 && heightRatio(box) === 1);

	const fit = () => {
		frame = 0;
		node.style.setProperty('--ui-fit', '1');

		// a few rounds, because gaps and padding do not shrink with the text
		let scale = 1;
		for (let round = 0; round < 4; round++) {
			const ratio = Math.min(
				1,
				...boxes().map((box) => box.clientWidth / Math.max(1, box.scrollWidth)),
				...(options.height ? boxes().map(heightRatio) : []),
			);
			if (ratio >= 0.999 || scale === smallest) break;

			scale = Math.max(smallest, scale * ratio);
			node.style.setProperty('--ui-fit', `${scale}`);
		}

		// wrapping text does not shrink in proportion (three lines may become two at a much
		// larger size than the ratio says), so search for the largest scale that still fits
		if (options.height && scale < 1) {
			let low = scale;
			let high = 1;
			for (let step = 0; step < 6; step++) {
				const mid = (low + high) / 2;
				node.style.setProperty('--ui-fit', `${mid}`);
				if (fits()) low = mid;
				else high = mid;
			}
			node.style.setProperty('--ui-fit', `${low}`);
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
