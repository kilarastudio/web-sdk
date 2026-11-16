// Renders the code-drawn UI art (flames, particles, tiles) to PNG sheets for review. Symbols,
// the board and the hall have their own scripts (bake-art.ts, render-hall.ts, render-glint.ts).
//   node scripts/pixel-preview.ts [output folder]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { sheet } from '../src/pixel/png.ts';
import * as ui from '../src/pixel/ui.ts';

const out = process.argv[2] ?? '../../../output/pratala/art-v2';
mkdirSync(out, { recursive: true });
const { trough, fill } = ui.loadingBar(100);
writeFileSync(
	join(out, 'ui.png'),
	sheet(
		[ui.glintPrimed(), ui.panel(), ...ui.fireballFrames(), ...ui.burstFrames(), ui.anticipationBeam(), trough, fill],
		{ columns: 10, scale: 5 },
	),
);
writeFileSync(join(out, 'flames.png'), sheet([...ui.flameFrames(22, 60), ...ui.flameFrames(34, 70)], { columns: 12, scale: 5 }));
console.log('wrote ui.png, flames.png');
