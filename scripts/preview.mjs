/**
 * 本地生产预览服务器
 *
 * astro preview 对所有响应发 Cache-Control: no-cache, no-store，
 * 导致预览时字体每次切页都要重新验证、SPA 导航必然闪字体。
 * 本服务器按资源类型差异化缓存，模拟真实生产平台的缓存行为：
 *   - /fonts/* 与 /_astro/*（内容哈希命名）→ immutable 强缓存，切页零请求
 *   - HTML → no-cache，保证重建后预览始终是最新内容
 *   - 其他静态资源 → 1 小时缓存
 *
 * 运行：pnpm preview [--port 3000] [--host 0.0.0.0]
 */
import { createServer } from "node:http";
import { createGzip } from "node:zlib";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".xml": "application/xml; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".ico": "image/x-icon",
	".avif": "image/avif",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".txt": "text/plain; charset=utf-8",
	".wasm": "application/wasm",
	".mp3": "audio/mpeg",
	".mp4": "video/mp4",
};

const FONT_EXT = new Set([".woff", ".woff2", ".ttf", ".otf"]);
// 文本类资源支持 gzip（模拟生产服务器压缩，woff2/webp 等二进制已是压缩格式不重复压）
const COMPRESSIBLE_EXT = new Set([".html", ".css", ".js", ".mjs", ".json", ".xml", ".svg", ".txt"]);
const IMMUTABLE = "public, max-age=31536000, immutable";
const HTML_CACHE = "no-cache";
const DEFAULT_CACHE = "public, max-age=3600";

function cacheControl(pathname) {
	const ext = extname(pathname).toLowerCase();
	if (FONT_EXT.has(ext) || pathname.includes("/_astro/")) {
		return IMMUTABLE;
	}
	if (ext === ".html" || extname(pathname) === "") {
		return HTML_CACHE;
	}
	return DEFAULT_CACHE;
}

function readArg(name, fallback) {
	const i = process.argv.indexOf(name);
	return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const PORT = Number(readArg("--port", "3000"));
const HOST = readArg("--host", "0.0.0.0");
// DISABLE_GZIP=1 时禁用压缩，用于 Lighthouse 压缩/未压缩对照跑分
const GZIP_ENABLED = process.env.DISABLE_GZIP !== "1";

const server = createServer((req, res) => {
	const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
	let pathname;
	try {
		pathname = decodeURIComponent(url.pathname);
	} catch {
		res.writeHead(400).end("Bad Request");
		return;
	}
	if (pathname.endsWith("/")) pathname += "index.html";
	const rel = normalize(pathname).replace(/^[/\\]+/, "");
	const file = resolve(DIST, rel);
	// 路径穿越防护：解析后必须仍在 dist 内
	if (file !== DIST && !file.startsWith(DIST + "\\") && !file.startsWith(DIST + "/")) {
		res.writeHead(403).end("Forbidden");
		return;
	}

	if (!existsSync(file) || !statSync(file).isFile()) {
		res.writeHead(404).end("Not Found");
		return;
	}

	const ext = extname(file).toLowerCase();
	const acceptsGzip = GZIP_ENABLED && (req.headers["accept-encoding"] || "").includes("gzip");
	if (acceptsGzip && COMPRESSIBLE_EXT.has(ext)) {
		res.writeHead(200, {
			"Content-Type": MIME[ext] || "application/octet-stream",
			"Cache-Control": cacheControl(pathname),
			"Content-Encoding": "gzip",
			"Vary": "Accept-Encoding",
		});
		createReadStream(file).pipe(createGzip()).pipe(res);
		return;
	}
	res.writeHead(200, {
		"Content-Type": MIME[ext] || "application/octet-stream",
		"Cache-Control": cacheControl(pathname),
	});
	createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
	console.log(`Preview serving ${DIST}`);
	console.log(`  Local    http://localhost:${PORT}/`);
	if (HOST !== "localhost") console.log(`  Network  http://${HOST}:${PORT}/`);
	console.log(`  字体/_astro 资源 → ${IMMUTABLE}（模拟生产缓存）`);
});
