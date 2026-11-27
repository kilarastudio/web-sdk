import { stateSoundDerived } from 'state-shared';

// The game's sounds are made here, not loaded: one small instrument played by the browser's own
// synth, so every sound starts on the frame of the animation it belongs to.
//
// The design (2026-11-27, the user asked for sounds that fit the animations and reward the
// player):
// - One key. Every pitched sound is a note of C major pentatonic, so whatever a round plays, in
//   any order and overlap, is in tune with itself: a round is heard as one phrase.
// - Two voices. A mallet (a wooden bar: warm, short) is the player's own numbers: picking them
//   and hitting them. A bell (a metal bar: bright, ringing) is gold: lucky numbers, the meter's
//   steps and wins.
// - A chain is a melody. Each hit in a run plays the next note up the scale and rings a little
//   brighter than the one before; a miss is a soft low thud on the key's root, and the next hit
//   starts from the bottom again. A hit that raises the multiplier adds a bell a fifth above.
// - A win finishes the phrase: the notes of the chord climb as the card comes in, more notes and
//   more weight the larger the win. A win below the round's cost has no sound: a loss is not
//   celebrated.
// - An echo one beat of the draw long (150 ms) and a short room hold the notes together.
// They follow the player's sound settings (master and effects volume) and start with the first
// press.

const ROOT = 261.63; // C4
const SCALE = [0, 2, 4, 7, 9];
// the note a number of steps up the scale from C5: 0 is C5, 1 D5, 2 E5, 3 G5, 4 A5, 5 C6 …
const step = (index: number) => {
	const i = Math.max(0, Math.min(index, 11));
	return ROOT * 2 ** ((12 + SCALE[i % 5] + 12 * Math.floor(i / 5)) / 12);
};
const note = (semitones: number) => ROOT * 2 ** (semitones / 12);

// the beat of the draw, which the echo repeats on
const BEAT = 0.15;

