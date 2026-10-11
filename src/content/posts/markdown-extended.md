---
title: Markdown 扩展特性
published: 2024-05-01
updated: 2026-07-30
description: 'Mizuki 中的 GitHub 卡片、提示框、代码组、Wiki 链接、图片网格、PlantUML 以及其他增强型 Markdown 特性。'
image: ''
tags: [演示, 示例, Markdown, Mizuki]
category: '示例'
draft: false 
---

## GitHub 仓库卡片
你可以添加链接到 GitHub 仓库的动态卡片，页面加载时会从 GitHub API 拉取仓库信息。

::github{repo="LyraVoid/Mizuki"}

使用 `::github{repo="LyraVoid/Mizuki"}` 代码创建 GitHub 仓库卡片。

```markdown
::github{repo="LyraVoid/Mizuki"}
```

## 提示框

支持以下类型的提示框：`note` `tip` `important` `warning` `caution`

:::note
突出强调用户即使快速浏览也应留意的信息。
:::

:::tip
帮助用户更顺利操作的补充信息。
:::

:::important
用户成功所需的关键信息。
:::

:::warning
因潜在风险而需要用户立即关注的关键内容。
:::

:::caution
某个操作可能带来的负面后果。
:::

### 基本语法

```markdown
:::note
Highlights information that users should take into account, even when skimming.
:::

:::tip
Optional information to help a user be more successful.
:::
```

### 自定义标题

提示框的标题可以自定义。

:::note[自定义标题示例]
这是一个带自定义标题的提示框。
:::

```markdown
:::note[MY CUSTOM TITLE]
This is a note with a custom title.
:::
```

### GitHub 语法

> [!TIP]
> 同样支持 [GitHub 语法](https://github.com/orgs/community/discussions/16925)。

```
> [!NOTE]
> The GitHub syntax is also supported.

> [!TIP]
> The GitHub syntax is also supported.
```

### 剧透隐藏

你可以为文字添加剧透隐藏，其中的文本同样支持 **Markdown** 语法。

这段内容 :spoiler[被隐藏了 **嘿嘿**]！

```markdown
The content :spoiler[is hidden **ayyy**]!
```

## 代码组

使用 VitePress 风格的 `::: code-group labels=[...]` 语法，将相关示例以可访问的标签页形式呈现。标签页支持鼠标操作以及 <kbd>Left</kbd>、<kbd>Right</kbd>、<kbd>Home</kbd> 和 <kbd>End</kbd> 键。

::: code-group labels=[TypeScript, Shell, Collapsed]

```ts title="config.ts" showLineNumbers {2} ins={3}
export const config = {
  framework: "Mizuki",
  enhanced: true,
};
```

```bash title="Build"
pnpm check && pnpm build
```

```js collapse={1-3}
import { one } from "one";
import { two } from "two";
import { three } from "three";
console.log(one, two, three);
```

:::

````markdown
::: code-group labels=[TypeScript, Shell]

```ts title="config.ts"
export const framework = "Mizuki";
```

```bash title="Build"
pnpm build
```

:::
````

### 长代码自动折叠

超过配置阈值的代码块会自动折叠。作者仍可使用 `collapse={...}` 折叠选定的行范围。

```text
01
02
03
04
05
06
07
08
09
10
11
12
13
14
15
16
17
18
19
20
21
22
```

## 扩展提示框

除了 GitHub 的五种提示类型外，Mizuki 还支持常见的 Obsidian 别名，如 `INFO`、`TODO`、`SUCCESS`、`QUESTION`、`DANGER`、`BUG`、`EXAMPLE` 和 `QUOTE`。

> [!BUG] 已知限制
> 扩展别名会映射到 Mizuki 的语义化提示框样式。

同时支持 Python Markdown 和 Docusaurus 风格的指令：

:::danger[危险指令]
该指令使用了自定义标题。
:::

```markdown
> [!BUG] Known limitation
> Describe the known issue here.

:::danger[Danger directive]
This directive uses a custom title.
:::
```

## Wiki 链接

Obsidian 风格的 Wiki 链接会解析文章路径、别名和标题锚点。独立的链接会变成文章卡片：

[[guide]]

卡片复用目标文章的封面。相对封面路径会从目标文章解析，同时也支持 `public` 目录、远程链接以及配置的 `image: api` 封面。加密文章绝不会在预览中暴露封面。

行内链接保持行内形式。可查看 [[markdown-mermaid|Mermaid 示例]]，或直接链接到 [[markdown-mermaid#Flowchart Example|某个章节]]。

```markdown
[[markdown-mermaid]]

See [[markdown-mermaid|the Mermaid examples]].
```

## Markdown 图片

图片的 alt 文本仍可供辅助技术使用。Markdown 标题会作为可见说明文字显示，可选的经过校验的 `w-N%` 标记用于控制显示宽度：

![说明文字示例 w-60%](/images/demos/image-grid-demo/square-3.webp "一条可见的图片说明")

```markdown
![Descriptive alt w-60%](./image.webp "A visible image caption")
```

只接受 `w-1%` 到 `w-100%` 之间的宽度。`imageOptimization.noReferrerDomains` 中配置的远程图片主机在初始 HTML 中会收到 `referrerpolicy="no-referrer"`。当自定义标记需要原样保留时，可在原始 HTML 图片或其父元素上添加 `data-no-enhance`。

```html
<div data-no-enhance>
  <img src="/images/demos/image-grid-demo/square-3.webp" alt="Custom image markup" width="640" height="360">
</div>
```

## 自动图片网格

两张或更多相邻的独立图片会自动分组为响应式画廊。当需要自定义列数、宽高比或对象适配时，仍可使用显式的 `:::grid` 指令。

![方形演示图 1](/images/demos/image-grid-demo/square-1.webp)
![方形演示图 2](/images/demos/image-grid-demo/square-2.webp)

```markdown
![First image](/images/first.webp)
![Second image](/images/second.webp)
```

## PlantUML

PlantUML 围栏会通过配置的服务器生成 SVG 图表。图表支持浅色和深色源、缩放、拖拽、重置以及全屏查看。

```plantuml
@startuml
actor Author
Author -> Mizuki: Write Markdown
Mizuki --> Author: Render enhanced article
@enduml
```

````markdown
```plantuml
@startuml
Alice -> Bob: Hello
@enduml
```
````

## 化学公式

KaTeX 的 `mhchem` 扩展可以渲染化学方程式：

$$
\ce{H2O + CO2 -> H2CO3}
$$
