// Renders the scatter eye's review sheet. node scripts/render-eye.ts
import { mkdirSync, writeFileSync } from 'node:fs';

import { sheet } from '../src/pixel/png.ts';
import { eye } from '../src/pixel/render/symbols/eye.ts';
import { renderSymbol } from '../src/pixel/render/symbols/rig.ts';

const out = new URL('../../../../output/pratala/art-v2/eye/', import.meta.url);
mkdirSync(out, { recursive: true });
const started = Date.now();
const frames = [
	// open, then the blink
	eye(),
	eye({ open: 0.6 }),
	eye({ open: 0.2 }),
	eye({ open: 0 }),
	// looks
	eye({ look: [-1, 0] }),
	eye({ look: [1, 0] }),
	eye({ look: [0, -1] }),
	// alert
	eye({ pupil: 1.6, glow: 1 }),
].map((model) => renderSymbol(model));
console.log(`rendered in ${Date.now() - started} ms`);
writeFileSync(new URL('sheet.png', out), sheet(frames, { columns: 4, scale: 6, background: 0x1a1932 }));
writeFileSync(new URL('sheet-1x.png', out), sheet(frames, { columns: 4, scale: 2, background: 0x1a1932 }));
console.log('wrote', new URL('sheet.png', out).pathname);
