// What the hall does for a big win. Each level is a different event in the hall, not a bigger
// copy of the last: BIG, the eye looks down at the board; SUPER, the torches flare and dust falls
// from the vault; MEGA, the cracks in the stone glow; EPIC, the pupil narrows and the hall
// reddens; MAX, the whole hall burns. `tier` is the level showing now (0: none, 1 BIG to 5 MAX),
// and `landed` counts the levels as they land, for what happens once at each.
export const hallMood = $state({ tier: 0, landed: 0 });

export const landHallMood = (tier: number) => {
	hallMood.tier = tier;
	hallMood.landed++;
};

export const clearHallMood = () => {
	hallMood.tier = 0;
};
