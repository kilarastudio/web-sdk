export const zIndex = {
	ui: 10,
	// a game's HTML loading screen: over the canvas and the HUD, under every modal (an error shows)
	loader: 40,
	modal: 50,
	dialog: 100,
	info: 150,
	intro: 200,
} as const;
