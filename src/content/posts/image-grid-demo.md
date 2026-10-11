---
title: "图片网格画廊：语法与完整示例"
published: 2026-07-13
description: "图片网格画廊语法、参数、裁剪、响应式行为、说明文字与灯箱导航的完整指南。"
tags: [Markdown, 画廊, 图片网格, 演示]
category: "示例"
draft: false
---

`:::grid` 是博客的图片画廊容器指令。它将以一致的宽高比将普通 Markdown 图片排列在响应式网格中，并自动启用灯箱查看。可用于文章配图、截图、作品集或小相册。

同一画廊中的图片使用相同的卡片比例。默认情况下，居中裁剪会填满每张卡片并保持每行整齐；点击图片可在灯箱中查看完整原图。每个画廊都有独立的灯箱分组，不会与文章中的其他图片混在一起。

> 本文既是功能文档，也是可视化测试页面。请在桌面、平板和手机宽度下查看示例，然后点击任意图片以验证灯箱分组。

## 最小语法

直接在 `:::grid` 与闭合的 `:::` 之间编写 Markdown 图片：

````markdown
:::grid
![Image description](./image-1.webp)

![Image description](./image-2.webp)
:::
````

每张图片必须独占一个段落，图片之间留一个空行。画廊中只放图片；段落、列表和代码块请写在容器之外。

以下是最小语法的效果。不添加参数时，网格默认使用三列、`16/10` 比例和 `cover` 模式。

:::grid
![最小语法效果：第一张图片](/images/demos/image-grid-demo/landscape-1.webp)

![最小语法效果：第二张图片](/images/demos/image-grid-demo/landscape-2.webp)
:::

## 参数一览

在开始指令后的大括号中编写所有参数：`:::grid{parameter="value"}`。

| 参数 | 允许的值 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `columns` | 从 `1` 到 `6` 的整数 | `3` | 桌面端每行的列数。无效值会回退为 `3`。 |
| `aspect` | 正比例，如 `16/9`、`3/4` 或 `1/1` | `16/10` | 卡片的显示比例，而非原图比例。 |
| `fit` | `cover`、`contain` | `cover` | 图片适配模式。`cover` 会裁剪以填满；`contain` 保留完整图片，可能留出空白。 |

完整示例：

````markdown
:::grid{columns="3" aspect="16/9" fit="cover"}
![First image](./image-1.webp "Optional caption")

![Second image](./image-2.webp "Optional caption")

![Third image](./image-3.webp "Optional caption")
:::
````

以下结果使用了上面的三列横向语法。请对比卡片比例、列数，以及标题优先于 alt 文本作为说明文字的方式：

:::grid{columns="3" aspect="16/9" fit="cover"}
![参数示例：第一张横版图片](/images/demos/image-grid-demo/landscape-1.webp "横版说明 1")

![参数示例：第二张横版图片](/images/demos/image-grid-demo/landscape-2.webp "横版说明 2")

![参数示例：第三张横版图片](/images/demos/image-grid-demo/landscape-3.webp "横版说明 3")
:::

## 说明文字与 Alt 文本

图片的 alt 文本既是无障碍替代文本，也作为默认说明文字。当图片带有可选标题时，标题会优先作为说明文字：

```markdown
![Text used for accessibility](./image.webp "Caption shown below the image")
```

在同一行中，说明文字与每张卡片的底部对齐。换行的说明文字不会让其他卡片浮动到不同高度。诸如 `3:4` 和 `16:9` 的比例文本可以直接写在正文、标题和 alt 文本中，无需转义。

此示例演示了默认的 alt 文本说明、显式标题说明，以及较长说明文字的底部对齐：

:::grid{columns="3" aspect="1/1"}
![这张图片没有标题，因此其 alt 文本作为说明文字](/images/demos/image-grid-demo/square-1.webp)

![第二张带无障碍 alt 文本的方形图片](/images/demos/image-grid-demo/square-2.webp "此标题将作为说明文字显示")

![一张 3:4 海报的无障碍描述](/images/demos/image-grid-demo/square-3.webp "这是一条较长的说明文字，用于检查换行时每条说明文字是否仍与所在卡片的底部对齐")
:::

## 布局与裁剪

桌面布局使用 `columns` 指定的列数。低于 `768px` 时，网格最多使用两列；低于 `480px` 时，切换为一列。卡片容器固定 `aspect` 比例并裁剪圆角，而图片填满卡片，不带主题默认的图片外边距。

