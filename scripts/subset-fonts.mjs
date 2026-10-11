/**
 * 字体子集化脚本（全站静态子集化方案）
 *
 * 1. loli.ttf —— 扫描全站静态文本（src/content + UI 词表 + 配置/组件/数据文件），
 *    用 subset-font 生成单个静态子集 woff2。SPA 切页时所有页面字符已就绪，
 *    不再需要运行时 prefetch / used-chunks / unicode-range 切片。
 * 2. ZenMaruGothic-Medium.ttf —— 静态子集化（拉丁 + 标点 + 假名），单文件 woff2。
 * 3. 生成组合 CSS src/styles/fonts.css（@font-face 使用绝对 /fonts/ 路径）。
 *
 * 运行：pnpm subset-fonts（构建链中位于 update-anime 之后、astro build 之前）
 */
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";
import { glob } from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FONTS_DIR = join(ROOT, "public", "fonts");
const LOLI_TTF = join(ROOT, "src", "assets", "fonts", "loli.ttf");
const LOLI_OUT = join(FONTS_DIR, "loli"); // 旧切片目录（清理）
const ZENMARU_TTF = join(ROOT, "src", "assets", "fonts", "ZenMaruGothic-Medium.ttf");
const FONTS_CSS = join(ROOT, "src", "styles", "fonts.css");

