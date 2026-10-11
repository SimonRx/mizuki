/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

declare module "*.css?url" {
	const src: string;
	export default src;
}

declare module "sharp" {
	export default function sharp(input?: Buffer | string): import("sharp").Sharp;
}
