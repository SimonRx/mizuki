/**
 * Swup 钩子模块
 * 处理页面过渡过程中的各种钩子事件
 */

import { pathsEqual, url } from "../../utils/url-utils";
import type { FancyboxHandler } from "../handlers/fancybox-handler";
import type { ScrollHandler } from "../handlers/scroll-handler";
import {
	ANIMATION_CONFIG,
	BANNER_HEIGHT,
	SWUP_SELECTORS,
	THEME_CONFIG,
} from "./swup-config";

// 钩子处理器接口
export interface SwupHookHandlers {
	fancyboxHandler?: FancyboxHandler;
	scrollHandler?: ScrollHandler;
	showBanner?: () => void;
	initFancybox?: () => void;
	cleanupFancybox?: () => void;
	initCustomScrollbar?: () => void;
	checkKatex?: () => void;
}

// 访问对象类型
interface VisitObject {
	to: {
		url: string;
	};
}

/**
 * Swup 钩子管理器
 * 负责注册和管理所有 Swup 页面过渡钩子
 */
export class SwupHooksManager {
	private bannerEnabled: boolean;
	private handlers: SwupHookHandlers;

	private cachedElements: Map<string, Element | null> = new Map();

	// 遮罩元信息更新的帧内合并标志：同一帧内多次调用只执行一次实际写入
	private overlayUpdateScheduled = false;

	constructor(bannerEnabled: boolean, handlers: SwupHookHandlers = {}) {
		this.bannerEnabled = bannerEnabled;
		this.handlers = handlers;
	}

	private getCachedElement(selector: string): Element | null {
		if (!this.cachedElements.has(selector)) {
			const id = selector.startsWith("#") ? selector.slice(1) : selector;
			if (selector.startsWith("#")) {
				this.cachedElements.set(selector, document.getElementById(id));
			} else {
				this.cachedElements.set(
					selector,
					document.querySelector(selector),
				);
			}
		}
		return this.cachedElements.get(selector) ?? null;
	}

	private clearCache(): void {
		this.cachedElements.clear();
	}

	/**
	 * 注册所有 Swup 钩子
	 */
	registerHooks(): void {
		if (!window.swup) {
			return;
		}
		this.registerScrollTopHook();
		this.registerLinkClickHook();
		this.registerContentReplaceHook();
		this.registerVisitStartHook();
		this.registerPageViewHook();
		this.registerVisitEndHook();
		this.scheduleOverlayUpdate();
	}

	/**
	 * 合并同一帧内的多次遮罩更新请求
	 * content:replace 与 page:view 常常在同一帧内连续触发，
	 * 延迟到单个 requestAnimationFrame 统一执行可避免同帧重复的样式失效。
	 */
	private scheduleOverlayUpdate(): void {
		if (this.overlayUpdateScheduled) {
			return;
		}
		this.overlayUpdateScheduled = true;
		requestAnimationFrame(() => {
			this.overlayUpdateScheduled = false;
			this.updatePageOverlay();
		});
	}

	private registerScrollTopHook(): void {
		const hooks = window.swup!.hooks as {
			on: (event: string, handler: (...args: unknown[]) => void) => void;
			off: (event: string, handler: (...args: unknown[]) => void) => void;
			replace?: (
				event: string,
				handler: (
					visit: VisitObject,
					args: { options?: ScrollIntoViewOptions },
				) => boolean,
			) => void;
		};

		if (typeof hooks.replace !== "function") {
			return;
		}

		hooks.replace(
			"scroll:top",
			(visit: VisitObject, args: { options?: ScrollIntoViewOptions }) => {
				const isFullscreen = this.getCurrentWallpaperMode() === "fullscreen";
				const isHomePage = pathsEqual(visit.to.url, url("/"));
				if (isFullscreen && !isHomePage) {
					const mainGrid = this.getCachedElement("#main-grid") as HTMLElement | null;
					if (mainGrid) {
						mainGrid.scrollIntoView({
							behavior: args.options?.behavior ?? "auto",
						});
						return true;
					}
				}

				window.scrollTo({
					top: 0,
					left: 0,
					...args.options,
				});
				return true;
			},
		);
	}

