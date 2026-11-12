import { eventEmitter } from './eventEmitter';
import { stateGame } from './stateGame.svelte';
import type { BigWinLevelData, WinLevelData } from './winLevelMap';

// The sounds of a win being counted up: a fanfare for a good win, and a tally that ticks for as
// long as the amount climbs. A big win has a loop of coins instead, and each of its levels brings
// its own music in as it lands (winLevelSoundsLand).
export const winLevelSoundsPlay = ({
	winLevelData,
	fanfare = true,
}: {
	winLevelData: WinLevelData;
	fanfare?: boolean;
}) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	} else if (winLevelData?.presentDuration) {
		if (fanfare && winLevelData.type === 'medium')
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_win_medium', forcePlay: true });
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_win_countup' });
	}
};

// a big win's level lands: its hit, and its music from then on
export const winLevelSoundsLand = (winLevelData: BigWinLevelData) => {
	eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx, forcePlay: true });
	eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
};

// the moment the amount is all there: the tally stops on a coin hit, a big win on its final chord
export const winCountUpSoundsEnd = ({ winLevelData }: { winLevelData?: WinLevelData }) => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_win_countup' });
	if (!winLevelData?.presentDuration) return;
	eventEmitter.broadcast({
		type: 'soundOnce',
		name: winLevelData.type === 'big' ? 'sfx_winlevel_end' : 'sfx_win_collect',
		forcePlay: true,
	});
};

// the win's presentation is over: back to the music of the game it belongs to
export const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_win_countup' });
	eventEmitter.broadcast({
		type: 'soundMusic',
		name: stateGame.gameType === 'freegame' ? 'bgm_freespin' : 'bgm_main',
	});
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};