// Everything a context needs to play the game's sounds. Times are seconds from now: `at` lets a
// sound be placed ahead (and lets a whole round be rendered offline, to check its levels).
export const createKit = (context: BaseAudioContext, volume: () => number) => {
	const out = context.createGain();
	// many notes may sound at once (a fast draw, a win over the last hits): the limiter keeps the
	// sum from clipping
	const limiter = context.createDynamicsCompressor();
	limiter.threshold.value = -9;
	limiter.knee.value = 6;
	limiter.ratio.value = 10;
	limiter.attack.value = 0.002;
	limiter.release.value = 0.12;
	out.connect(limiter).connect(context.destination);

	// the echo: one repeat a beat later, a fainter one after it
	const echo = context.createDelay(0.5);
	echo.delayTime.value = BEAT;
	const echoTone = context.createBiquadFilter();
	echoTone.type = 'lowpass';
	echoTone.frequency.value = 2800;
	const echoBack = context.createGain();
	echoBack.gain.value = 0.26;
	echo.connect(echoTone);
	echoTone.connect(echoBack).connect(echo);
	echoTone.connect(out);

	// the room: a short tail made from decaying noise (its own fixed sequence, the same every time)
	const room = context.createConvolver();
	const tail = context.createBuffer(2, Math.floor(context.sampleRate * 0.9), context.sampleRate);
	let seed = 20261127;
	const random = () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 0xffffffff;
	};
	for (let channel = 0; channel < 2; channel += 1) {
		const data = tail.getChannelData(channel);
		for (let i = 0; i < data.length; i += 1) {
			data[i] = (random() * 2 - 1) * (1 - i / data.length) ** 3.2;
		}
	}
	room.buffer = tail;
	const roomOut = context.createGain();
	roomOut.gain.value = 0.5;
	room.connect(roomOut).connect(out);

	// where a voice goes: straight out, and how much of it into the echo and the room
	const bus = (echoSend: number, roomSend: number) => {
		const input = context.createGain();
		input.connect(out);
		if (echoSend) {
			const send = context.createGain();
			send.gain.value = echoSend;
			input.connect(send).connect(echo);
		}
		if (roomSend) {
			const send = context.createGain();
			send.gain.value = roomSend;
			input.connect(send).connect(room);
		}
		return input;
	};
	const dry = bus(0, 0.04);
	const soft = bus(0, 0.14);
	const bright = bus(0.22, 0.2);

	const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
	const noiseData = noise.getChannelData(0);
	for (let i = 0; i < noiseData.length; i += 1) noiseData[i] = random() * 2 - 1;

	const now = (at: number) => {
		out.gain.setTargetAtTime(volume(), context.currentTime, 0.01);
		return context.currentTime + Math.max(0, at);
	};

	// one partial: a tone that swells in `attack` and dies away in `decay`
	const partial = (
		to: AudioNode,
		t: number,
		frequency: number,
		peak: number,
		decay: number,
		{ attack = 0.004, type = 'sine' as OscillatorType, glide = 0 } = {},
	) => {
		const oscillator = context.createOscillator();
		const envelope = context.createGain();
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequency, t);
		if (glide) oscillator.frequency.exponentialRampToValueAtTime(glide, t + decay * 0.6);
		envelope.gain.setValueAtTime(0.0001, t);
		envelope.gain.linearRampToValueAtTime(peak, t + attack);
		envelope.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
		oscillator.connect(envelope).connect(to);
		oscillator.start(t);
		oscillator.stop(t + attack + decay + 0.03);
	};

	// a burst of noise through a filter: the strike of a mallet, the body of a thud, a breath of air
	const burst = (
		to: AudioNode,
		t: number,
		peak: number,
		decay: number,
		filter: { type: BiquadFilterType; from: number; to?: number; q?: number },
		attack = 0.002,
	) => {
		const source = context.createBufferSource();
		const shape = context.createBiquadFilter();
		const envelope = context.createGain();
		source.buffer = noise;
		source.loop = true;
		shape.type = filter.type;
		shape.Q.value = filter.q ?? 0.7;
		shape.frequency.setValueAtTime(filter.from, t);
		if (filter.to) shape.frequency.exponentialRampToValueAtTime(filter.to, t + attack + decay);
		envelope.gain.setValueAtTime(0.0001, t);
		envelope.gain.linearRampToValueAtTime(peak, t + attack);
		envelope.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
		source.connect(shape).connect(envelope).connect(to);
		source.start(t, random() * 0.5);
		source.stop(t + attack + decay + 0.03);
	};

	// the mallet: a wooden bar. Its fundamental, the bar's own high partial that dies at once, a
	// little body an octave up, and the strike.
	const mallet = (to: AudioNode, t: number, frequency: number, level: number, decay: number) => {
		partial(to, t, frequency, level, decay);
		partial(to, t, frequency * 4, level * 0.2, decay * 0.22);
		partial(to, t, frequency * 2, level * 0.1, decay * 0.5, { type: 'triangle' });
		burst(to, t, level * 0.22, 0.012, { type: 'highpass', from: 2400 });
	};

	// the bell: a metal bar, whose partials are not a harmonic series (1, 2.76, 5.4), which is what
	// makes it ring
	const bell = (to: AudioNode, t: number, frequency: number, level: number, decay: number) => {
		partial(to, t, frequency, level, decay);
		partial(to, t, frequency * 2.76, level * 0.34, decay * 0.55);
		partial(to, t, frequency * 5.4, level * 0.14, decay * 0.3);
	};

	// A dull low knock on the key's root: a tile sinks. A phone's speaker plays almost nothing
	// under 200 Hz, so the knock also has a short note at middle C, which is what a phone gives.
	const thud = (t: number, level: number) => {
		partial(dry, t, note(-12), level, 0.11, { glide: note(-24), attack: 0.003 });
		partial(dry, t, note(0), level * 0.4, 0.05, { glide: note(-7), type: 'triangle' });
		burst(dry, t, level * 0.45, 0.035, { type: 'lowpass', from: 520 });
	};

	// a small dry click: a button
	const tick = (t: number, level: number) => {
		burst(dry, t, level, 0.014, { type: 'bandpass', from: 3200, q: 1.2 });
		partial(dry, t, 1760, level * 0.4, 0.02);
	};

	return {
		// a button of the controls
		press: (at = 0) => tick(now(at), 0.1),

		// A number is picked: the next note up the scale, softly, so filling the board is a little
		// rising tune. count: how many numbers are picked after the press.
		pick: (count: number, at = 0) => mallet(soft, now(at), step(count - 1), 0.11, 0.13),
		// A number is freed: the note it had, an octave lower and duller.
		unpick: (count: number, at = 0) => mallet(dry, now(at), step(count) / 2, 0.08, 0.09),
		// Random Pick shows its numbers one after another: a quick run up the scale.
		deal: (index: number, at = 0) => mallet(soft, now(at), step(index), 0.06, 0.07),
		// a press that did nothing (the board is full, numbers are missing): two low notes down
		deny: (at = 0) => {
			const t = now(at);
			partial(dry, t, note(-8), 0.1, 0.09, { type: 'triangle' });
			partial(dry, t + 0.085, note(-12), 0.1, 0.13, { type: 'triangle' });
		},

		// A round starts: a low knock for the press, and a breath of air while the last round's
		// tokens fade and its sunk tiles rise (110 to 120 ms).
		start: (at = 0) => {
			const t = now(at);
			partial(dry, t, note(-5), 0.2, 0.12, { glide: note(-17), attack: 0.003 });
			partial(dry, t, note(7), 0.07, 0.06, { glide: note(-5), type: 'triangle' });
			burst(dry, t, 0.05, 0.012, { type: 'bandpass', from: 3000, q: 1 });
			burst(soft, t + 0.01, 0.035, 0.13, { type: 'bandpass', from: 700, to: 2600, q: 0.9 }, 0.04);
		},

		// A lucky number is marked before the draw: one quiet bell. In a lucky round the three marks
		// come a beat apart and climb the chord (E, G, C). index: 0 to 2.
		mark: (index: number, at = 0) =>
			bell(bright, now(at), note([16, 19, 24][Math.min(index, 2)]), 0.06, 0.32),

		// A miss: the tile sinks. Quieter in a fast draw, where the misses come 40 ms apart.
		miss: (fast = false, at = 0) => thud(now(at), fast ? 0.06 : 0.12),

		// A hit: the token lands. level: the meter's level after it (the run in play plus the lucky
		// balls), which sets the note, so a chain climbs; raised: the hit raised the multiplier.
		// Light crosses the token 200 ms after it lands, and a faint high note goes with it.
		hit: (level: number, raised = false, fast = false, at = 0) => {
			const t = now(at);
			const frequency = step(level - 1);
			const run = Math.min(Math.max(level, 1), 8);
			mallet(bright, t, frequency, 0.2, fast ? 0.11 : 0.2);
			// the longer the chain, the more metal rings over the wood
			bell(bright, t, frequency * 2, 0.03 + run * 0.011, fast ? 0.12 : 0.26);
			if (raised) {
				// the meter steps up: weight under the note, and a bell a fifth above it
				partial(bright, t, frequency / 2, 0.11, 0.2);
				bell(bright, t + 0.045, frequency * 1.5, 0.1, fast ? 0.14 : 0.34);
			}
			if (!fast) partial(bright, t + 0.2, frequency * 4, 0.014, 0.34, { attack: 0.09 });
		},

		// A lucky ball: gold. Three bells up the chord, with a low note under them; it always raises
		// the meter.
		lucky: (fast = false, at = 0) => {
			const t = now(at);
			const gap = fast ? 0.03 : 0.06;
			partial(bright, t, note(12), 0.12, 0.22);
			bell(bright, t, note(24), 0.15, 0.4);
			bell(bright, t + gap, note(31), 0.13, 0.48);
			bell(bright, t + gap * 2, note(36), 0.1, 0.6);
		},

		// The last ball's held beat: a tone and a breath of air rise for as long as the open numbers
		// swell, and stop as the ball lands. Returns what ends it early (the draw was skipped).
		suspense: (duration: number, at = 0) => {
			const t = now(at);
			const end = t + duration;
			const envelope = context.createGain();
			envelope.gain.setValueAtTime(0.0001, t);
			envelope.gain.exponentialRampToValueAtTime(0.09, end - 0.02);
			envelope.gain.exponentialRampToValueAtTime(0.0001, end + 0.03);
			envelope.connect(soft);

			const tone = context.createOscillator();
			tone.type = 'triangle';
			// from G4 up to the G an octave above: the fifth of the key, which the ball then resolves
			tone.frequency.setValueAtTime(note(7), t);
			tone.frequency.exponentialRampToValueAtTime(note(19), end);
			// a quick tremble, faster than the swell on the board
			const tremble = context.createOscillator();
			const depth = context.createGain();
			const level = context.createGain();
			tremble.frequency.value = 15;
			depth.gain.value = 0.35;
			level.gain.value = 0.65;
			tremble.connect(depth).connect(level.gain);
			tone.connect(level).connect(envelope);

			const air = context.createBufferSource();
			const shape = context.createBiquadFilter();
			const airLevel = context.createGain();
			air.buffer = noise;
			air.loop = true;
			shape.type = 'bandpass';
			shape.Q.value = 1.4;
			shape.frequency.setValueAtTime(500, t);
			shape.frequency.exponentialRampToValueAtTime(5200, end);
			airLevel.gain.value = 0.7;
			air.connect(shape).connect(airLevel).connect(envelope);

			[tone, tremble, air].forEach((source) => {
				source.start(t);
				source.stop(end + 0.06);
			});
			return () => {
				const stop = context.currentTime;
				if (stop >= end) return;
				envelope.gain.cancelScheduledValues(stop);
				envelope.gain.setTargetAtTime(0.0001, stop, 0.012);
			};
		},

		// The round won its cost or more: the chord climbs as the result card comes in (280 ms).
		// size 1: the round's cost or more, four notes. size 2: three times the cost, six notes and
		// a held chord. size 3: ten times, a low note under seven notes, the full chord and an
		// answer above it. top: the mode's largest win, the whole figure again an octave up.
		win: (size: number, top = false, at = 0) => {
			const t = now(at);
			const chord = [12, 16, 19, 24, 28, 31, 36];
			const notes = chord.slice(0, size === 1 ? 4 : size === 2 ? 6 : 7);
			const gap = size === 3 ? 0.05 : 0.055;
			notes.forEach((semitones, i) => {
				mallet(bright, t + i * gap, note(semitones), 0.17, 0.24);
				bell(bright, t + i * gap, note(semitones + 12), 0.045 + i * 0.008, 0.3);
			});
			const landed = t + (notes.length - 1) * gap;
			if (size === 1) {
				bell(bright, landed, note(24), 0.1, 0.6);
				return;
			}
			[24, 28, 31].forEach((semitones) => bell(bright, landed, note(semitones), 0.1, 0.9));
			if (size < 3) return;
			// weight: a low root that swells under the run, and a knock where it starts
			partial(soft, t, note(-12), 0.2, 0.9, { attack: 0.06 });
			partial(dry, t, note(-12), 0.22, 0.16, { glide: note(-24) });
			bell(bright, landed, note(36), 0.11, 1.1);
			// the answer: two bells above the chord, two beats later
			bell(bright, landed + BEAT * 2, note(31), 0.12, 0.7);
			bell(bright, landed + BEAT * 3, note(36), 0.14, 1.3);
			if (!top) return;
			const again = landed + BEAT * 5;
			chord.forEach((semitones, i) => {
				mallet(bright, again + i * 0.045, note(semitones + 12), 0.14, 0.24);
				bell(bright, again + i * 0.045, note(semitones + 12), 0.08, 0.5);
			});
			[36, 40, 43, 48].forEach((semitones) =>
				bell(bright, again + 7 * 0.045, note(semitones), 0.1, 1.6),
			);
		},
	};
};

