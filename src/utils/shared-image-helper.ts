import { getImage } from "astro:assets";
import type { ImageFormat } from "../types/config";
import { getImageFormats, getImageQuality } from "./image-utils";
import { resolveImageMetadata } from "./image-source-utils";

/**
 * Hero 首帧图片的共享生成逻辑。
 *
 * Banner.astro 渲染的 <picture>/<source> 与 MainGridLayout.astro 注入到 <head>
 * 的 preload 链接必须共用这里的参数与 srcSet：任何一处参数不一致都会导致
 * Astro 生成两套不同哈希的图片文件，preload 命中不了渲染资源，反而双倍下载。
 */

/** 移动端 hero 候选宽度：640 / 768（DPR 1.75~2 主流机型）/ 1000（DPR 3 封顶） */
export const MOBILE_HERO_WIDTHS = [640, 768, 1000];
/** 桌面端 hero 候选宽度 */
export const DESKTOP_HERO_WIDTHS = [1024, 1536, 2048, 2560];

export const HERO_MOBILE_MEDIA = "(max-width: 767px)";
export const HERO_DESKTOP_MEDIA = "(min-width: 768px)";
export const HERO_SIZES = "100vw";

export interface HeroPreload {
	media: string;
	imagesrcset: string;
	imagesizes: string;
	/** 与 <source type="..."> 完全一致的 MIME，保证浏览器命中 preload 缓存 */
	type: string;
}

function imageMimeType(format: ImageFormat): string {
	return format === "jpg" ? "image/jpeg" : `image/${format}`;
}

/**
 * 生成与 ViewportImage 完全同参的 srcSet（同一 format / quality / widths），
 * 供 <head> preload 使用。格式取 getImageFormats() 的第一个（默认 avif），
 * 与 <picture> 中浏览器实际优先命中的 <source> 对应。
 */
async function buildHeroPreload(
	src: string,
	media: string,
	widths: number[],
	quality: number,
): Promise<HeroPreload | null> {
	const metadata = await resolveImageMetadata(src);
	if (!metadata) return null;

	const format = getImageFormats()[0];
	const image = await getImage({
		src: metadata,
		format,
		quality,
		widths,
	});

	return {
		media,
		imagesrcset: image.srcSet.attribute || image.src,
		imagesizes: HERO_SIZES,
		type: imageMimeType(format),
	};
}

/** 移动端首帧 preload（quality 与 Banner.astro 的移动端质量一致：quality * 0.9） */
export function getMobileHeroPreload(
	src: string,
): Promise<HeroPreload | null> {
	return buildHeroPreload(
		src,
		HERO_MOBILE_MEDIA,
		MOBILE_HERO_WIDTHS,
		Math.round(getImageQuality() * 0.9),
	);
}

/** 桌面端首帧 preload */
export function getDesktopHeroPreload(
	src: string,
): Promise<HeroPreload | null> {
	return buildHeroPreload(
		src,
		HERO_DESKTOP_MEDIA,
		DESKTOP_HERO_WIDTHS,
		getImageQuality(),
	);
}
