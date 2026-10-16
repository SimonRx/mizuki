/**
 * TOC (Table of Contents) 工具类
 * 用于 CardTOC 的 TOC 逻辑
 * 基于 Firefly 项目的 TOCManager 实现
 */

import { JAPANESE_KATAKANA } from "../components/features/toc/utils/japanese-katakana";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";

export interface TOCConfig {
	contentId?: string;
	contentElement?: HTMLElement;
	maxLevel?: number;
	scrollOffset?: number;
	useJapaneseBadge?: boolean;
}

export class TOCManager {
	private tocItems: HTMLElement[] = [];
	private observer: IntersectionObserver | null = null;
	private minDepth = 10;
	private maxLevel: number;
	private scrollTimeout: number | null = null;
	private contentId: string | null;
	private contentElement: HTMLElement | null;
	private scrollOffset: number;
	private useJapaneseBadge: boolean;
	private boundClickHandler: ((event: Event) => void) | null = null;
	// 逐项 visible 类的上次应用状态，用于差量更新（避免每次滚动 N 次逐个写）
	private visibleMask: boolean[] | null = null;
	// 容器级高亮开关的当前状态
	private hasActiveClass = false;

	constructor(config: TOCConfig) {
		this.contentId = config.contentId ?? null;
		this.contentElement = config.contentElement ?? null;
		this.maxLevel = config.maxLevel || 3;
		this.scrollOffset = config.scrollOffset || 80;
		this.useJapaneseBadge = config.useJapaneseBadge ?? false;
	}

	/**
	 * 获取当前实例绑定的 TOC 容器。
	 * 优先使用实例级元素引用，避免多实例时因为重复 id 命中错误节点。
	 */
	private getTOCContentElement(): HTMLElement | null {
		if (this.contentElement) {
			return this.contentElement;
		}

		if (!this.contentId) {
			return null;
		}

		return document.getElementById(this.contentId);
	}

	/**
	 * 获取当前实例内部的活动指示器。
	 * 指示器限定在当前内容容器内查询，避免多个目录组件互相污染。
	 */
	private getIndicatorElement(): HTMLElement | null {
		return this.getTOCContentElement()?.querySelector(
			"[data-card-toc-indicator]",
		) as HTMLElement | null;
	}

	private getContentContainer(): Element | null {
		return (
			document.querySelector(".custom-md") ||
			document.querySelector(".prose") ||
			document.querySelector(".markdown-content")
		);
	}

	private getAllHeadings(): HTMLElement[] {
		const contentContainer = this.getContentContainer();
		if (!contentContainer) {
			return [];
		}
		return Array.from(
			contentContainer.querySelectorAll("h1, h2, h3, h4, h5, h6"),
		);
	}

	private calculateMinDepth(headings: HTMLElement[]): number {
		let minDepth = 10;
		headings.forEach((heading) => {
			const depth = Number.parseInt(heading.tagName.charAt(1), 10);
			minDepth = Math.min(minDepth, depth);
		});
		return minDepth;
	}

	private filterHeadings(headings: HTMLElement[]): HTMLElement[] {
		return Array.from(headings).filter((heading) => {
			const depth = Number.parseInt(heading.tagName.charAt(1), 10);
			return depth < this.minDepth + this.maxLevel;
		});
	}

	private getCleanTextContent(element: HTMLElement): string {
		const clone = element.cloneNode(true) as HTMLElement;
		for (const el of clone.querySelectorAll("script, style")) {
			el.remove();
		}
		return clone.textContent || "";
	}