	/**
	 * link:click 钩子
	 * 处理链接点击时的初始状态
	 */
	private registerLinkClickHook(): void {
		window.swup!.hooks.on("link:click", ((...args: unknown[]) => {
			const hookArgs = args[1] as { el?: HTMLAnchorElement } | undefined;
			const href = hookArgs?.el?.getAttribute("href") || "";
			const targetPathname = (() => {
				try {
					return new URL(href, window.location.href).pathname;
				} catch {
					return href;
				}
			})();
			const isSamePage = pathsEqual(targetPathname, window.location.pathname);

			// 移除首次页面加载的延迟
			document.documentElement.style.setProperty(
				"--content-delay",
				"0ms",
			);

			if (isSamePage) {
				document.documentElement.classList.remove("is-page-transitioning");
			} else {
				document.documentElement.classList.add("is-page-transitioning");
			}

			// 处理 navbar 隐藏
			if (this.bannerEnabled) {
				this.handleNavbarHideOnLinkClick();
			}
		}) as (...args: unknown[]) => void);
	}

	/**
	 * content:replace 钩子
	 * 处理内容替换后的初始化
	 */
	private registerContentReplaceHook(): void {
		window.swup!.hooks.on("content:replace", () => {
			this.clearCache();
			const isHomePage = pathsEqual(window.location.pathname, url("/"));
			this.syncMainContentPosition(isHomePage);
			this.ensureNavbarVisibleForFullscreen();
			this.scheduleOverlayUpdate();

			// 初始化新页面的图片、公式、滚动条和 TOC
			this.handlers.initFancybox?.();
			this.handlers.checkKatex?.();
			this.handlers.initCustomScrollbar?.();

			// 处理 TOC 重新初始化
			this.handleTOCReinit();

			// 重新初始化 semifull 模式滚动检测
			this.reinitSemifullScrollDetection();

			// 切页回首页：为全新 banner-wrapper 重播入场动画
			if (isHomePage) {
				this.replayHomeBannerEntrance();
			}
		});
	}

	/**
	 * visit:start 钩子
	 * 处理页面访问开始时的状态
	 */
	private registerVisitStartHook(): void {
		window.swup!.hooks.on("visit:start", ((...args: unknown[]) => {
			const visit = args[0] as VisitObject;
			// 清理上一页的 Fancybox
			this.handlers.cleanupFancybox?.();

			// 处理页面状态
			const isHomePage = pathsEqual(visit.to.url, url("/"));
			this.handleBodyClass(isHomePage);
			this.handleBannerTextVisibility(isHomePage);
			this.handleNavbarState(isHomePage);
			this.handleMobileBannerVisibility(isHomePage);
			this.syncMainContentPosition(isHomePage);
			this.ensureNavbarVisibleForFullscreen();

			// 扩展页面高度防止滚动动画跳跃
			this.extendPageHeight(false);

			// 隐藏 TOC
			this.hideTOC();
		}) as (...args: unknown[]) => void);
	}

	/**
	 * page:view 钩子
	 * 处理页面视图显示
	 */
	private registerPageViewHook(): void {
		window.swup!.hooks.on("page:view", () => {
			this.syncMainContentPosition(
				pathsEqual(window.location.pathname, url("/")),
			);
			this.ensureNavbarVisibleForFullscreen();
			this.scheduleOverlayUpdate();

			// 扩展页面高度
			this.extendPageHeight(false);

			// 同步主题状态
			this.syncThemeState();

			// 触发页面加载完成事件
			this.dispatchPageLoadedEvent();
		});
	}

	/**
	 * visit:end 钩子
	 * 处理页面访问结束时的清理
	 */
	private registerVisitEndHook(): void {
		window.swup!.hooks.on("visit:end", (() => {
			setTimeout(() => {
				// 隐藏高度扩展元素
				this.extendPageHeight(true);

				// 显示 TOC
				this.showTOC();
				document.documentElement.classList.remove("is-page-transitioning");
			}, ANIMATION_CONFIG.heightExtendDelay);
		}) as (...args: unknown[]) => void);
	}

	// ==================== 私有辅助方法 ====================

	/**
	 * 处理链接点击时的 navbar 隐藏
	 */
	private handleNavbarHideOnLinkClick(): void {
		const navbar = this.getCachedElement(SWUP_SELECTORS.navbarWrapper);
		if (navbar) {
			const threshold = window.innerHeight * (BANNER_HEIGHT / 100) - 88;
			if (document.documentElement.scrollTop >= threshold) {
				navbar.classList.add("navbar-hidden");
			}
		}
	}

