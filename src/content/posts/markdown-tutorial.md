---
title: Markdown 教程
published: 2025-01-20
pinned: true
description: 一篇 Markdown 博客文章的简单示例。
tags: [Markdown, 博客]
category: 示例
licenseName: "Unlicensed"
author: emn178
sourceLink: "https://github.com/emn178/markdown"
draft: false
---

# Markdown 教程

本 Markdown 示例展示了如何编写 Markdown 文件。本文档集成了核心语法与扩展（GFM）。

- [块级元素](#block-elements)
  - [段落与换行](#paragraphs-and-line-breaks)
  - [标题](#headers)
  - [引用](#blockquotes)
  - [列表](#lists)
  - [代码块](#code-blocks)
  - [水平分割线](#horizontal-rules)
  - [表格](#table)
- [行内元素](#span-elements)
  - [链接](#links)
  - [强调](#emphasis)
  - [代码](#code)
  - [图片](#images)
  - [删除线](#strikethrough)
- [其他](#miscellaneous)
  - [自动链接](#automatic-links)
  - [反斜杠转义](#backslash-escapes)
- [行内 HTML](#inline-html)

## 块级元素

### 段落与换行

#### 段落

HTML 标签：`<p>`

一个或多个空行。（空行是指仅包含**空格**或**制表符**的行。）

代码：

    This will be
    inline.

    This is second paragraph.

预览：

---

This will be
inline.

This is second paragraph.

---

#### 换行

HTML 标签：`<br />`

在行尾添加**两个或更多空格**。

代码：

    This will be not
    inline.

预览：

---

This will be not  
inline.

---

### 标题

Markdown 支持两种标题样式：Setext 和 atx。

#### Setext

HTML 标签：`<h1>`、`<h2>`

使用任意数量的**等号（=）**作为 `<h1>`、**连字符（-）**作为 `<h2>` 来"下划线"标题。

代码：

    This is an H1
    =============
    This is an H2
    -------------

预览：

---

# This is an H1

## This is an H2

---

#### atx

HTML 标签：`<h1>`、`<h2>`、`<h3>`、`<h4>`、`<h5>`、`<h6>`

在行首使用 1-6 个**井号（#）**，对应 `<h1>` - `<h6>`。

代码：

    # This is an H1
    ## This is an H2
    ###### This is an H6

预览：

---

# This is an H1

## This is an H2

###### This is an H6

---

你也可以选择"闭合"atx 样式的标题。闭合的井号**无需与开头的井号数量一致**。

代码：

    # This is an H1 #
    ## This is an H2 ##
    ### This is an H3 ######

预览：

---

# This is an H1

## This is an H2

### This is an H3

---

### 引用

HTML 标签：`<blockquote>`

Markdown 使用电子邮件风格的 **>** 字符来表示引用。如果每行前都加上 > 并强制换行，效果最佳。

代码：

    > This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
    > consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
    > Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
    >
    > Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
    > id sem consectetuer libero luctus adipiscing.

预览：

---

> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
>
> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
> id sem consectetuer libero luctus adipiscing.

---

Markdown 也允许你偷懒，只需在强制换行段落的第一行前加上 >。

代码：

    > This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
    consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
    Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

    > Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
    id sem consectetuer libero luctus adipiscing.

预览：

---

> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
> id sem consectetuer libero luctus adipiscing.

---

通过添加更多层级的 >，引用可以嵌套（即引用中的引用）。

代码：

    > This is the first level of quoting.
    >
    > > This is nested blockquote.
    >
    > Back to the first level.

预览：

---

> This is the first level of quoting.
>
> > This is nested blockquote.
>
> Back to the first level.

---

引用可以包含其他 Markdown 元素，包括标题、列表和代码块。

代码：

    > ## This is a header.
    >
    > 1.   This is the first list item.
    > 2.   This is the second list item.
    >
    > Here's some example code:
    >
    >     return shell_exec("echo $input | $markdown_script");

预览：

---

> ## This is a header.
>
> 1.  This is the first list item.
> 2.  This is the second list item.
>
> Here's some example code:
>
>     return shell_exec("echo $input | $markdown_script");

---

### 列表

Markdown 支持有序（编号）和无序（项目符号）列表。

#### 无序列表

HTML 标签：`<ul>`

无序列表使用**星号（\*）**、**加号（+）**和**连字符（-）**。

代码：

    *   Red
    *   Green
    *   Blue

预览：

---

- Red
- Green
- Blue

---

等价于：

代码：

    +   Red
    +   Green
    +   Blue

以及：

代码：

    -   Red
    -   Green
    -   Blue

#### 有序列表

HTML 标签：`<ol>`

有序列表使用数字后跟句点：

代码：

    1.  Bird
    2.  McHale
    3.  Parish

预览：

---

1.  Bird
2.  McHale
3.  Parish

---

有时会不小心触发有序列表，例如写这样的内容：

代码：

    1986. What a great season.

预览：

---

1986. What a great season.

---

你可以使用**反斜杠转义（\）**句点：

代码：

    1986\. What a great season.

预览：

---

1986\. What a great season.

---

#### 缩进

##### 引用

要在列表项中放入引用，引用的 > 分隔符需要缩进：

代码：

    *   A list item with a blockquote:

        > This is a blockquote
        > inside a list item.

预览：

---

- A list item with a blockquote:

  > This is a blockquote
  > inside a list item.

---

##### 代码块

要在列表项中放入代码块，代码块需要缩进两级——**8 个空格**或**两个制表符**：

代码：

    *   A list item with a code block:

            <code goes here>

预览：

---

- A list item with a code block:

      <code goes here>

---

##### 嵌套列表

代码：

    * A
      * A1
      * A2
    * B
    * C

预览：

---

- A
  - A1
  - A2
- B
- C

---

### 代码块

HTML 标签：`<pre>`

将代码块的每一行缩进至少**4 个空格**或**1 个制表符**。

代码：

    This is a normal paragraph:

        This is a code block.

预览：

---

This is a normal paragraph:

    This is a code block.

---

代码块会一直持续到出现未缩进的行（或文章结束）。

在代码块内，**与号（&）**和尖**括号（< 和 >）**会自动转换为 HTML 实体。

代码：

        <div class="footer">
            &copy; 2004 Foo Corporation
        </div>

预览：

---

    <div class="footer">
        &copy; 2004 Foo Corporation
    </div>

---

以下部分介绍的围栏代码块和语法高亮属于扩展功能，你可以用另一种方式编写代码块。

#### 围栏代码块

只需用 ` ``` ` 包裹你的代码（如下所示），就不需要缩进四个空格了。

代码：

    Here's an example:

    ```
    function test() {
      console.log("notice the blank line before this function?");
    }
    ```

预览：

---

Here's an example:

```
function test() {
  console.log("notice the blank line before this function?");
}
```

---

#### 语法高亮

在你的围栏代码块中添加可选的语言标识符，即可进行语法高亮（[支持的语言](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml)）。

代码：

    ```ruby
    require 'redcarpet'
    markdown = Redcarpet.new("Hello World!")
    puts markdown.to_html
    ```

预览：

---

```ruby
require 'redcarpet'
markdown = Redcarpet.new("Hello World!")
puts markdown.to_html
```

---

### 水平分割线

HTML 标签：`<hr />`
在一行中单独放置**三个或更多连字符（-）、星号（\*）或下划线（\_）**。连字符或星号之间可以使用空格。

代码：

    * * *
    ***
    *****
    - - -
    ---------------------------------------
    ___

预览：

---

---

---

---

---

---

---

---

### 表格

HTML 标签：`<table>`

这是一项扩展功能。

使用**竖线（|）**分隔列、**连字符（-）**分隔表头，并使用**冒号（:）**进行对齐。

最外侧的**竖线（|）**和对齐方式是可选的。每个单元格至少需要**3 个分隔符**来分隔表头。

代码：

```
| Left | Center | Right |
|:-----|:------:|------:|
|aaa   |bbb     |ccc    |
|ddd   |eee     |fff    |

 A | B
---|---
123|456


A |B
--|--
12|45
```

预览：

---

| Left | Center | Right |
| :--- | :----: | ----: |
| aaa  |  bbb   |   ccc |
| ddd  |  eee   |   fff |

| A   | B   |
| --- | --- |
| 123 | 456 |

| A   | B   |
| --- | --- |
| 12  | 45  |

---

## 行内元素

### 链接

HTML 标签：`<a>`

Markdown 支持两种链接样式：行内式和引用式。

#### 行内链接

行内链接的格式如下：`[Link Text](URL "Title")`

Title 是可选的。

代码：

    This is [an example](http://example.com/ "Title") inline link.

    [This link](http://example.net/) has no title attribute.

预览：

---

This is [an example](http://example.com/ "Title") inline link.

[This link](http://example.net/) has no title attribute.

---

如果你要引用同一服务器上的本地资源，可以使用相对路径：

代码：

    See my [About](/about/) page for details.

预览：

---

See my [About](/about/) page for details.

---

#### 引用式链接

你可以预定义链接引用，格式如下：`[id]: URL "Title"`

Title 同样是可选的。引用链接时的格式如下：`[Link Text][id]`

代码：

    [id]: http://example.com/  "Optional Title Here"
    This is [an example][id] reference-style link.

预览：

---

[id]: http://example.com/ "Optional Title Here"

This is [an example][id] reference-style link.

---

即：

- 包含链接标识符的方括号（**不区分大小写**，可选地从左边距缩进最多三个空格）；
- 后跟一个冒号；
- 后跟一个或多个空格（或制表符）；
- 后跟链接的 URL；
- 链接 URL 可选地被尖括号包围。
- 可选地后跟链接的标题属性，用双引号、单引号或括号括起来。

以下三种链接定义是等价的：

代码：

    [foo]: http://example.com/  "Optional Title Here"
    [foo]: http://example.com/  'Optional Title Here'
    [foo]: http://example.com/  (Optional Title Here)
    [foo]: <http://example.com/>  "Optional Title Here"

使用一组空方括号时，链接文本本身会被用作名称。

代码：

    [Google]: http://google.com/
    [Google][]

预览：

---

[Google]: http://google.com/

[Google][]

---

### 强调

HTML 标签：`<em>`、`<strong>`

Markdown 将**星号（\*）**和**下划线（\_）**视为强调标记。**单个分隔符**会生成 `<em>`；\*_双分隔符_会生成 `<strong>`。

代码：

    *single asterisks*

    _single underscores_

    **double asterisks**

    __double underscores__

预览：

---

_single asterisks_

_single underscores_

**double asterisks**

**double underscores**

---

但如果你在 \* 或 \_ 周围加上空格，它会被视为字面的星号或下划线。

你可以用反斜杠转义它：

代码：

    \*this text is surrounded by literal asterisks\*

预览：

---

\*this text is surrounded by literal asterisks\*

---

### 代码

HTML 标签：`<code>`

使用**反引号（`）**包裹。

代码：

    Use the `printf()` function.

预览：

---

Use the `printf()` function.

---

要在代码片段中包含字面的反引号字符，你可以使用**多个反引号**作为开闭分隔符：

代码：

    ``There is a literal backtick (`) here.``

预览：

---

``There is a literal backtick (`) here.``

---

包裹代码片段的反引号分隔符可以包含空格——开头的反引号后一个、结尾的反引号前一个。这样你就可以在代码片段的开头或结尾放置字面的反引号字符：

代码：

    A single backtick in a code span: `` ` ``

    A backtick-delimited string in a code span: `` `foo` ``

预览：

---

A single backtick in a code span: `` ` ``

A backtick-delimited string in a code span: `` `foo` ``

---

### 图片

HTML 标签：`<img />`

Markdown 使用一种与链接语法类似的图片语法，支持两种样式：行内式和引用式。

#### 行内图片

行内图片语法如下：`![Alt text](URL "Title")`

Title 是可选的。

代码：

    ![Alt text](/path/to/img.jpg)

    ![Alt text](/path/to/img.jpg "Optional title")

预览：

---

![Alt text](https://s2.loli.net/2024/08/20/5fszgXeOxmL3Wdv.webp)

![Alt text](https://s2.loli.net/2024/08/20/5fszgXeOxmL3Wdv.webp "Optional title")

---

即：

- 一个感叹号：!；
- 后跟一组方括号，包含图片的 alt 属性文本；
- 后跟一组圆括号，包含图片的 URL 或路径，以及可选的、用双引号或单引号括起来的标题属性。

#### 引用式图片

引用式图片语法如下：`![Alt text][id]`

代码：

    [img id]: https://s2.loli.net/2024/08/20/5fszgXeOxmL3Wdv.webp  "Optional title attribute"
    ![Alt text][img id]

预览：

---

[img id]: https://s2.loli.net/2024/08/20/5fszgXeOxmL3Wdv.webp "Optional title attribute"

![Alt text][img id]

---

### 删除线

HTML 标签：`<del>`

这是一项扩展功能。

GFM 增加了删除线文本的语法。

代码：

```
~~Mistaken text.~~
```

预览：

---

~~Mistaken text.~~

---

## 其他

### 自动链接

Markdown 支持为 URL 和电子邮件地址创建"自动"链接的快捷方式：只需用尖括号将 URL 或电子邮件地址括起来。

代码：

    <http://example.com/>

    <address@example.com>

预览：

---

<http://example.com/>

<address@example.com>

---

GFM 会自动链接标准的 URL。

代码：

```
https://github.com/emn178/markdown
```

预览：

---

https://github.com/emn178/markdown

---

### 反斜杠转义

Markdown 允许使用反斜杠转义来生成字面字符，否则这些字符在 Markdown 的格式化语法中会具有特殊含义。

代码：

    \*literal asterisks\*

预览：

---

\*literal asterisks\*

---

Markdown 为以下字符提供反斜杠转义：

代码：

    \   backslash
    `   backtick
    *   asterisk
    _   underscore
    {}  curly braces
    []  square brackets
    ()  parentheses
    #   hash mark
    +   plus sign
    -   minus sign (hyphen)
    .   dot
    !   exclamation mark

## 行内 HTML

对于 Markdown 语法未覆盖的任何标记，你直接使用 HTML 本身即可。无需添加前缀或分隔符来表明从 Markdown 切换到 HTML，直接使用标签即可。

代码：

    This is a regular paragraph.

    <table>
        <tr>
            <td>Foo</td>
        </tr>
    </table>

    This is another regular paragraph.

预览：

---

This is a regular paragraph.

<table>
    <tr>
        <td>Foo</td>
    </tr>
</table>

This is another regular paragraph.

---

请注意，Markdown 格式化语法**在块级 HTML 标签内不会被处理**。

与块级 HTML 标签不同，Markdown 语法**在行内级标签内会被处理**。

代码：

    <span>**Work**</span>

    <div>
        **No Work**
    </div>

预览：

---

<span>**Work**</span>

<div>
  **No Work**
</div>
***
