// The board at rest is never still and never stirs all at once: about every two thirds of a second
// one symbol somewhere is cued to play one of its bigger rest acts (symbolActs.ts IDLE_ACTS), so
// one or two are moving at any moment. A symbol joins while it rests and leaves when it falls,
// wins or goes; asked to act, it answers whether it could (it may be busy landing or already acting).
type Idler = { act: () => boolean; weight: number };

const idlers = new Set<Idler>();
// time between cues, in ms, picked afresh each time so the stirring has no beat; the user found a
// cue every 1.3-2.1 s too rare
const GAP = { least: 450, most: 850 };
let last: Idler | undefined;

export const joinIdle = (act: () => boolean, weight = 1) => {
	const idler = { act, weight };
	idlers.add(idler);

	return () => {
		idlers.delete(idler);
	};
};

// one at random, weighted, but never the same symbol twice running
const pick = (pool: Idler[]) => {
	let roll = Math.random() * pool.reduce((sum, idler) => sum + idler.weight, 0);
	for (const idler of pool) {
		roll -= idler.weight;
		if (roll < 0) return idler;
	}

	return pool.at(-1);
};

const cue = () => {
	if (!document.hidden) {
		const pool = [...idlers].filter((idler) => idler !== last);
		// a busy symbol says no: try a few others
		for (let tries = 0; tries < 4 && pool.length; tries++) {
			const idler = pick(pool);
			if (!idler) break;
			if (idler.act()) {
				last = idler;
				break;
			}
			pool.splice(pool.indexOf(idler), 1);
		}
	}
	setTimeout(cue, GAP.least + Math.random() * (GAP.most - GAP.least));
};

if (typeof window !== 'undefined') setTimeout(cue, GAP.least);
