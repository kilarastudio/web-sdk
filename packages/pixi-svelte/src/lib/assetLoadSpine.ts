import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
import type { RawSpine, SpineSrc } from './types';

export const processSpine = ({
	key,
	rawAsset,
	src,
}: {
	key: string;
	rawAsset: RawSpine;
	src: SpineSrc;
}) => {
	const atlasAsset = rawAsset[src.atlas] as SPINE_PIXI.TextureAtlas;
	const skeletonAsset = rawAsset[src.skeleton] as Uint8Array;
	const attachmentLoader = new SPINE_PIXI.AtlasAttachmentLoader(atlasAsset);
	const parser =
		skeletonAsset instanceof Uint8Array
			? new SPINE_PIXI.SkeletonBinary(attachmentLoader)
			: new SPINE_PIXI.SkeletonJson(attachmentLoader);
	const scale = src?.scale ?? 1;
	parser.scale = scale;
	const skeletonData = parser.readSkeletonData(skeletonAsset);

	return { [key]: skeletonData };
};
