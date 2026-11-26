import { SYMBOL_LOOK, FONT } from './constants';
import type { SymbolName } from './types';

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

// Grey box: a symbol's picture for the menus, the same square the board draws, as a data URL.
export const greyPicture = (symbol: SymbolName, size = 96) => {
	const look = SYMBOL_LOOK[symbol];
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) return '';
	context.fillStyle = hex(look.fill);
	context.fillRect(0, 0, size, size);
	if (look.edge !== undefined) {
		context.strokeStyle = hex(look.edge);
		context.lineWidth = size * 0.04;
		context.strokeRect(size * 0.02, size * 0.02, size * 0.96, size * 0.96);
	}
	context.fillStyle = hex(look.text);
	const fontSize = look.label.length > 4 ? 0.18 : look.label.length > 2 ? 0.28 : 0.38;
	context.font = `700 ${size * fontSize}px ${FONT}`;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText(look.label, size / 2, size / 2);
	return canvas.toDataURL();
};
