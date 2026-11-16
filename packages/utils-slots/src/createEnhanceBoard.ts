import { createEnhanceBoardPreSpin } from './createEnhanceBoardPreSpin';
import { createEnhanceBoardSpin } from './createEnhanceBoardSpin';
import type { Reel, GetRawSymbolFromReel } from './types';

export function createEnhanceBoard() {
	function enhanceBoard<TReel extends Reel<any, any>>({ board }: { board: TReel[] }) {
		type TRawSymbol = GetRawSymbolFromReel<TReel>;

		const { preSpin } = createEnhanceBoardPreSpin({ board });
		const { spin } = createEnhanceBoardSpin({ board });
		const settle = (rawBoard?: TRawSymbol[][]) =>
			board.forEach((reel, reelIndex) => {
				// without a board the reels only stop: an empty list would leave symbols undefined
				reel.setSymbolsWithRawSymbols(rawBoard?.[reelIndex]);
			});
		const stop = () => board.forEach((reel) => reel.stop());
		const readyToSpinEffect = () => {
			board.forEach((reel) => reel.readyToSpinEffect());
		};

		return {
			board,
			preSpin,
			spin,
			settle,
			stop,
			readyToSpinEffect,
		};
	}

	return { enhanceBoard };
}
