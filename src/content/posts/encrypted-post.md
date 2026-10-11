---
title: 加密文章
published: 2024-01-15
description: 一个浏览器端文章加密的通用示例。
encrypted: true
pinned: false
password: "123456"
passwordHint: "123456"
hideHomeContent: true
alias: "encrypted-example"
tags: ["示例", "加密"]
category: "示例"
---

本文演示了浏览器端密码保护功能。密码特意保留在仓库中，方便读者打开这个示例；切勿将其复用于私人内容。

## 文章的 Frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
---
```





| 属性            | 说明                                                                                                                                                                                                   |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`       | 文章的标题。                                                                                                                                                                                      |
| `published`   | 文章的发布日期。                                                                                                                                                                            |
| `pinned`      | 是否将文章置顶到文章列表顶部。                                                                                                                                                   |
| `description` | 文章的简短描述，显示在首页。                                                                                                                                                   |
| `image`       | 文章的封面图片路径。<br/>1. 以 `http://` 或 `https://` 开头：使用网络图片<br/>2. 以 `/` 开头：使用 `public` 目录中的图片<br/>3. 无前缀：相对 Markdown 文件的路径 |
| `tags`        | 文章的标签。                                                                                                                                                                                       |
| `category`    | 文章的分类。                                                                                                                                                                                   |
| `alias`   | 文章的别名。文章可通过 `/posts/{alias}/` 访问。例如：`my-special-article`（可通过 `/posts/my-special-article/` 访问）                                   |
| `licenseName` | 文章内容的许可证名称。                                                                                                                                                                      |
| `author`      | 文章的作者。                                                                                                                                                                                     |
| `sourceLink`  | 文章内容的来源链接或参考。                                                                                                                                                          |
| `draft`       | 文章是否为草稿，草稿不会显示。                                                                                                                                                    |
| `encrypted`   | 文章是否受密码保护。                                                                                                                                                                    |
| `password`    | 解锁加密文章的密码。                                                                                                                                                                  |
| `passwordHint`| 帮助用户记住密码的提示，显示在密码输入框下方。                                                                                                                             |
| `hideHomeContent` | 是否隐藏文章的公开摘要，包括首页、meta 标签、订阅源/API 摘要和分享预览。当设置了 `password` 时默认为 `true`。                                      |

## 文章文件存放位置



你的文章文件应放在 `src/content/posts/` 目录中。你也可以创建子目录，以便更好地组织文章和资源。

```
src/content/posts/
├── post-1.md
└── post-2/
    ├── cover.png
    └── index.md
```

## 文章别名

你可以在 front-matter 中添加 `alias` 字段为任意文章设置别名：

```yaml
---
title: My Special Article
published: 2024-01-15
alias: "my-special-article"
tags: ["Example"]
category: "Technology"
---
```

当设置了别名时：
- 文章可通过自定义 URL 访问（例如 `/posts/my-special-article/`）
- 默认的 `/posts/{slug}/` URL 仍然有效
- RSS/Atom 订阅源将使用自定义别名
- 所有内部链接将自动使用自定义别名

**重要说明：**
- 别名不应包含 `/posts/` 前缀（会自动添加）
- 别名中避免使用特殊字符和空格
- 使用小写字母和连字符以获得最佳 SEO 效果
- 确保别名在所有文章中唯一
- 不要包含前导或尾随斜杠


## 工作原理

```mermaid
graph LR
    A[User Password] --> B[Direct AES Decryption]
    B --> C{Check Prefix?}
    C -- "MIZUKI-VERIFY:" found --> D[Success: Render Content]
    C -- Random/Garbage --> E[Fail: Wrong Password]
```

## 页面加密

你可以通过在 front-matter 中设置 `encrypted: true` 并提供 `password` 来为任意文章添加密码保护：

```yaml
---
title: My Private Post
published: 2024-01-15
encrypted: true
password: "my-secret-password"
passwordHint: "Hint: The password is my dog's name"
hideHomeContent: true
---
```

### 字段

| 字段          | 必填 | 说明                                              |
|----------------|----------|----------------------------------------------------------|
| `encrypted`    | 是      | 设置为 `true` 以启用密码保护              |
| `password`     | 是      | 解锁文章的密码                          |
| `passwordHint` | 否       | 显示在密码输入框下方、用于帮助用户的提示 |
| `hideHomeContent` | 否   | 隐藏公开摘要，显示为 `该文章已加密`。当设置了 `password` 时默认为 `true`。设为 `false` 可显示正常摘要。 |

### 解锁框的外观

解锁框会显示：
- 一个主题主色的锁图标
- 文章标题「密码保护」
- 请求输入密码的描述文字
- 提示（如果提供了 `passwordHint`）
- 密码输入框和解锁按钮

输入正确密码后，内容将被解密并显示。密码存储在 session storage 中，因此用户在同一会话内后续加载页面时无需重新输入。
