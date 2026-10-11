---
title: Markdown 与 Mermaid 图表
published: 2023-10-01
pinned: false
description: 一篇使用 Mermaid 图表的 Markdown 博客文章示例。
tags: [Markdown, 博客, Mermaid]
category: 示例
draft: false
---
# Markdown 与 Mermaid 图表完整指南

本文演示如何在 Markdown 文档中使用 Mermaid 创建各种复杂的图表，包括流程图、时序图、甘特图、类图和状态图。

## 流程图示例

流程图非常适合表示流程或算法步骤。



```mermaid
graph TD
    A[Start] --> B{Condition Check}
    B -->|Yes| C[Process Step 1]
    B -->|No| D[Process Step 2]
    C --> E[Subprocess]
    D --> E
    subgraph E [Subprocess Details]
        E1[Substep 1] --> E2[Substep 2]
        E2 --> E3[Substep 3]
    end
    E --> F{Another Decision}
    F -->|Option 1| G[Result 1]
    F -->|Option 2| H[Result 2]
    F -->|Option 3| I[Result 3]
    G --> J[End]
    H --> J
    I --> J
```

## 时序图示例

时序图展示对象之间随时间发生的交互。

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Server
    participant Database

    User->>WebApp: Submit Login Request
    WebApp->>Server: Send Auth Request
    Server->>Database: Query User Credentials
    Database-->>Server: Return User Data
    Server-->>WebApp: Return Auth Result
    
    alt Auth Successful
        WebApp->>User: Show Welcome Page
        WebApp->>Server: Request User Data
        Server->>Database: Get User Preferences
        Database-->>Server: Return Preferences
        Server-->>WebApp: Return User Data
        WebApp->>User: Load Personalized Interface
    else Auth Failed
        WebApp->>User: Show Error Message
        WebApp->>User: Prompt Re-entry
    end
```

## 甘特图示例

甘特图非常适合展示项目进度和时间线。

```mermaid
gantt
    title Website Development Project Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %m/%d
    
    section Design Phase
    Requirements Analysis      :a1, 2023-10-01, 7d
    UI Design                 :a2, after a1, 10d
    Prototype Creation        :a3, after a2, 5d
    
    section Development Phase
    Frontend Development      :b1, 2023-10-20, 15d
    Backend Development       :b2, after a2, 18d
    Database Design           :b3, after a1, 12d
    
    section Testing Phase
    Unit Testing              :c1, after b1, 8d
    Integration Testing       :c2, after b2, 10d
    User Acceptance Testing   :c3, after c2, 7d
    
    section Deployment
    Production Deployment     :d1, after c3, 3d
    Launch                    :milestone, after d1, 0d
```

## 类图示例

类图展示系统的静态结构，包括类、属性、方法及其相互关系。

```mermaid
classDiagram
    class User {
        +String username
        +String password
        +String email
        +Boolean active
        +login()
        +logout()
        +updateProfile()
    }
    
    class Article {
        +String title
        +String content
        +Date publishDate
        +Boolean published
        +publish()
        +edit()
        +delete()
    }
    
    class Comment {
        +String content
        +Date commentDate
        +addComment()
        +deleteComment()
    }
    
    class Category {
        +String name
        +String description
        +addArticle()
        +removeArticle()
    }
    
    User "1" -- "*" Article : writes
    User "1" -- "*" Comment : posts
    Article "1" -- "*" Comment : has
    Article "1" -- "*" Category : belongs to
```

## 状态图示例

状态图展示对象在其生命周期中经历的状态序列。

```mermaid
stateDiagram-v2
    [*] --> Draft
    
    Draft --> UnderReview : submit
    UnderReview --> Draft : reject
    UnderReview --> Approved : approve
    Approved --> Published : publish
    Published --> Archived : archive
    Published --> Draft : retract
    
    state Published {
        [*] --> Active
        Active --> Hidden : temporarily hide
        Hidden --> Active : restore
        Active --> [*]
        Hidden --> [*]
    }
    
    Archived --> [*]
```

## 饼图示例

饼图非常适合展示比例和百分比数据。

```mermaid
pie title Website Traffic Sources Analysis
    "Search Engines" : 45.6
    "Direct Access" : 30.1
    "Social Media" : 15.3
    "Referral Links" : 6.4
    "Other Sources" : 2.6
```

## 总结

Mermaid 是一个在 Markdown 文档中创建各种图表的强大工具。本文演示了如何使用流程图、时序图、甘特图、类图、状态图和饼图。这些图表可以帮助你更清晰地表达复杂的概念、流程和数据结构。

要使用 Mermaid，只需在代码块中指定 mermaid 语言，并使用简洁的文本语法描述图表即可。Mermaid 会自动将这些描述转换为美观的视觉图表。

在你的下一篇技术博客文章或项目文档中试试使用 Mermaid 图表吧——它们会让你的内容更专业、更容易理解！
