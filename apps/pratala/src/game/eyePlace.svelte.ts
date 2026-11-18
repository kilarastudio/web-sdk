// Where the dragon's eye in its breach stands on the canvas, in canvas px, set by the background
// (components/Background.svelte) as the layout changes: screens drawn over the hall without the
// board (the welcome screen) keep their content clear of it, so the eye shows as it does in play.
export const eyePlace = $state({ top: 0, bottom: 0 });
