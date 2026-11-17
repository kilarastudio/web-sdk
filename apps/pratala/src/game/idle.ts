// The board at rest is never still for long and never stirs all at once: every second or so one
// symbol somewhere is cued to play one of its bigger rest acts (symbolActs.ts IDLE_ACTS), and the
// board is calm between them. A symbol joins while it rests and leaves when it falls, wins or
// goes; asked to act, it answers whether it could (it may be busy landing or already acting).
type Idler = { act: () => boolean; weight: number };

const idlers = new Set<Idler>();
// time between cues, in ms, picked afresh each time so the stirring has no beat
const GAP = { least: 1300, most: 2100 };
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