type Kit = ReturnType<typeof createKit>;

let kit: Kit | null = null;
let live: AudioContext | null = null;

// the kit on the page's own audio, made at the first sound (a press, which is what lets the
// browser play); null where there is no audio or the player has the sound off
const ready = (): Kit | null => {
	if (stateSoundDerived.volumeSoundEffect() <= 0) return null;
	try {
		if (!live) {
			live = new AudioContext();
			kit = createKit(live, () => stateSoundDerived.volumeSoundEffect());
		}
		if (live.state === 'suspended') void live.resume();
		return kit;
	} catch {
		// no audio here: the game plays without it
		return null;
	}
};

const play =
	<Arguments extends unknown[]>(sound: (kit: Kit, ...args: Arguments) => void) =>
	(...args: Arguments) => {
		try {
			const current = ready();
			if (current) sound(current, ...args);
		} catch {
			// a sound that cannot play never stops the game
		}
	};

export const sound = {
	press: play((k) => k.press()),
	pick: play((k, count: number) => k.pick(count)),
	unpick: play((k, count: number) => k.unpick(count)),
	deal: play((k, index: number) => k.deal(index)),
	deny: play((k) => k.deny()),
	start: play((k) => k.start()),
	mark: play((k, index: number) => k.mark(index)),
	miss: play((k, fast: boolean) => k.miss(fast)),
	hit: play((k, level: number, raised: boolean, fast: boolean) => k.hit(level, raised, fast)),
	lucky: play((k, fast: boolean) => k.lucky(fast)),
	win: play((k, size: number, top: boolean) => k.win(size, top)),
	// returns what ends the held beat early
	suspense: (duration: number): (() => void) => {
		try {
			return ready()?.suspense(duration) ?? (() => {});
		} catch {
			return () => {};
		}
	},
};
