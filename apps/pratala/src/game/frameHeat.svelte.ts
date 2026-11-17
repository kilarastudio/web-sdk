// How hot the board's frame is: 0 the base game's frame, 1 the red-hot frame of free spins
// (components/BoardFrame.svelte), for what takes its light from it (BoardSpill).
export const frameHeat = $state({ hot: 0, burning: false });
