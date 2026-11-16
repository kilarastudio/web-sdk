import { writeFileSync } from 'node:fs';
import { sheet } from '../src/pixel/png.ts';
import { renderAll } from '../src/pixel/render/symbols/index.ts';
const frames = renderAll();
const rows = ['symbolH1', 'symbolH3', 'symbolH4', 'symbolL1', 'symbolScatter'].flatMap((k) => [...(frames[`${k}Hurt`] as any[]), ...(frames[`${k}Gone`] as any[])]);
writeFileSync('../../../output/pratala/art-v2/hurt-gone.png', sheet(rows, { columns: 18, scale: 3 }));
console.log('wrote hurt-gone.png');