- 选择 `cover`：推荐的默认模式。图片从中心裁剪以填满卡片，让画廊看起来更一致。
- 选择 `contain`：显示完整的原图，不做裁剪。当其比例与卡片不同时，会露出主题背景；适合无法裁剪的图片。
- 如需保留完整图片且不留空白，请将 `aspect` 设置为接近原图比例，或将图片单独放入一个网格。

以下示例将相同的竖版图片分别放入 `cover` 和 `contain` 模式的 `16/9` 卡片中。前者会裁剪图片；后者保留完整图片并留出背景空间。

````markdown
:::grid{columns="3" aspect="16/9" fit="cover"}
![Image description](./image-1.webp "Optional caption")

![Image description](./image-2.webp "Optional caption")
:::

:::grid{columns="3" aspect="16/9" fit="contain"}
![Image description](./image-1.webp "Optional caption")

![Image description](./image-2.webp "Optional caption")
:::
````

:::grid{columns="3" aspect="16/9" fit="cover"}
![cover 结果一](/images/demos/image-grid-demo/default-portrait-1.webp "cover：居中裁剪")

![cover 结果二](/images/demos/image-grid-demo/default-portrait-2.webp "cover：填满卡片")

![cover 结果三](/images/demos/image-grid-demo/default-portrait-3.webp "cover：更一致的布局")
:::

:::grid{columns="3" aspect="16/9" fit="contain"}
![contain 结果一](/images/demos/image-grid-demo/default-portrait-1.webp "contain：保留完整原图")

![contain 结果二](/images/demos/image-grid-demo/default-portrait-2.webp "contain：可能出现空白")

![contain 结果三](/images/demos/image-grid-demo/default-portrait-3.webp "contain：适合边缘细节")
:::

## 默认配置

不添加属性时，默认为三列、`16/10` 比例和 `cover` 裁剪。这三张竖版图片用于验证默认裁剪与说明文字。

````markdown
:::grid
![Image description](./image-1.webp)

![Image description](./image-2.webp)

![Image description](./image-3.webp)
:::
````

:::grid
![默认配置：竖版图片一](/images/demos/image-grid-demo/default-portrait-1.webp)

![默认配置：竖版图片二](/images/demos/image-grid-demo/default-portrait-2.webp)

![默认配置：竖版图片三](/images/demos/image-grid-demo/default-portrait-3.webp)
:::

## 三列竖版图片：3:4

使用 `aspect="3/4"` 时，三张竖版图片会填满比例一致的纵向卡片。如果原图比例不同，`cover` 会从中心裁剪其边缘。

````markdown
:::grid{columns="3" aspect="3/4"}
![Portrait image description](./portrait-1.webp)

![Portrait image description](./portrait-2.webp)

![Portrait image description](./portrait-3.webp)
:::
````

:::grid{columns="3" aspect="3/4"}
![3:4 测试图片一](/images/demos/image-grid-demo/default-portrait-1.webp "竖版 1")

![3:4 测试图片二](/images/demos/image-grid-demo/default-portrait-2.webp "竖版 2")

![3:4 测试图片三](/images/demos/image-grid-demo/default-portrait-3.webp "竖版 3")
:::

## 三列横版图片：16:9

这组图片展示了三列布局中常见的视频封面比例。当横版图片接近卡片比例时，裁剪幅度很小。

````markdown
:::grid{columns="3" aspect="16/9"}
![Landscape image description](./landscape-1.webp)

![Landscape image description](./landscape-2.webp)

![Landscape image description](./landscape-3.webp)
:::
````

:::grid{columns="3" aspect="16/9"}
![16:9 测试图片一](/images/demos/image-grid-demo/feature-landscape-1.webp)

![16:9 测试图片二](/images/demos/image-grid-demo/feature-landscape-2.webp)

![16:9 测试图片三](/images/demos/image-grid-demo/feature-landscape-3.webp)
:::

## 两列方形图片：1:1

当需要更大的预览卡片时，两列布局效果很好。第三张图片会移到下一行。最后一行保持网格轨道宽度，而不是拉伸图片填满整行。

````markdown
:::grid{columns="2" aspect="1/1"}
![Square image description](./square-1.webp)

![Square image description](./square-2.webp)

![Square image description](./square-3.webp)
:::
````

:::grid{columns="2" aspect="1/1"}
![1:1 测试图片一](/images/demos/image-grid-demo/mixed-square-1.webp)

![1:1 测试图片二](/images/demos/image-grid-demo/mixed-square-2.webp)

![1:1 测试图片三](/images/demos/image-grid-demo/mixed-square-3.webp)
:::

## 使用 `contain` 的四列布局