function hash8(buf) {
	return createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

function fmtBytes(n) {
	return `${(n / 1024).toFixed(1)}KB`;
}

function rmIfExists(p) {
	if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

/** 提取源码中的字符串字面量（双引号 / 单引号 / 模板串），合并返回 */
function extractStringLiterals(text) {
	const out = [];
	const re = /(["'`])((?:\\\1|(?:(?!\1).))*)\1/g;
	let m;
	while ((m = re.exec(text))) out.push(m[2]);
	return out.join("");
}

/** 读取 siteConfig.ts 中的语言代码（lang: "xx"），用于选择 i18n 语言包 */
function getSiteLang() {
	try {
		const text = readFileSync(join(ROOT, "src", "config", "siteConfig.ts"), "utf8");
		const m = text.match(/lang:\s*["']([^"']+)["']/);
		if (m) return m[1];
		const m2 = text.match(/const\s+SITE_LANG\s*=\s*["']([^"']+)["']/);
		if (m2) return m2[1];
	} catch {}
	return "zh_CN";
}

/** 读取 anime 模式，决定数据文件来源 */
function getAnimeMode() {
	try {
		const text = readFileSync(join(ROOT, "src", "config", "siteConfig.ts"), "utf8");
		const m = text.match(/anime\s*:\s*\{[^}]*mode\s*:\s*["']([^"']+)["']/);
		if (m) return m[1];
	} catch {}
	return "local";
}

/**
 * 扫描全站静态文本字符集。
 * 覆盖：src/content 全部、活跃 i18n 语言包、src/config 字符串、src/components 与
 * src/pages 的字符串字面量（静态 UI 文案）、src/data 静态数据。
 * 动态区域（评论/搜索关键词/播放器 API 数据/Pio 台词）不纳入，运行时走系统字体。
 */
async function collectStaticCharset() {
	const cps = new Set();
	const addText = (text) => {
		for (const ch of text) cps.add(ch.codePointAt(0));
	};

	// 1) 文章内容（含 frontmatter）
	const contentFiles = await glob("src/content/**/*.{md,mdx}", {
		cwd: ROOT,
		absolute: true,
	});
	for (const f of contentFiles) addText(readFileSync(f, "utf8"));

	// 2) 活跃 i18n 语言包（lang: zh_CN → zh_CN.ts）
	const lang = getSiteLang().toLowerCase().replace("-", "_");
	const langFile = join(ROOT, "src", "i18n", "languages", `${lang}.ts`);
	if (existsSync(langFile)) {
		addText(extractStringLiterals(readFileSync(langFile, "utf8")));
	} else {
		// 回退默认语言包
		addText(
			extractStringLiterals(
				readFileSync(join(ROOT, "src", "i18n", "languages", "zh_CN.ts"), "utf8"),
			),
		);
	}

	// 3) src/config 字符串（导航、个人资料、公告、页脚等）
	const configFiles = await glob("src/config/**/*.{ts,mjs}", {
		cwd: ROOT,
		absolute: true,
	});
	for (const f of configFiles) {
		addText(extractStringLiterals(readFileSync(f, "utf8")));
	}

	// 4) 组件与页面模板：全文扫描（捕获模板内硬编码中文文本），
	//    排除动态区域组件与 OG 页面。
	//    - 动态区域（评论/搜索/播放器/Pio）的静态 UI 文案已由 i18n 语言包覆盖，
	//      其运行时 UGC/API 数据不纳入字符集，走系统字体。
	//    - 动态数据（Meting/API 歌单、pagefind 关键词等）不可预测，不纳入。
	const compFiles = await glob("src/{components,pages}/**/*.{svelte,astro,ts}", {
		cwd: ROOT,
		absolute: true,
	});
	const DYNAMIC_DIRS = ["comment", "search", "pio", "music-player", "music-sidebar", "og"];
	for (const f of compFiles) {
		const lower = f.toLowerCase();
		if (DYNAMIC_DIRS.some((d) => lower.includes(d))) continue;
		addText(readFileSync(f, "utf8"));
	}

	// 5) src/data 静态数据
	//    friends.ts：手写静态，始终纳入
	//    anime：mode=local 时手写 anime.ts；bangumi/bilibili 时数据由 update-anime
	//    写入 *.json，构建期扫描（脚本位于 update-anime 之后执行）
	const dataFiles = await glob("src/data/**/*.{ts,json}", {
		cwd: ROOT,
		absolute: true,
	});
	for (const f of dataFiles) {
		const base = f.toLowerCase();
		if (base.endsWith("anime.ts") && getAnimeMode() !== "local") continue;
		addText(extractStringLiterals(readFileSync(f, "utf8")));
	}

	return cps;
}

/** 2) ZenMaruGothic 静态子集化（拉丁 + 标点 + 假名） */
async function subsetZenMaru() {
	console.log("▶ subsetting ZenMaruGothic-Medium.ttf ...");
	const ttf = readFileSync(ZENMARU_TTF);

	const chars = new Set();
	for (let i = 0x20; i <= 0x7e; i++) chars.add(i);
	for (let i = 0xa0; i <= 0xff; i++) chars.add(i);
	for (let i = 0x100; i <= 0x17f; i++) chars.add(i);
	for (let i = 0x2000; i <= 0x206f; i++) chars.add(i);
	for (let i = 0x3000; i <= 0x303f; i++) chars.add(i);
	for (let i = 0x3040; i <= 0x30ff; i++) chars.add(i);
	for (let i = 0x31f0; i <= 0x31ff; i++) chars.add(i);
	for (let i = 0xff66; i <= 0xff9f; i++) chars.add(i);

	const charsetStr = [...chars].map((c) => String.fromCodePoint(c)).join("");
	const out = await subsetFont(ttf, charsetStr, { targetFormat: "woff2" });
	const name = `zenmaru-${hash8(out)}.woff2`;
	writeFileSync(join(FONTS_DIR, name), out);

	const unicodeRange = [
		"U+20-7E",
		"U+A0-FF",
		"U+100-17F",
		"U+2000-206F",
		"U+3000-303F",
		"U+3040-30FF",
		"U+31F0-31FF",
		"U+FF66-FF9F",
	].join(", ");

	const css = `@font-face {
  font-family: "ZenMaruGothic-Medium";
  src: url("/fonts/${name}") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: optional;
  unicode-range: ${unicodeRange};
}
`;

	return { css, name, size: out.byteLength };
}

/**
 * 1) Loli 全站静态子集化。
 * 单文件覆盖全站静态字符：构建期一次生成，SPA 切页零新增请求。
 * font-display: swap —— 冷缓存首访下载完成后替换，保证最终一定显示 Loli
 * （optional 在慢网首访可能 100ms 窗口超时被丢弃，全程显示系统字体）。
 */
async function subsetLoli() {
	console.log("▶ collecting static charset ...");
	const cps = await collectStaticCharset();

	const charsetStr = [...cps].map((c) => String.fromCodePoint(c)).join("");
	console.log(`  static charset: ${cps.size} 个去重字符`);

	const ttf = readFileSync(LOLI_TTF);
	const out = await subsetFont(ttf, charsetStr, { targetFormat: "woff2" });
	const name = `loli-static-${hash8(out)}.woff2`;
	writeFileSync(join(FONTS_DIR, name), out);

	const css = `@font-face {
  font-family: "Loli";
  src: url("/fonts/${name}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
`;

	return { css, name, size: out.byteLength };
}

/** 3) 汇总输出 + 清理旧切片 */
async function main() {
	// 清理旧的 unicode-range 切片目录与 used-chunks manifest
	rmIfExists(LOLI_OUT);
	rmIfExists(join(LOLI_OUT, "used-chunks.json"));

	const { css: zenCss, name: zenName, size: zenSize } = await subsetZenMaru();
	const { css: loliCss, name: loliName, size: loliSize } = await subsetLoli();

	const combined = `/* 由 scripts/subset-fonts.mjs 生成，请勿手改。 */\n${zenCss}\n${loliCss}`;
	writeFileSync(FONTS_CSS, combined);

	console.log("\n✔ 完成：");
	console.log(`  Loli 静态子集：${loliName}（${fmtBytes(loliSize)}）`);
	console.log(`  ZenMaru 子集：${zenName}（${fmtBytes(zenSize)}）`);
	console.log(`  组合 CSS：${FONTS_CSS}`);
	console.log(`  全部字体预算：${fmtBytes(loliSize + zenSize)}`);
	console.log(`  旧切片目录已清理：${LOLI_OUT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