	private escapeHtmlAttr(value: string): string {
		return value
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	private generateBadgeContent(depth: number, heading1Count: number): string {
		if (depth === this.minDepth) {
			if (
				this.useJapaneseBadge &&
				heading1Count - 1 < JAPANESE_KATAKANA.length
			) {
				return JAPANESE_KATAKANA[heading1Count - 1];
			}
			return heading1Count.toString();
		}
		if (depth === this.minDepth + 1) {
			return '<span class="toc-badge-dot"></span>';
		}
		return '<span class="toc-badge-dot toc-badge-dot-sm"></span>';
	}

	private getEmptyStateHTML(): string {
		return `<div class="text-center py-8 text-gray-500 dark:text-gray-400"><p>${i18n(I18nKey.tocEmpty)}</p></div>`;
	}

	public generateTOCHTML(): string {
		const headings = this.getAllHeadings();

		if (headings.length === 0) {
			return this.getEmptyStateHTML();
		}

		this.minDepth = this.calculateMinDepth(headings);
		const filteredHeadings = this.filterHeadings(headings);

		if (filteredHeadings.length === 0) {
			return this.getEmptyStateHTML();
		}

		let tocHTML = "";
		let heading1Count = 1;

		filteredHeadings.forEach((heading) => {
			const depth = Number.parseInt(heading.tagName.charAt(1), 10);
			const depthLevel =
				depth === this.minDepth ? 0 : depth === this.minDepth + 1 ? 1 : 2;

			if (!heading.id) {
				return;
			}

			const badgeContent = this.generateBadgeContent(depth, heading1Count);
			if (depth === this.minDepth) {
				heading1Count++;
			}

			let headingText = this.getCleanTextContent(heading)
				.replace(/#+\s*$/, "")
				.trim();

			if (!headingText) {
				const dataSubtitles = heading.getAttribute("data-subtitles");
				if (dataSubtitles) {
					try {
						const subtitles = JSON.parse(dataSubtitles);
						headingText = Array.isArray(subtitles) ? subtitles[0] : subtitles;
					} catch {
						// ignore
					}
				}
			}

			if (!headingText) {
				headingText =
					heading.id === "banner-subtitle"
						? "Banner Subtitle"
						: heading.id || "Heading";
			}

			const escapedHeadingText = this.escapeHtmlAttr(headingText);

			tocHTML += `
        <a 
          href="#${heading.id}" 
			  class="toc-item toc-level-${depthLevel}"
          data-heading-id="${heading.id}"
		  aria-label="${escapedHeadingText}"
		  title="${escapedHeadingText}"
        >
			  <div class="toc-badge ${depth === this.minDepth ? "toc-badge-index" : ""}">
            ${badgeContent}
          </div>
			  <div class="toc-label ${depth <= this.minDepth + 1 ? "toc-label-primary" : "toc-label-secondary"}">${headingText}</div>
        </a>
      `;
		});

		// 指示器不再内联 opacity：显隐改由容器级 class 驱动（见 toc.css .toc-has-active）
		tocHTML +=
			'<div data-card-toc-indicator class="toc-active-indicator"></div>';

		return tocHTML;
	}

	public updateTOCContent(): void {
		const tocContent = this.getTOCContentElement();
		if (!tocContent) {
			return;
		}

		tocContent.innerHTML = this.generateTOCHTML();
		this.tocItems = Array.from(tocContent.querySelectorAll("a"));
		// 内容重建后逐项状态与指示器均是新的，重置差量缓存以便下次全量建立
		this.visibleMask = null;
	}

	/**
	 * 根据预先一次性读取好的标题位置计算可见标题 id。
	 * 位置信息由调用方在读取阶段传入，避免在比较过程中再次读取 rect。
	 */
	private getVisibleHeadingIds(
		headingInfos: { id: string; rect: DOMRect }[],
	): string[] {
		const visibleHeadingIds: string[] = [];

		headingInfos.forEach(({ id, rect }) => {
			if (id) {
				const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

				if (isVisible) {
					visibleHeadingIds.push(id);
				}
			}
		});

		if (visibleHeadingIds.length === 0 && headingInfos.length > 0) {
			let closestHeading: string | null = null;
			let minDistance = Number.POSITIVE_INFINITY;

			headingInfos.forEach(({ id, rect }) => {
				if (id) {
					const distance = Math.abs(rect.top);

					if (distance < minDistance) {
						minDistance = distance;
						closestHeading = id;
					}
				}
			});

			if (closestHeading) {
				visibleHeadingIds.push(closestHeading);
			}
		}

		return visibleHeadingIds;
	}

	public updateActiveState(): void {
		if (!this.tocItems || this.tocItems.length === 0) {
			return;
		}

		// 读取阶段：一次性读取所有标题与所有目录项的位置，写入阶段不再读 rect
		const headings = this.getAllHeadings();
		const headingInfos = headings.map((heading) => ({
			id: heading.id,
			rect: heading.getBoundingClientRect(),
		}));
		const tocContent = this.getTOCContentElement();
		const contentRect = tocContent ? tocContent.getBoundingClientRect() : null;
		const indicator = this.getIndicatorElement();
		const itemRects = this.tocItems.map((item) => item.getBoundingClientRect());

		const visibleHeadingIds = this.getVisibleHeadingIds(headingInfos);

		// 目标可见集合用布尔掩码表示，供差量合并使用
		const desiredVisible = new Array(this.tocItems.length).fill(
			false,
		) as boolean[];
		this.tocItems.forEach((item, index) => {
			const headingId = item.dataset.headingId;
			if (headingId && visibleHeadingIds.includes(headingId)) {
				desiredVisible[index] = true;
			}
		});

		// 写入阶段：差量合并 visible 类——只写状态发生变化的那几项，集合不变时零写入
		if (!this.visibleMask || this.visibleMask.length !== this.tocItems.length) {
			this.visibleMask = new Array(this.tocItems.length).fill(
				false,
			) as boolean[];
		}
		for (let i = 0; i < this.tocItems.length; i++) {
			if (desiredVisible[i] !== this.visibleMask[i]) {
				this.tocItems[i].classList.toggle("visible", desiredVisible[i]);
				this.visibleMask[i] = desiredVisible[i];
			}
		}

		// 写入阶段：容器级高亮开关——一次 class 切换驱动指示器显隐，仅状态变化时写
		const hasActive = desiredVisible.includes(true);
		if (tocContent && hasActive !== this.hasActiveClass) {
			tocContent.classList.toggle("toc-has-active", hasActive);
			this.hasActiveClass = hasActive;
		}

		// 写入阶段：统一下发已缓存的 rect，避免写 class 后立刻读 rect
		this.updateActiveIndicator(
			indicator,
			desiredVisible,
			itemRects,
			contentRect,
		);
	}

	private updateActiveIndicator(
		indicator: HTMLElement | null,
		visibleMask: boolean[],
		itemRects: DOMRect[],
		contentRect: DOMRect | null,
	): void {
		if (!indicator || !this.tocItems.length) {
			return;
		}

		// 从掩码中取首个/末个可见项（活动集合在设计上是连续的）
		let firstIndex = -1;
		let lastIndex = -1;
		for (let i = 0; i < visibleMask.length; i++) {
			if (visibleMask[i]) {
				if (firstIndex < 0) {
					firstIndex = i;
				}
				lastIndex = i;
			}
		}

		// 无活动项时指示器由容器级 class 隐藏，这里无需写任何样式
		if (firstIndex < 0 || !contentRect) {
			return;
		}

		const firstRect = itemRects[firstIndex];
		const lastRect = itemRects[lastIndex];
		if (!firstRect || !lastRect || firstRect.height <= 0) {
			return;
		}

		// 写入阶段：位置继续走合成属性 translateY（无失真），高度改回动态 height
		const top = firstRect.top - contentRect.top;
		const height = lastRect.bottom - firstRect.top;

		indicator.style.transform = `translateY(${top}px)`;
		indicator.style.height = `${height}px`;

		this.scrollToActiveItem(this.tocItems[firstIndex]);
	}

	private scrollToActiveItem(activeItem: HTMLElement): void {
		if (!activeItem) {
			return;
		}

		const tocContainer = activeItem.closest(".toc-scroll-container");
		if (!tocContainer) {
			return;
		}

		if (this.scrollTimeout) {
			clearTimeout(this.scrollTimeout);
		}

		this.scrollTimeout = window.setTimeout(() => {
			// 读取阶段：一次性读取容器与目标项的位置/尺寸
			const containerRect = tocContainer.getBoundingClientRect();
			const itemRect = activeItem.getBoundingClientRect();
			const itemOffsetTop = (activeItem as HTMLElement).offsetTop;
			const containerHeight = tocContainer.clientHeight;
			const itemHeight = activeItem.clientHeight;

			const isVisible =
				itemRect.top >= containerRect.top &&
				itemRect.bottom <= containerRect.bottom;

			if (isVisible) {
				return;
			}

			// 写入阶段：滚动容器
			const targetScroll = itemOffsetTop - containerHeight / 2 + itemHeight / 2;

			tocContainer.scrollTo({
				top: targetScroll,
				behavior: "smooth",
			});
		}, 100);
	}

	public handleClick(event: Event): void {
		event.preventDefault();
		const target = event.currentTarget as HTMLAnchorElement;
		const id = decodeURIComponent(
			target.getAttribute("href")?.substring(1) || "",
		);
		const targetElement = document.getElementById(id);

		if (targetElement) {
			const targetTop =
				targetElement.getBoundingClientRect().top +
				window.pageYOffset -
				this.scrollOffset;

			window.scrollTo({
				top: targetTop,
				behavior: "smooth",
			});
		}
	}

	public setupObserver(): void {
		const headings = this.getAllHeadings();

		if (this.observer) {
			this.observer.disconnect();
		}

		this.observer = new IntersectionObserver(
			() => {
				this.updateActiveState();
			},
			{
				rootMargin: "0px 0px 0px 0px",
				threshold: 0,
			},
		);

		headings.forEach((heading) => {
			if (heading.id) {
				this.observer?.observe(heading);
			}
		});
	}

	public bindClickEvents(): void {
		this.unbindClickEvents();
		this.boundClickHandler = this.handleClick.bind(this);
		this.tocItems.forEach((item) => {
			item.addEventListener("click", this.boundClickHandler!);
		});
	}

	private unbindClickEvents(): void {
		if (this.boundClickHandler) {
			this.tocItems.forEach((item) => {
				item.removeEventListener("click", this.boundClickHandler!);
			});
			this.boundClickHandler = null;
		}
	}

	public cleanup(): void {
		this.unbindClickEvents();
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.scrollTimeout) {
			clearTimeout(this.scrollTimeout);
			this.scrollTimeout = null;
		}
	}

	public init(): void {
		this.updateTOCContent();
		this.bindClickEvents();
		this.setupObserver();
		this.updateActiveState();
	}
}

export function isPostPage(): boolean {
	return window.location.pathname.includes("/posts/");
}