`fit="contain"` 不会裁剪原图。当图片比例与卡片比例不同时，主题背景会保持可见。这是有意为之，并非布局问题。它同时验证了四列网格与独立灯箱分组互不干扰。

````markdown
:::grid{columns="4" aspect="16/9" fit="contain"}
![Image description](./image-1.webp)

![Image description](./image-2.webp)

![Image description](./image-3.webp)
:::
````

:::grid{columns="4" aspect="16/9" fit="contain"}
![contain：竖版图片一](/images/demos/image-grid-demo/default-portrait-1.webp)

![contain：竖版图片二](/images/demos/image-grid-demo/default-portrait-2.webp)

![contain：竖版图片三](/images/demos/image-grid-demo/default-portrait-3.webp)
:::

## 单列细节图片

当图片需要更大的阅读尺寸时，单列布局很合适。它在桌面、平板和手机上始终为一列，原图仍可在灯箱中查看。

````markdown
:::grid{columns="1" aspect="16/9"}
![Image description](./detail.webp)
:::
````

:::grid{columns="1" aspect="16/9"}
![单列测试图片](/images/demos/image-grid-demo/feature-landscape-1.webp)
:::

## 稀疏的五列行

五列用于验证更高的列数支持。只有三张图片时，最后一行保持左对齐，不会拉伸图片。

````markdown
:::grid{columns="5" aspect="1/1"}
![Thumbnail description](./thumb-1.webp)

![Thumbnail description](./thumb-2.webp)

![Thumbnail description](./thumb-3.webp)
:::
````

:::grid{columns="5" aspect="1/1"}
![五列测试图片一](/images/demos/image-grid-demo/mixed-square-1.webp)

![五列测试图片二](/images/demos/image-grid-demo/mixed-square-2.webp)

![五列测试图片三](/images/demos/image-grid-demo/mixed-square-3.webp)
:::

## 六列混合图片

六列是当前的最大值。混合横版与竖版图片可验证 `cover` 裁剪、窄卡片上的说明文字以及紧凑的桌面布局。对于可读性强的文章内容，通常两到四列更合适。

````markdown
:::grid{columns="6" aspect="1/1"}
![Image description](./image-1.webp)

![Image description](./image-2.webp)

![Image description](./image-3.webp)

![Image description](./image-4.webp)

![Image description](./image-5.webp)

![Image description](./image-6.webp)
:::
````

:::grid{columns="6" aspect="1/1"}
![六列测试图片一](/images/demos/image-grid-demo/default-portrait-1.webp)

![六列测试图片二](/images/demos/image-grid-demo/default-portrait-2.webp)

![六列测试图片三](/images/demos/image-grid-demo/default-portrait-3.webp)

![六列测试图片四](/images/demos/image-grid-demo/feature-landscape-1.webp)

![六列测试图片五](/images/demos/image-grid-demo/feature-landscape-2.webp)

![六列测试图片六](/images/demos/image-grid-demo/feature-landscape-3.webp)
:::

## 四列方形图片：1:1

四张同比例的方形图片是典型的四列布局。桌面端一行显示全部四张；平板端折叠为两列，手机端折叠为一列。

````markdown
:::grid{columns="4" aspect="1/1"}
![Square image description](./square-1.webp)

![Square image description](./square-2.webp)

![Square image description](./square-3.webp)

![Square image description](./square-4.webp)
:::
````

:::grid{columns="4" aspect="1/1"}
![方形图片一](/images/demos/image-grid-demo/square-1.webp)

![方形图片二](/images/demos/image-grid-demo/square-2.webp)

![方形图片三](/images/demos/image-grid-demo/square-3.webp)

![方形图片四](/images/demos/image-grid-demo/square-4.webp)
:::

## 六列横版图片：16:9

六列横版布局非常适合缩略图预览、作品集和截图索引。即使原图比例略有差异，`cover` 也会一致地填满每张 `16/9` 卡片。

````markdown
:::grid{columns="6" aspect="16/9"}
![Landscape image description](./landscape-1.webp)

![Landscape image description](./landscape-2.webp)

![Landscape image description](./landscape-3.webp)

![Landscape image description](./landscape-4.webp)

![Landscape image description](./landscape-5.webp)

![Landscape image description](./landscape-6.webp)
:::
````

:::grid{columns="6" aspect="16/9"}
![横版图片一](/images/demos/image-grid-demo/landscape-1.webp)

![横版图片二](/images/demos/image-grid-demo/landscape-2.webp)

![横版图片三](/images/demos/image-grid-demo/landscape-3.webp)

![横版图片四](/images/demos/image-grid-demo/landscape-4.webp)

