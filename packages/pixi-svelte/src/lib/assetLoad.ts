import type { RawType, RawAsset, RawSprites, SpineSrc, RawAudio } from './types';

type ProcessMethod = (options: {
	key: string;
	rawAsset: any;
	src: any;
}) => Record<string, unknown> | undefined;

const PROCESS_METHOD_MAP: Partial<Record<RawType, ProcessMethod>> = {
	sprite: ({ key, rawAsset }: { key: string; rawAsset: RawSprites }) => ({ [key]: rawAsset }),
	sprites: ({ rawAsset }: { rawAsset: RawSprites }) => rawAsset.textures,
	spriteSheet: ({ key, rawAsset }: { key: string; rawAsset: RawSprites }) => ({
		[key]: Object.values(rawAsset.textures),
	}),
	audio: ({ key, rawAsset }: { key: string; rawAsset: RawAudio }) => {
		return { [key]: rawAsset };
	},
};

// The spine type is registered by BaseSpineProvider.svelte, so the Spine runtime is only bundled
// into games that render a Spine component.
export const registerAssetProcessMethod = (type: RawType, processMethod: ProcessMethod) => {
	PROCESS_METHOD_MAP[type] = processMethod;
};

export const getProcessed = ({
	key,
	type,
	rawAsset,
	src,
}: {
	key: string;
	type: RawType;
	rawAsset: RawAsset;
	src: string | SpineSrc;
}) => {
	if (type === 'font') return; // No need to process raw font data and add it to the loaded assets.
	const processMethod = PROCESS_METHOD_MAP[type];
	if (!processMethod)
		throw Error(
			type === 'spine'
				? 'Spine assets are only processed in a game that uses a Spine component (SpineProvider or BaseSpineProvider).'
				: 'No asset process method found, please check the type of the asset.',
		);
	return processMethod({ key, rawAsset, src });
};