	/**
	 * 处理 TOC 重新初始化
	 */
	private handleTOCReinit(): void {
		const tocWrapper = this.getCachedElement(SWUP_SELECTORS.tocWrapper);
		const isArticlePage = tocWrapper !== null;

		if (isArticlePage) {
			const tocElement = this.getCachedElement(
				SWUP_SELECTORS.tableOfContents,
			);
			const hasDesktopTOC =
				tocElement && typeof (tocElement as any).init === "function";
			const hasMobileTOC =
				typeof (window as any).mobileTOCInit === "function";

			if (hasDesktopTOC || hasMobileTOC) {
				setTimeout(() => {
					if (hasDesktopTOC) {
						(tocElement as any).init();
					}
					if (hasMobileTOC) {
						(window as any).mobileTOCInit();
					}
				}, ANIMATION_CONFIG.tocReadyDelay);
			}
		}
	}

	/**
	 * 重新初始化 semifull 模式滚动检测
	 */
	private reinitSemifullScrollDetection(): void {
		const navbar = this.getCachedElement(SWUP_SELECTORS.navbar);
		if (navbar) {
			const transparentMode = navbar.getAttribute(
				"data-transparent-mode",
			);
			if (transparentMode === "semifull") {
				if (
					typeof (window as any).initSemifullScrollDetection ===
					"function"
				) {
					(window as any).initSemifullScrollDetection();
				}
			}
		}
	}

	/**
	 * 处理 body class
	 */
	private handleBodyClass(_isHomePage: boolean): void {
		// body class 统一由 CSS 处理，无需区分首页/非首页
	}

	/**
	 * 处理 Banner 文字可见性
	 */
	private handleBannerTextVisibility(isHomePage: boolean): void {
		const bannerTextOverlay = this.getCachedElement(
			SWUP_SELECTORS.bannerTextOverlay,
		);
		if (bannerTextOverlay) {
			if (isHomePage) {
				bannerTextOverlay.classList.remove("hidden");
			} else {
				bannerTextOverlay.classList.add("hidden");
			}
		}
	}

	/**
	 * 处理 Navbar 状态
	 */
	private handleNavbarState(isHomePage: boolean): void {
		const navbar = this.getCachedElement(SWUP_SELECTORS.navbar);
		if (navbar) {
			navbar.setAttribute("data-is-home", isHomePage.toString());

			// 重新初始化 semifull 模式滚动检测
			const transparentMode = navbar.getAttribute(
				"data-transparent-mode",
			);
			if (transparentMode === "semifull") {
				if (
					typeof (window as any).initSemifullScrollDetection ===
					"function"
				) {
					(window as any).initSemifullScrollDetection();
				}
			}
		}
	}

	/**
	 * 处理移动端 Banner 可见性
	 */
	private handleMobileBannerVisibility(isHomePage: boolean): void {
		const mode = this.getCurrentWallpaperMode();
		if (mode !== "banner" && mode !== "fullscreen") {
			return;
		}

		const bannerWrapper = this.getCachedElement(
			SWUP_SELECTORS.bannerWrapper,
		);
		const mainContentWrapper = this.getCachedElement(
			".absolute.w-full.z-30",
		);

		if (bannerWrapper && mainContentWrapper) {
			if (isHomePage) {
				// 首页：延迟移除隐藏类
				setTimeout(() => {
					bannerWrapper.classList.remove("mobile-hide-banner");
				}, ANIMATION_CONFIG.mobileBannerDelay);
				setTimeout(() => {
					mainContentWrapper.classList.remove(
						"mobile-main-no-banner",
					);
				}, ANIMATION_CONFIG.mobileContentDelay);
			} else {
				// 非首页：分阶段隐藏
				bannerWrapper.classList.add("mobile-hide-banner");
				setTimeout(() => {
					mainContentWrapper.classList.add("mobile-main-no-banner");
				}, ANIMATION_CONFIG.mobileBannerDelay);
			}
		}
	}

