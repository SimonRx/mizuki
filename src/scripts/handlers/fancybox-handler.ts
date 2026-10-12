/**
 * Fancybox 处理器
 * 管理图片灯箱的初始化和清理
 */

import {
	FANCYBOX_SELECTORS,
	type FancyboxConfig,
	getDefaultFancyboxConfig,
} from "../core/swup-config";
import { type FancyboxL10n, loadFancyboxL10n } from "../utils/fancybox-l10n";

// 自定义覆盖样式：?url 方式引用使其不被 Astro 收集进 head 造成渲染阻塞，
// 仅在 Fancybox 真正启用时由 loadFancybox() 注入（页面存在灯箱图片才触发）。
import fancyboxCustomCss from "../../styles/fancybox-custom.css?url";
// @fancyapps/ui 自带的 Fancybox 样式同样以 ?url 引用：动态 import("xxx.css") 会被
// Astro 收集进 head 成为渲染阻塞资源，改成运行时注入后只有启用灯箱时才下载。
import fancyboxBaseCss from "@fancyapps/ui/dist/fancybox/fancybox.css?url";

// Fancybox 模块类型
type FancyboxType = any;

/**
 * Fancybox 处理器类
 * 负责图片灯箱的按需加载和管理
 */
export class FancyboxHandler {
	private Fancybox: FancyboxType | null = null;
	private boundSelectors: string[] = [];
	private initialized = false;
	private l10n: FancyboxL10n | null = null;

	/**
	 * 初始化 Fancybox
	 * 按需加载 Fancybox 模块和样式
	 */
	async init(): Promise<void> {
		const hasImages = this.checkForImages();

		if (!hasImages) {
			return;
		}

		// 按需加载 Fancybox 模块及语言包
		if (!this.Fancybox) {
			await this.loadFancybox();
		} else {
			// SwupHeadPlugin（updateHead）切页时会删除运行时注入的样式 <link>
			// （其 isPersistentTag 不检查 data-swup-persist），且不会自动补注；
			// 本方法在每次 content:replace 后调用，此处负责补注缺失的样式
			this.injectStyles();
		}

		// 避免重复初始化
		if (this.boundSelectors.length > 0) {
			return;
		}

		this.bindImageSelectors();
		this.initialized = true;
	}

	/**
	 * 检查页面是否有需要 Fancybox 的图片
	 */
	private checkForImages(): boolean {
		return (
			document.querySelector(FANCYBOX_SELECTORS.albumImages) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.imageGrids) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.albumLinks) !== null ||
			document.querySelector(FANCYBOX_SELECTORS.singleFancybox) !== null
		);
	}

	/**
	 * 加载 Fancybox 模块和样式，并动态引入匹配的语言包
	 */
	private async loadFancybox(): Promise<void> {
		const mod = await import("@fancyapps/ui");
		this.Fancybox = mod.Fancybox;

		this.injectStyles();

		this.l10n = await loadFancyboxL10n();
	}

	/**
	 * 注入 Fancybox 基础样式与自定义覆盖样式（幂等）。
	 * 避免无灯箱图片的页面也下载这些 CSS；Swup 切页删除后可再次调用补注
	 */
	private injectStyles(): void {
		if (document.head.querySelector("link[data-fancybox-css]")) {
			return;
		}

		const base = document.createElement("link");
		base.rel = "stylesheet";
		base.href = fancyboxBaseCss;
		base.setAttribute("data-fancybox-css", "true");
		document.head.appendChild(base);

		const custom = document.createElement("link");
		custom.rel = "stylesheet";
		custom.href = fancyboxCustomCss;
		custom.setAttribute("data-fancybox-custom-css", "true");
		document.head.appendChild(custom);
	}

	/**
	 * 绑定图片选择器
	 */
	private bindImageSelectors(): void {
		if (!this.Fancybox) {
			return;
		}

		const baseConfig = getDefaultFancyboxConfig();
		const commonConfig: FancyboxConfig = {
			...baseConfig,
			...(this.l10n ? { l10n: this.l10n } : {}),
		};

		// 绑定相册/文章图片
		this.Fancybox.bind(
			FANCYBOX_SELECTORS.albumImages,
			this.createAlbumImagesConfig(commonConfig),
		);
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumImages);

		// 图片网格会使用各自的 data-fancybox 值分组，不能与整篇文章图片混合。
		this.Fancybox.bind(FANCYBOX_SELECTORS.imageGrids, commonConfig);
		this.boundSelectors.push(FANCYBOX_SELECTORS.imageGrids);

		// 绑定相册链接
		this.Fancybox.bind(FANCYBOX_SELECTORS.albumLinks, {
			...commonConfig,
			source: (el: any) => {
				return el.getAttribute("data-src") || el.getAttribute("href");
			},
		});
		this.boundSelectors.push(FANCYBOX_SELECTORS.albumLinks);

		// 绑定单独的 fancybox 图片
		this.Fancybox.bind(FANCYBOX_SELECTORS.singleFancybox, commonConfig);
		this.boundSelectors.push(FANCYBOX_SELECTORS.singleFancybox);
	}

	/**
	 * 创建相册/文章图片配置
	 * 保留默认 Carousel 插件配置，避免覆盖旋转工具栏
	 */
	private createAlbumImagesConfig(commonConfig: FancyboxConfig): FancyboxConfig {
		const carouselConfig = commonConfig.Carousel ?? {};
		const lazyloadConfig = carouselConfig.Lazyload;

		return {
			...commonConfig,
			groupAll: true,
			Carousel: {
				...carouselConfig,
				transition: "slide",
				...(this.l10n ? { l10n: this.l10n } : {}),
				Lazyload: {
					...(typeof lazyloadConfig === "object" ? lazyloadConfig : {}),
					preload: 2,
				},
			},
		};
	}

	/**
	 * 清理 Fancybox 绑定
	 * 在页面切换前调用
	 */
	cleanup(): void {
		if (!this.Fancybox) {
			return;
		}

		this.boundSelectors.forEach((selector) => {
			this.Fancybox.unbind(selector);
		});
		this.boundSelectors = [];
	}

	/**
	 * 完全销毁 Fancybox
	 */
	destroy(): void {
		this.cleanup();
		this.Fancybox = null;
		this.initialized = false;
	}

	/**
	 * 获取初始化状态
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * 获取已绑定的选择器列表
	 */
	getBoundSelectors(): string[] {
		return [...this.boundSelectors];
	}
}

// 创建全局实例
let globalFancyboxHandler: FancyboxHandler | null = null;

/**
 * 获取全局 Fancybox 处理器实例
 */
export function getFancyboxHandler(): FancyboxHandler {
	if (!globalFancyboxHandler) {
		globalFancyboxHandler = new FancyboxHandler();
	}
	return globalFancyboxHandler;
}

/**
 * 初始化 Fancybox（便捷函数）
 */
export async function initFancybox(): Promise<void> {
	const handler = getFancyboxHandler();
	await handler.init();
}

/**
 * 清理 Fancybox（便捷函数）
 */
export function cleanupFancybox(): void {
	if (globalFancyboxHandler) {
		globalFancyboxHandler.cleanup();
	}
}
