import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { glyphs, aliases, kernings, families } from './font/deep-glint-forge.mjs';

const require = createRequire(import.meta.url);
const sharp = require(process.env.KILARA_SHARP_PATH || 'sharp');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.join(app, 'static/assets/deep-glint/fonts');
const output = path.resolve(app, '../../../output/ai-game-assets/deep-glint-font');
await fs.mkdir(runtime, { recursive: true });
await fs.mkdir(output, { recursive: true });

const size = 128;
const atlasWidth = 1024;
const cellHeight = 136;
const pad = 8;
let x = 0,
	y = 0;
const packed = {};
for (const [char, glyph] of Object.entries(glyphs)) {
	const width = glyph.width + pad * 2;
	if (x + width > atlasWidth) {
		x = 0;
		y += cellHeight;
	}
	packed[char] = { ...glyph, x, y, textureWidth: width };
	x += width + 4;
}
const atlasHeight = Math.ceil((y + cellHeight) / 128) * 128;
const defs = `<linearGradient id="gold" x1="0" y1="0" x2="0.2" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff9cf"/><stop offset=".18" stop-color="#ffe99a"/><stop offset=".42" stop-color="#ffc84c"/><stop offset=".49" stop-color="#ffdc67"/><stop offset=".52" stop-color="#da8a20"/><stop offset=".78" stop-color="#f8b634"/><stop offset="1" stop-color="#ffdf76"/></linearGradient>`;
function artwork(glyph, id, variant) {
	if (!glyph.path) return '';
	const p = `<path d="${glyph.path}" fill-rule="evenodd"/>`;
	if (variant === 'ink') return `<g fill="white">${p}</g>`;
	return `<defs><path id="g${id}" d="${glyph.path}" fill-rule="evenodd"/><mask id="t${id}" maskUnits="userSpaceOnUse" x="-8" y="-8" width="128" height="136"><use href="#g${id}" fill="white"/><use href="#g${id}" transform="translate(2.5 3)" fill="black"/></mask><mask id="b${id}" maskUnits="userSpaceOnUse" x="-8" y="-8" width="128" height="136"><use href="#g${id}" fill="white"/><use href="#g${id}" transform="translate(-2.5 -3)" fill="black"/></mask></defs><use href="#g${id}" transform="translate(1 4)" fill="#552d19" stroke="#211b19" stroke-width="9" stroke-linejoin="round"/><use href="#g${id}" fill="#efac39" stroke="#fff1a6" stroke-width="3" stroke-linejoin="round"/><use href="#g${id}" fill="url(#gold)"/><rect x="-8" y="-8" width="128" height="136" fill="#fff8c7" mask="url(#t${id})"/><rect x="-8" y="-8" width="128" height="136" fill="#ad601e" mask="url(#b${id})"/>`;
}
const manifest = {
	family: 'Deep Glint Forge',
	originalOutlines: 'scripts/font/deep-glint-forge.mjs',
	nativeSize: size,
	capHeight: 100,
	atlas: { width: atlasWidth, height: atlasHeight },
	coverage: Object.keys({ ...glyphs, ...aliases }).join(''),
	faces: {},
};
for (const variant of Object.keys(families)) {
	const file = `deep-glint-forge-${variant}`;
	const groups = Object.entries(packed)
		.map(
			([char, glyph]) =>
				`<g transform="translate(${glyph.x + pad} ${glyph.y + pad})">${artwork(glyph, char.codePointAt(0), variant)}</g>`,
		)
		.join('');
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${atlasWidth}" height="${atlasHeight}"><defs>${defs}</defs>${groups}</svg>`;
	await fs.writeFile(path.join(output, `${file}.svg`), svg);
	await sharp(Buffer.from(svg), { density: 144 })
		.resize(atlasWidth, atlasHeight)
		.png()
		.toFile(path.join(runtime, `${file}.png`));
	const chars = Object.entries({
		...Object.fromEntries(Object.keys(glyphs).map((c) => [c, c])),
		...aliases,
	}).map(([char, source]) => {
		const g = packed[source];
		return `<char id="${char.codePointAt(0)}" x="${g.x}" y="${g.y}" width="${g.path ? g.textureWidth : 0}" height="${g.path ? cellHeight : 0}" xoffset="0" yoffset="0" xadvance="${g.width + pad * 2}" page="0" chnl="15"/>`;
	});
	const pairs = kernings.flatMap(({ pair, amount }) =>
		[...new Set([pair[0], pair[0].toLowerCase()])].flatMap((first) =>
			[...new Set([pair[1], pair[1].toLowerCase()])].map(
				(second) =>
					`<kerning first="${first.codePointAt(0)}" second="${second.codePointAt(0)}" amount="${amount}"/>`,
			),
		),
	);
	const xml = `<?xml version="1.0"?>\n<font><info face="${families[variant]}" size="${size}" bold="1" italic="0" unicode="1" stretchH="100" smooth="1" aa="1" padding="8,8,8,8" spacing="4,4"/><common lineHeight="${size}" base="${size}" scaleW="${atlasWidth}" scaleH="${atlasHeight}" pages="1" packed="0"/><pages><page id="0" file="${file}.png"/></pages><chars count="${chars.length}">${chars.join('\n')}</chars><kernings count="${pairs.length}">${pairs.join('\n')}</kernings></font>\n`;
	await fs.writeFile(path.join(runtime, `${file}.fnt`), xml);
	manifest.faces[variant] = {
		family: families[variant],
		glyphCount: chars.length,
		textureBytes: (await fs.stat(path.join(runtime, `${file}.png`))).size,
	};
}
await fs.writeFile(path.join(runtime, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
// Coverage is generated from the same source as the atlas, so runtime fallback
// cannot accidentally promise a glyph that the font does not contain.
await fs.writeFile(
	path.join(app, 'src/game/gameFont.generated.ts'),
	`// Generated by scripts/build-game-font.mjs; edit the original outlines there.\nexport const GAME_FONT_FAMILIES = ${JSON.stringify(families, null, 2)} as const;\nexport const GAME_FONT_CHARACTERS = ${JSON.stringify(manifest.coverage)};\n`,
);

function line(text, x, y, scale, variant = 'gold') {
	let advance = 0;
	const parts = [...text].map((char, i) => {
		const g = glyphs[aliases[char] || char];
		if (!g) throw new Error(`Missing preview glyph ${char}`);
		const part = `<g transform="translate(${advance} 0)">${artwork(g, `${x}-${y}-${i}`, variant)}</g>`;
		advance +=
			g.width + 16 + (kernings.find(({ pair }) => pair === text.slice(i, i + 2))?.amount || 0);
		return part;
	});
	return `<g transform="translate(${x} ${y}) scale(${scale})">${parts.join('')}</g>`;
}
const specimen = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1040"><defs>${defs}<radialGradient id="bg"><stop stop-color="#17434b"/><stop offset="1" stop-color="#08191f"/></radialGradient></defs><rect width="1440" height="1040" fill="url(#bg)"/><path d="M64 72H1376M64 938H1376" stroke="#35575b"/>${line('DEEP GLINT', 68, 110, 1.38)}${line('FORGE', 72, 276, 0.54, 'ink')}${line('BIG WIN', 72, 403, 1.05)}${line('$1,234.56', 750, 403, 0.82)}${line('FREE SPINS', 72, 552, 0.65)}${line('×2  ×16  ×256', 750, 552, 0.55)}${line('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 72, 698, 0.5)}${line('0123456789  $ € £ ¥ ₹  + × %', 72, 784, 0.52)}${line('PRESS ANYWHERE TO CONTINUE', 72, 886, 0.27, 'ink')}${line('ORIGINAL BITMAP TYPE / 128 PX', 72, 972, 0.24, 'ink')}</svg>`;
await fs.writeFile(path.join(output, 'specimen.svg'), specimen);
await sharp(Buffer.from(specimen)).png().toFile(path.join(output, 'specimen.png'));
console.log(JSON.stringify({ runtime, output, ...manifest }, null, 2));