	/**
	 * 切页回首页时，为全新的 #banner-wrapper 重播入场动画
	 *
	 * 背景：#banner-wrapper 已纳入 Swup 替换容器（astro.config.mjs containers），
	 * 切回首页时容器被全新元素替换。官方主题站该元素不在容器内（持久元素）：
	 * 文章页带 mobile-hide-banner 隐藏态，回首页移除该类后凭 banner.css
	 * <1280px 下的 transition（transform .5s cubic-bezier(.25,.46,.45,.94) /
	 * opacity .3s ease-out）平滑入场；本站新元素从未带过该类，直接以最终态
	 * 插入，观感为"硬插"、无过渡。
	 *
	 * 实现采用 WAAPI 直接驱动（与 applyInitialKB 的重播惯例一致），而非
	 * 「加 mobile-hide-banner → 双 rAF 后移除」的类切换方案：实测后者隐藏态
	 * 能否被提交取决于帧时序，rAF#1/#2 之间一旦没有完成的样式提交（掉帧、
	 * 后台标签页、长任务），移除方向过渡会退化为瞬时完成、动画静默丢失；
	 * WAAPI 动画时间线与帧提交解耦，关键帧/时长/缓动与 CSS 过渡逐参数等价。
	 *
	 * 仅在移动端（<1280px，与 syncMainContentPosition 的 isMobile 判定一致）的
	 * banner/fullscreen 壁纸模式下执行：该入场动画本就只在 <1280px 媒体查询
	 * 内存在，桌面端官方站同样没有。
	 */
	private replayHomeBannerEntrance(): void {
		const mode = this.getCurrentWallpaperMode();
		if (mode !== "banner" && mode !== "fullscreen") {
			return;
		}
		if (window.innerWidth >= 1280) {
			return;
		}

		const bannerWrapper = this.getCachedElement(
			SWUP_SELECTORS.bannerWrapper,
		) as HTMLElement | null;
		if (
			!bannerWrapper ||
			typeof bannerWrapper.animate !== "function" ||
			bannerWrapper.classList.contains("mobile-hide-banner")
		) {
			return;
		}

		// 关键帧对齐 banner.css @media (width < 1280px) 的入场过渡：
		// translateY(-100%)→0（.5s）+ opacity 0→1（.3s），仅 opacity/transform 合成属性
		bannerWrapper.animate(
			[
				{ transform: "translateY(-100%) translateZ(0)" },
				{ transform: "translateY(0) translateZ(0)" },
			],
			{ duration: 500, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" },
		);
		bannerWrapper.animate(
			[{ opacity: "0" }, { opacity: "1" }],
			{ duration: 300, easing: "ease-out" },
		);
	}

	private getCurrentWallpaperMode():
		| "banner"
		| "fullscreen"
		| "overlay"
		| "none" {
		const body = document.body;
		if (
			body.classList.contains("enable-banner") &&
			body.classList.contains("fullscreen-banner")
		) {
			return "fullscreen";
		}
		if (body.classList.contains("enable-banner")) {
			return "banner";
		}
		if (body.classList.contains("wallpaper-transparent")) {
			return "overlay";
		}
		return "none";
	}

	private syncMainContentPosition(isHomePage: boolean): void {
		const mode = this.getCurrentWallpaperMode();
		const mainContentWrapper = this.getCachedElement(
			".absolute.w-full.z-30.pointer-events-none",
		) as HTMLElement | null;
		const bannerWrapper = this.getCachedElement(
			SWUP_SELECTORS.bannerWrapper,
		) as HTMLElement | null;
		if (!mainContentWrapper) {
			return;
		}

		const isMobile = window.innerWidth < 1280;
		mainContentWrapper.classList.remove("mobile-main-no-banner", "no-banner-layout");
		mainContentWrapper.style.removeProperty("min-height");

		if (mode === "fullscreen") {
			if (isMobile && !isHomePage) {
				bannerWrapper?.classList.add("mobile-hide-banner");
				mainContentWrapper.classList.add("mobile-main-no-banner", "no-banner-layout");
				mainContentWrapper.style.position = "";
				mainContentWrapper.style.zIndex = "";
				mainContentWrapper.style.setProperty("top", "5.5rem", "important");
				mainContentWrapper.style.setProperty("margin-top", "0", "important");
				return;
			}

			bannerWrapper?.classList.remove("mobile-hide-banner");
			mainContentWrapper.classList.add("no-banner-layout");
			mainContentWrapper.style.position = "relative";
			mainContentWrapper.style.zIndex = "30";
			mainContentWrapper.style.setProperty("top", "0", "important");
			mainContentWrapper.style.setProperty(
				"margin-top",
				isMobile ? "0" : "1rem",
				"important",
			);
			return;
		}

		mainContentWrapper.style.position = "";
		mainContentWrapper.style.zIndex = "";
		mainContentWrapper.style.setProperty("margin-top", "0", "important");

		if (mode === "banner") {
			if (isMobile && !isHomePage) {
				bannerWrapper?.classList.add("mobile-hide-banner");
				mainContentWrapper.classList.add("mobile-main-no-banner");
				mainContentWrapper.style.setProperty("top", "5.5rem", "important");
				return;
			}

			if (isMobile) {
				bannerWrapper?.classList.remove("mobile-hide-banner");
				mainContentWrapper.style.removeProperty("top");
				mainContentWrapper.style.removeProperty("min-height");
				return;
			}

			bannerWrapper?.classList.remove("mobile-hide-banner");
			mainContentWrapper.style.setProperty(
				"top",
				`${BANNER_HEIGHT}vh`,
				"important",
			);
			return;
		}

		bannerWrapper?.classList.remove("mobile-hide-banner");
		mainContentWrapper.classList.add("no-banner-layout");
		mainContentWrapper.style.setProperty("top", "5.5rem", "important");
	}

	private ensureNavbarVisibleForFullscreen(): void {
		if (this.getCurrentWallpaperMode() !== "fullscreen") {
			return;
		}
		const navbarWrapper = this.getCachedElement(
			SWUP_SELECTORS.navbarWrapper,
		) as HTMLElement | null;
		if (navbarWrapper) {
			navbarWrapper.classList.remove("navbar-hidden");
		}
	}

	private updatePageOverlay(): void {
		const overlay = document.getElementById("banner-page-overlay");
		if (!overlay) {
			return;
		}

		const dataEl = document.getElementById("page-overlay-data");
		if (!dataEl) {
			this.clearOverlay(overlay);
			return;
		}

		const isHome = dataEl.dataset.isHome === "true";
		const mode = dataEl.dataset.wallpaperMode || "";
		const isBannerMode = mode === "banner" || mode === "fullscreen";

		if (isHome || !isBannerMode) {
			this.clearOverlay(overlay);
			return;
		}

		const title = dataEl.dataset.title || "";
		if (!title) {
			this.clearOverlay(overlay);
			return;
		}

		const titleEl = document.getElementById("page-overlay-title");
		const metaEl = document.getElementById("page-overlay-meta");
		const dateEl = document.getElementById("page-overlay-date");
		const categoryEl = document.getElementById("page-overlay-category");
		const wordsEl = document.getElementById("page-overlay-words");
		if (!titleEl || !metaEl || !dateEl || !categoryEl || !wordsEl) {
			return;
		}

		const isPost = dataEl.dataset.isPost === "true";
		const date = dataEl.dataset.date || "";
		const category = dataEl.dataset.category || "";
		const words = dataEl.dataset.words || "";
		const showMeta = isPost && Boolean(date || category || words);

		// 先读 DOM 状态（无布局开销）：判断是否需要重启动画。
		// banner-wrapper 每次切页都会被 Swup 替换，遮罩元素通常是全新的、不带 anim-in，
		// 此时无需强制布局读即可直接播放入场动画；只有元素已带动画类时才需要冲刷一次。
		const hadAnimIn =
			titleEl.classList.contains("anim-in") ||
			metaEl.classList.contains("anim-in");

		// —— 批量写入阶段：集中写完所有文本/类/内联样式，避免逐条交替写触发的多次失效 ——
		titleEl.textContent = title;
		titleEl.classList.remove("anim-in");

		if (showMeta) {
			dateEl.textContent = date;
			categoryEl.textContent = category;
			wordsEl.textContent = words ? `${words} 字` : "";
			metaEl.classList.remove("hidden");
			metaEl.classList.remove("anim-in");
		} else {
			metaEl.classList.add("hidden");
		}

		overlay.style.opacity = "1";
		overlay.style.transform = "";
		overlay.style.filter = "";

		// 仅在需要重启「已存在」的入场动画时才做一次布局读：
		// 原先对 titleEl / metaEl 各读一次 offsetWidth，会在同一帧产生两次强制布局。
		if (hadAnimIn) {
			void overlay.offsetWidth;
		}
		titleEl.classList.add("anim-in");
		if (showMeta) {
			metaEl.classList.add("anim-in");
		}
	}

	private clearOverlay(overlay: HTMLElement): void {
		const titleEl = document.getElementById("page-overlay-title");
		const metaEl = document.getElementById("page-overlay-meta");
		if (titleEl) {
			titleEl.textContent = "";
			titleEl.classList.remove("anim-in");
		}
		if (metaEl) {
			metaEl.classList.add("hidden");
			metaEl.classList.remove("anim-in");
		}
		overlay.style.opacity = "";
		overlay.style.transform = "";
		overlay.style.filter = "";
	}

	/**
	 * 扩展/隐藏页面高度
	 */
	private extendPageHeight(hide: boolean): void {
		const heightExtend = this.getCachedElement(
			SWUP_SELECTORS.pageHeightExtend,
		);
		if (!heightExtend) {
			return;
		}

		// 只在 Banner 模式下启用高度扩展
		// fullscreen/none 模式内容往往不足一屏，如果强行扩展高度，
		// 会导致滚动条在页面过渡期间闪现，引发布局左右抖动
		const isBannerMode = document.body.classList.contains("enable-banner");
		if (!isBannerMode) {
			return;
		}

		if (hide) {
			heightExtend.classList.add("hidden");
		} else {
			heightExtend.classList.remove("hidden");
		}
	}

	/**
	 * 隐藏 TOC
	 */
	private hideTOC(): void {
		const toc = this.getCachedElement(SWUP_SELECTORS.tocWrapper);
		if (toc) {
			toc.classList.add("toc-not-ready");
		}
	}

	/**
	 * 显示 TOC
	 */
	private showTOC(): void {
		const toc = this.getCachedElement(SWUP_SELECTORS.tocWrapper);
		if (toc) {
			toc.classList.remove("toc-not-ready");
		}
	}

	/**
	 * 同步主题状态
	 * 解决从首页进入文章页面时代码块渲染问题
	 */
	private syncThemeState(): void {
		const storedTheme =
			localStorage.getItem(THEME_CONFIG.themeStorageKey) ||
			THEME_CONFIG.lightMode;
		const isDark = storedTheme === THEME_CONFIG.darkMode;
		const expectedTheme = isDark
			? THEME_CONFIG.darkExpressiveTheme
			: THEME_CONFIG.lightExpressiveTheme;

		const currentTheme =
			document.documentElement.getAttribute("data-theme");
		const hasDarkClass =
			document.documentElement.classList.contains("dark");

		// 如果主题不匹配，使用批量更新减少重绘
		if (currentTheme !== expectedTheme || hasDarkClass !== isDark) {
			requestAnimationFrame(() => {
				// 同步 data-theme 属性
				if (currentTheme !== expectedTheme) {
					document.documentElement.setAttribute(
						"data-theme",
						expectedTheme,
					);
				}
				// 同步 dark class
				if (hasDarkClass !== isDark) {
					if (isDark) {
						document.documentElement.classList.add("dark");
					} else {
						document.documentElement.classList.remove("dark");
					}
				}
			});
		}
	}

	/**
	 * 触发页面加载完成事件
	 * 用于初始化评论系统
	 */
	private dispatchPageLoadedEvent(): void {
		setTimeout(() => {
			if (
				document.getElementById("tcomment") ||
				document.getElementById("giscus-container")
			) {
				const pageLoadedEvent = new CustomEvent("mizuki:page:loaded", {
					detail: {
						path: window.location.pathname,
						timestamp: Date.now(),
					},
				});
				document.dispatchEvent(pageLoadedEvent);
				console.log(
					"Layout: 触发 mizuki:page:loaded 事件，路径:",
					window.location.pathname,
				);
			}
		}, ANIMATION_CONFIG.commentInitDelay);
	}

	/**
	 * 更新处理器
	 */
	updateHandlers(handlers: Partial<SwupHookHandlers>): void {
		this.handlers = { ...this.handlers, ...handlers };
	}
}
