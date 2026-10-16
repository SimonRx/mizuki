const DEFAULT_CONFIG = Object.freeze({
	enabled: true,
	lineThreshold: 20,
	previewLines: 10,
	defaultCollapsed: true,
});

function positiveInteger(value, fallback) {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readCodeCollapseConfig(carrier) {
	const dataset = carrier?.dataset ?? {};
	return {
		enabled:
			dataset.codeCollapseEnabled === undefined
				? DEFAULT_CONFIG.enabled
				: dataset.codeCollapseEnabled === "true",
		lineThreshold: positiveInteger(
			dataset.codeCollapseLineThreshold,
			DEFAULT_CONFIG.lineThreshold,
		),
		previewLines: positiveInteger(
			dataset.codeCollapsePreviewLines,
			DEFAULT_CONFIG.previewLines,
		),
		defaultCollapsed:
			dataset.codeCollapseDefaultCollapsed === undefined
				? DEFAULT_CONFIG.defaultCollapsed
				: dataset.codeCollapseDefaultCollapsed === "true",
	};
}

export function shouldAutoCollapse(lineCount, config = DEFAULT_CONFIG) {
	return config.enabled && lineCount >= config.lineThreshold;
}

export class CodeBlockCollapser {
	constructor() {
		this.processedBlocks = new WeakSet();
		this.observer = null;
		// 扫描去重标志：同一帧内多次触发只执行一次
		this.scanQueued = false;
		this.config = readCodeCollapseConfig(
			document.getElementById("config-carrier"),
		);
		// 首次加载：延后到下一帧，避开首屏布局关键路径
		this.scheduleEnhance();
		// 兜底：仅监听文章容器内的动态插入（如加密内容解密后经 innerHTML 注入），
		// 收窄范围并加防抖，不再常驻监听整个 document.body。
		this.observePostContainer();
		// Swup 4 实际派发的是冒号格式事件名，驼峰 swup:pageView 永远不会触发。
		document.addEventListener("swup:page:view", () => {
			// Swup 会整体替换 <main>，容器节点已重建，需重新绑定后再补扫。
			this.observePostContainer();
			this.scheduleEnhance();
		});
	}

	setupCodeBlocks(root = document) {
		if (!this.config.enabled) return;

		// 先收集待处理块，避免边查询边改 DOM
		const pending = [];
		for (const codeBlock of root.querySelectorAll(".expressive-code")) {
			if (this.processedBlocks.has(codeBlock)) continue;
			this.processedBlocks.add(codeBlock);
			pending.push(codeBlock);
		}
		if (pending.length === 0) return;

		// 批量读：本批次只读取一次共享的行高/内边距，供全部代码块复用
		const metrics = this.getPreviewMetrics(pending);
		// 批量写：此后循环内不再调用 getComputedStyle，消除“逐块写→逐块读”的交错重算
		for (const codeBlock of pending) {
			this.enhanceCodeBlock(codeBlock, metrics);
		}
	}

	// 将扫描合并到下一帧执行，避免同一帧内重复触发
	scheduleEnhance() {
		if (this.scanQueued) return;
		this.scanQueued = true;
		requestAnimationFrame(() => {
			this.scanQueued = false;
			this.setupCodeBlocks();
		});
	}

	// 读取本批次代码块共享的预览度量（行高 + 垂直内边距）
	getPreviewMetrics(blocks) {
		// 取任意一个代码块的 pre 作为样本即可：同一批次内所有代码块共享同一套 CSS——
		// LineHeight 来自 --ec-codeLineHt（构建配置固定为 1.5rem），内边距来自主题 CSS——
		// 因此它们在同一时刻的行高/内边距必然一致，单个样本足以代表整批代码块。
		// 注意 1.5rem 会随 HeadTags 的 adjustPageScale 动态调整的根字号换算为像素，
		// 故这里每次批次都重新读取一次，避免缓存跨批次失效（例如窗口缩放后新增代码块）。
		let samplePre = null;
		for (const block of blocks) {
			samplePre = block.querySelector(":scope > .frame > pre");
			if (samplePre) break;
		}

		const sampleLine = samplePre?.querySelector(".ec-line") ?? null;
		const lineHeight = Number.parseFloat(
			sampleLine ? getComputedStyle(sampleLine).lineHeight : "",
		);

		let verticalPadding = Number.NaN;
		if (samplePre) {
			const preStyle = getComputedStyle(samplePre);
			verticalPadding =
				Number.parseFloat(preStyle.paddingTop) +
				Number.parseFloat(preStyle.paddingBottom);
		}

		return {
			lineHeight: Number.isFinite(lineHeight) ? lineHeight : 24,
			verticalPadding: Number.isFinite(verticalPadding) ? verticalPadding : 0,
		};
	}

	enhanceCodeBlock(codeBlock, metrics) {
		const frame = codeBlock.querySelector(":scope > .frame");
		const pre = frame?.querySelector(":scope > pre");
		const lineCount = pre?.querySelectorAll(".ec-line").length ?? 0;

		if (
			!frame ||
			!pre ||
			!shouldAutoCollapse(lineCount, this.config)
		) {
			return;
		}

		const collapsed = this.config.defaultCollapsed;
		codeBlock.classList.add(
			"collapsible",
			"auto-collapsible",
			collapsed ? "collapsed" : "expanded",
		);
		codeBlock.dataset.codeLineCount = String(lineCount);
		codeBlock.style.setProperty(
			"--code-collapse-preview-height",
			this.calculatePreviewHeight(metrics),
		);

		const button = this.createToggleButton();
		frame.append(button);
		this.updateButton(button, collapsed);
		button.addEventListener("click", () => this.toggleCollapse(codeBlock, button));
	}

	// 使用缓存度量纯算术计算预览高度，循环内不再读取计算样式
	calculatePreviewHeight(metrics) {
		const lineHeight = metrics?.lineHeight ?? 24;
		const verticalPadding = metrics?.verticalPadding ?? 0;
		const height =
			lineHeight * this.config.previewLines + verticalPadding;
		return `${height}px`;
	}

	createToggleButton() {
		const button = document.createElement("button");
		button.className = "collapse-toggle-btn";
		button.type = "button";
		button.innerHTML = `
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path fill="currentColor" d="m12 16.2-6.4-6.4 1.4-1.4 5 5 5-5 1.4 1.4z"></path>
			</svg>
		`;
		return button;
	}

	updateButton(button, collapsed) {
		button.setAttribute("aria-expanded", String(!collapsed));
		button.setAttribute(
			"aria-label",
			collapsed ? "展开代码块" : "折叠代码块",
		);
		button.title = collapsed ? "展开代码块" : "折叠代码块";
	}

	toggleCollapse(codeBlock, button) {
		const collapsed = !codeBlock.classList.contains("collapsed");
		codeBlock.classList.toggle("collapsed", collapsed);
		codeBlock.classList.toggle("expanded", !collapsed);
		this.updateButton(button, collapsed);
		document.dispatchEvent(
			new CustomEvent("codeBlockToggle", {
				detail: { collapsed, element: codeBlock },
			}),
		);
	}

	// 仅监听文章容器的子树插入，替代原先对 document.body 的全量监听
	observePostContainer() {
		this.observer?.disconnect();
		const container = document.getElementById("post-container");
		if (!container) return;
		this.observer ??= new MutationObserver((mutations) =>
			this.handleDynamicInsert(mutations),
		);
		this.observer.observe(container, { childList: true, subtree: true });
	}

	// 只有新增节点中确实包含代码块时才安排扫描，其余无关变更直接忽略
	handleDynamicInsert(mutations) {
		if (this.scanQueued) return;
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof Element)) continue;
				if (
					node.matches(".expressive-code") ||
					node.querySelector(".expressive-code")
				) {
					this.scheduleEnhance();
					return;
				}
			}
		}
	}

	collapseAll() {
		for (const block of document.querySelectorAll(
			".expressive-code.auto-collapsible.expanded",
		)) {
			block.querySelector(".collapse-toggle-btn")?.click();
		}
	}

	expandAll() {
		for (const block of document.querySelectorAll(
			".expressive-code.auto-collapsible.collapsed",
		)) {
			block.querySelector(".collapse-toggle-btn")?.click();
		}
	}
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
	const initialize = () => {
		if (window.codeBlockCollapser) return;
		window.codeBlockCollapser = new CodeBlockCollapser();
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initialize, { once: true });
	} else {
		initialize();
	}
}
