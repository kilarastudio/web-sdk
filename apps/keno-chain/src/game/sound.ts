import { stateSoundDerived } from 'state-shared';

// The game's sounds are made here, not loaded: short tones from the browser's own synth. A hit's
// tone climbs a scale with the meter, so a chain is heard as well as seen. They follow the
// player's sound settings (master and effects volume) and start with the first press.
let audio: AudioContext | null = null;

const tone = (
	frequency: number,
	duration: number,
	gain: number,
	type: OscillatorType = 'triangle',
	delay = 0,
) => {
	const volume = stateSoundDerived.volumeSoundEffect();
	if (volume <= 0) return;
	try {
		audio = audio ?? new AudioContext();
		if (audio.state === 'suspended') void audio.resume();
		const start = audio.currentTime + delay;
		const oscillator = audio.createOscillator();
		const envelope = audio.createGain();
		oscillator.type = type;
		oscillator.frequency.value = frequency;
		envelope.gain.setValueAtTime(0, start);
		envelope.gain.linearRampToValueAtTime(gain * volume, start + 0.006);
		envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(envelope).connect(audio.destination);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.02);
	} catch {
		// no audio here: the game plays without it
	}
};

const SCALE = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3, 10 / 3, 4];

export const sound = {
	press: () => tone(660, 0.05, 0.07, 'sine'),
	miss: () => tone(150, 0.07, 0.09, 'sine'),
	// level: the meter's level after the hit
	hit: (level: number) => {
		const frequency = 440 * SCALE[Math.min(Math.max(level, 1), SCALE.length) - 1];
		tone(frequency, 0.16, 0.17);
		tone(frequency * 2, 0.1, 0.05, 'sine');
	},
	lucky: () => {
		tone(1318, 0.14, 0.1, 'sine');
		tone(1760, 0.22, 0.1, 'sine', 0.07);
	},
	// size: 1 to 3, the notes of the rising figure grow with the win
	win: (size: number) =>
		[0, 1, 2, 3, 4]
			.slice(0, 2 + size)
			.forEach((i) => tone(523 * SCALE[i * 2], 0.22, 0.13, 'triangle', i * 0.075)),
};
