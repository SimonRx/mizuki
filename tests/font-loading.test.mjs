import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { describe, it } from "node:test";

const astroConfig = await readFile(
	new URL("../astro.config.mjs", import.meta.url),
	"utf8",
);
const layoutSource = await readFile(
	new URL("../src/layouts/Layout.astro", import.meta.url),
	"utf8",
);
const mainStyles = await readFile(
	new URL("../src/styles/main.css", import.meta.url),
	"utf8",
);
const fontsStyles = await readFile(
	new URL("../src/styles/fonts.css", import.meta.url),
	"utf8",
);
const configTypes = await readFile(
	new URL("../src/types/config.ts", import.meta.url),
	"utf8",
);
const fontModeSource = await readFile(
	new URL("../src/utils/fontMode.ts", import.meta.url),
	"utf8",
);
const fontCheckSource = await readFile(
	new URL("../scripts/check-font-loading.mjs", import.meta.url),
	"utf8",
);

const loliSlices = (
	await readdir(new URL("../public/fonts/loli", import.meta.url))
).filter((file) => file.endsWith(".woff2"));
const zenmaruFiles = (
	await readdir(new URL("../public/fonts", import.meta.url))
).filter((file) => file.endsWith(".woff2"));

describe("Custom font loading boundary", () => {
	it("slices loli into many self-hosted unicode-range WOFF2 chunks", async () => {
		assert.ok(loliSlices.length > 50, `expected many loli slices, got ${loliSlices.length}`);
		for (const name of loliSlices) {
			const font = await readFile(new URL(`../public/fonts/loli/${name}`, import.meta.url));
			assert.equal(font.subarray(0, 4).toString("ascii"), "wOF2", `${name} must be woff2`);
		}
		assert.match(fontsStyles, /font-family: "Loli"/);
		assert.match(fontsStyles, /font-weight: 400/);
	});

	it("subsets ZenMaru to a single Latin/kana WOFF2 chunk", async () => {
		assert.equal(zenmaruFiles.length, 1);
		const font = await readFile(
			new URL(`../public/fonts/${zenmaruFiles[0]}`, import.meta.url),
		);
		assert.equal(font.subarray(0, 4).toString("ascii"), "wOF2");
		assert.match(fontsStyles, /font-family: "ZenMaruGothic-Medium"/);
		assert.match(fontsStyles, /font-weight: 500/);
		assert.match(fontsStyles, /unicode-range: U\+20-7E/);
	});

	it("keeps the ZenMaru -> Loli fallback order in --font-sans", () => {
		const bodyIndex = mainStyles.indexOf("var(--font-body");
		const cjkIndex = mainStyles.indexOf("var(--font-cjk");
		assert.ok(bodyIndex >= 0 && cjkIndex > bodyIndex);
		assert.match(layoutSource, /--font-body: "ZenMaruGothic-Medium"/);
		assert.match(layoutSource, /--font-cjk: "Loli"/);
	});

	it("no longer wires local fonts through the Astro Font API", () => {
		assert.doesNotMatch(astroConfig, /\.\/src\/assets\/fonts\//);
		assert.doesNotMatch(astroConfig, /\.ttf/);
		assert.equal(
			(layoutSource.match(/customFontsEnabled\s*&&\s*<Font/g) ?? []).length,
			1,
		);
	});

	it("only renders Astro Font components when custom mode is enabled", () => {
		assert.match(astroConfig, /fonts:\s*customFontsEnabled\s*\?\s*\[/);
	});

	it("defaults older configurations without a font block to custom mode", () => {
		assert.match(configTypes, /font\?:\s*{\s*mode\?:\s*"custom" \| "system"/);
		assert.match(
			fontModeSource,
			/environmentMode\s*\?\?\s*config\.font\?\.mode\s*\?\?\s*"custom"/,
		);
	});

	it("checks the font files referenced by output instead of a fixed directory", () => {
		assert.match(fontCheckSource, /FONT_REFERENCE_PATTERN/);
		assert.match(fontCheckSource, /CUSTOM_FONT_VARIABLE_PATTERN/);
		assert.match(fontCheckSource, /referencedFontFiles/);
		assert.match(fontCheckSource, /public/, "must scan public/fonts for sliced fonts");
	});
});
