import { writeFileSync } from 'node:fs';
import { sheet } from '../src/pixel/png.ts';
import { glintTile } from '../src/pixel/render/glint.ts';
import { decodeBaked, type Baked } from '../src/pixel/baked.ts';
import { readFileSync } from 'node:fs';
const board = decodeBaked(JSON.parse(readFileSync('src/pixel/baked/board.json', 'utf8')) as Baked);
const coins = board.coin as any[];
writeFileSync('../../../output/pratala/art-v2/glint-coins.png', sheet([glintTile(1), glintTile(2), glintTile(3), glintTile(4), ...coins], { columns: 12, scale: 6, background: 0x0e071b }));
console.log('wrote glint-coins.png');
