---
title: 在文章中嵌入视频
published: 2022-08-01
description: 这篇文章演示了如何在博客文章中嵌入视频。
tags: [示例, 视频]
category: 示例
draft: false
---

只需从 YouTube 或其他平台复制嵌入代码，然后粘贴到 Markdown 文件中即可。

```markdown
---
title: Include Video in the Post
published: 2023-10-19
// ...
---

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allowfullscreen></iframe>
```
## YouTube

<iframe width="100%" height="468" src="https://www.youtube.com/embed/5gIf0_xpFPI?si=N1WTorLKL0uwLsU_" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Bilibili

<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1fK4y1s7Qf&p=1&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

请将自动播放设置保留在 iframe 的 URL 查询字符串中，不要将查询参数作为独立的 HTML 属性添加。
