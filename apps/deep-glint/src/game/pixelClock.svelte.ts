// A shared ten-frames-a-second clock for ambient pixel animation (pulses, loops), so
// everything that idles steps together instead of each piece running its own smooth tween.
export const PIXEL_FRAME_MS = 100;

export const pixelClock = $state({ frame: 0 });

if (typeof window !== 'undefined') setInterval(() => (pixelClock.frame += 1), PIXEL_FRAME_MS);