![横版图片五](/images/demos/image-grid-demo/landscape-5.webp)

![横版图片六](/images/demos/image-grid-demo/landscape-6.webp)
:::

## 三列竖版图片：3:4

这组六张竖版图片展示了人物、海报或手机截图的常见布局。图片排成两行三列，说明文字与底部对齐。

````markdown
:::grid{columns="3" aspect="3/4"}
![Portrait image description](./portrait-1.webp)

![Portrait image description](./portrait-2.webp)

![Portrait image description](./portrait-3.webp)

![Portrait image description](./portrait-4.webp)

![Portrait image description](./portrait-5.webp)

![Portrait image description](./portrait-6.webp)
:::
````

:::grid{columns="3" aspect="3/4"}
![竖版图片一](/images/demos/image-grid-demo/portrait-1.webp)

![竖版图片二](/images/demos/image-grid-demo/portrait-2.webp)

![竖版图片三](/images/demos/image-grid-demo/portrait-3.webp)

![竖版图片四](/images/demos/image-grid-demo/portrait-4.webp)

![竖版图片五](/images/demos/image-grid-demo/portrait-5.webp)

![竖版图片六](/images/demos/image-grid-demo/portrait-6.webp)
:::

## 边缘关键内容：`cover` 与灯箱

这些图片在边缘附近包含重要文字或细节。`cover` 会让网格保持整齐，但可能会裁掉这些边缘；点击图片可在灯箱中查看未裁剪的原图。对边缘敏感的图片请使用清晰的说明文字，或改用下面的 `contain`。

````markdown
:::grid{columns="3" aspect="16/9" fit="cover"}
![Edge-critical content](./critical-1.webp "Open the lightbox to view the complete edge content")

![Edge-critical content](./critical-2.webp "Open the lightbox to view the complete edge content")

![Edge-critical content](./critical-3.webp "Open the lightbox to view the complete edge content")
:::
````

:::grid{columns="3" aspect="16/9" fit="cover"}
![第一张边缘关键图片](/images/demos/image-grid-demo/critical-1.webp "在灯箱中查看完整的边缘内容")

![第二张边缘关键图片](/images/demos/image-grid-demo/critical-2.webp "在灯箱中查看完整的边缘内容")

![第三张边缘关键图片](/images/demos/image-grid-demo/critical-3.webp "在灯箱中查看完整的边缘内容")
:::

## 使用 `contain` 处理极端比例

对于横幅、长截图等极端比例的图片，`contain` 会显示完整的原图。与 `cover` 不同，它可能会留出主题背景空间，但绝不会裁剪内容。

````markdown
:::grid{columns="3" aspect="16/9" fit="contain"}
![Complete screenshot description](./wide-1.webp)

![Complete screenshot description](./wide-2.webp)

![Complete screenshot description](./wide-3.webp)
:::
````

:::grid{columns="3" aspect="16/9" fit="contain"}
![极端比例图片一](/images/demos/image-grid-demo/extreme-1.webp)

![极端比例图片二](/images/demos/image-grid-demo/extreme-2.webp)

![极端比例图片三](/images/demos/image-grid-demo/extreme-3.webp)
:::

## 透明图片

透明图片会露出卡片的主题背景。这个单列 `contain` 示例便于检查透明区域、原始边缘和灯箱行为。

````markdown
:::grid{columns="1" aspect="16/9" fit="contain"}
![Transparent image description](./transparent.webp)
:::
````

:::grid{columns="1" aspect="16/9" fit="contain"}
![透明背景测试图片](/images/demos/image-grid-demo/transparent-1.webp)
:::

## 灯箱导航

点击网格中的任意图片即可打开 Fancybox 灯箱。你可以缩放、旋转、进入全屏、查看缩略图，并使用方向键导航。导航范围仅限于当前的 `:::grid` 容器：例如，点击"16:9 测试图片一"只会打开该小节中的另外两张横版图片。

文章中的普通 Markdown 图片仍会单独处理，不会加入任何网格画廊。

## 检查清单

1. 每个网格中的图片尺寸一致，说明文字位于卡片下方。
2. 图片在悬停时会轻微缩放；点击后可用键盘进行缩放、旋转和导航。
3. 点击"16:9 测试图片一"时，灯箱只会浏览该小节中的另外两张横版图片。
4. 低于 768px 时，网格最多使用两列；低于 480px 时使用一列。
5. "使用 `contain` 的四列布局"中的竖版图片完整可见，带空白且无裁剪。
6. 五列和六列网格在宽屏上保持指定的列数，随后根据响应式规则折叠为两列或一列。
