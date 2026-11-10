---
name: design-mirror
description: "Replicate the visual style of any website and apply it to your existing codebase. Use this skill whenever the user wants to match a site's design, mirror a UI aesthetic, make their app look like another site, or replicate a specific visual style from a URL. Trigger on phrases like 'make it look like', 'match the design of', 'copy the style from', 'I want my app to look like X', 'mirror this design', 'inspired by [url]', or any time the user points at a website and says they want their frontend to match it."
---

# 设计镜像

捕获任意网站的视觉设计语言，并将其应用于你现有的代码库：包括颜色、字体、间距、布局节奏、组件形状和整体美感，所有内容均通过 Bright Data 的网络解锁器实时提取。

## 此技能的功能

1. **捕获**：通过 Bright Data 对灵感网站进行截图和 HTML 抓取
2. **提取**：识别完整的设计系统：颜色、字体、间距比例、圆角、阴影、组件模式
3. **分析**：从视觉上研究截图，并从结构上研究 CSS，以理解其设计语言
4. **应用**：将该设计系统融入用户现有的代码库（使用其框架和组件）

你不会复制内容或功能，而是在理解其*设计语言*：配色、字号比例、卡片形状、悬停状态以及整体美感。

> **重要提示：** 此技能用于设计灵感和学习，提取公开可见的设计令牌（颜色、字体、间距）来指导你自己的 UI 工作。请始终以尊重的方式使用，并遵守所参考网站的服务条款。

## 设置

需要：
- `BRIGHTDATA_API_KEY`：来自 [www.bright.cn/cp](https://www.bright.cn/cp) → 账号设置
- `BRIGHTDATA_UNLOCKER_ZONE`：在 www.bright.cn/cp 创建解锁器区域

```bash
export BRIGHTDATA_API_KEY="your-api-key"
export BRIGHTDATA_UNLOCKER_ZONE="your-zone-name"
```

## 分步流程

### 第 1 步：捕获灵感网站

并行执行两种捕获：截图（用于视觉分析）和 HTML 抓取（用于 CSS 提取）：

```bash
# Screenshot (save as PNG)
bash scripts/screenshot.sh "https://inspiration-site.com" "/tmp/target_screenshot.png"

# HTML + CSS scrape
bash scripts/scrape_html.sh "https://inspiration-site.com" "/tmp/target_page.html"
```

阅读 `references/capture-guide.md`，了解如何从原始 HTML 中提取 CSS 及处理常见问题。

### 第 2 步：分析设计系统

捕获后，并行执行以下两项分析：

**视觉分析（截图）：** 读取 PNG 图片并识别：
- 主色、辅助色、强调色
- 背景色（页面背景、卡片背景、表面层级）
- 字体：可见的字体系列、字号层级（h1 → 正文 → 说明文字）
- 布局：是否居中／限制宽度？网格？侧边栏？
- 卡片／容器形状：圆角大小、阴影样式（硬、柔和、无阴影、彩色）
- 按钮样式：胶囊形、矩形、幽灵按钮、渐变？
- 导航：是否固定？是否有玻璃／模糊效果？深色还是浅色？
- 整体氛围：深色、浅色、极简、粗野主义、玻璃拟态、企业风、初创公司风？

**CSS 分析（HTML）：** 从 `<style>` 标签和内联样式中提取：
- CSS 自定义属性（`:root { --color-... }`）：公开声明的设计令牌
- 字体导入（来自 Google Fonts 等的 `@import`）
- Tailwind 配置（如果存在）
- 可体现间距比例的重复类模式

阅读 `references/css-extraction.md`，了解提取操作指南。

### 第 3 步：构建设计令牌映射

在修改任何代码之前，先生成结构化设计令牌映射：

```
DESIGN TOKENS FROM [site]
==========================
Colors:
  --bg-primary: #0a0a0f      (page background)
  --bg-surface: #13131a      (card/panel background)
  --text-primary: #ffffff
  --text-muted: #8888aa
  --accent: #7c3aed          (primary CTA color)
  --accent-hover: #6d28d9
  --border: rgba(255,255,255,0.08)

Typography:
  --font-heading: 'Inter', sans-serif
  --font-body: 'Inter', sans-serif
  font-scale: 12/14/16/20/24/32/48px
  heading-weight: 700
  body-weight: 400

Spacing:
  base-unit: 8px
  scale: 4/8/12/16/24/32/48/64px

Borders & Shadows:
  --radius-sm: 6px
  --radius-md: 12px
  --radius-lg: 20px
  --shadow: 0 4px 24px rgba(0,0,0,0.4)

Special effects:
  glass-blur: backdrop-filter: blur(16px)
  gradient: linear-gradient(135deg, #7c3aed, #2563eb)
```

继续操作前向用户展示此令牌映射。它是基础：如果映射错误，输出也会错误。

### 第 4 步：了解用户的代码库

编写任何代码之前，先阅读代码库的相关部分：

- 使用什么框架？（React、Vue、Next.js、纯 HTML？）
- 使用什么样式方案？（Tailwind、CSS Modules、styled-components、纯 CSS？）
- 全局样式定义在哪里？（globals.css、theme.ts、tailwind.config.js？）
- 需要重新设计哪些组件？（不明确时询问用户）

不要重写所有内容：要精准修改。将设计令牌应用于现有结构。

### 第 5 步：应用设计

应用策略取决于用户的技术栈：

**如果使用 Tailwind：** 使用新的调色板、字体系列和圆角比例更新 `tailwind.config.js`。对于 Tailwind 原生无法处理的内容，添加自定义 CSS 变量。

**如果使用 CSS/CSS Modules：** 在 globals.css 中创建或更新 `:root` 变量块。更新组件样式表以使用新变量。

**如果使用 styled-components/Emotion：** 更新主题对象。使用主题令牌替换硬编码的颜色／间距值。

**所有情况下：**
- 首先全局应用颜色、字体和间距
- 然后逐一处理组件级细节（按钮、卡片、导航）
- 保留所有现有功能和布局结构：仅更改视觉属性
- 添加可体现灵感网站特色的特殊效果（玻璃模糊、渐变、动画）

阅读 `references/apply-guide.md`，了解特定框架的实现模式。

### 第 6 步：展示修改前后效果

应用更改后，清楚说明：
- 修改了哪些文件
- 设计令牌映射（来源 → 设置的值）
- 添加了哪些特殊效果
- 用户应直观检查哪些内容（悬停状态、深色／浅色模式、移动端）

如果用户正在运行开发服务器，请提醒他们检查效果。主动提出可针对特定组件继续迭代。

## 核心原则

**设计语言，而非标记。** 灵感网站的 HTML 结构和内容属于对方。你提取的是其*设计语言*：颜色如何相互关联、间距如何流动、哪些因素赋予网站独特气质，并将其用作你自己的创意基础。

**先设计令牌，后编写代码。** 在理解完整系统之前急于应用颜色，会导致结果不一致。始终先构建令牌映射。

**询问范围。** “将设计应用到所有页面”“只让首页具有相似感觉”和“只重新设计导航栏”是截然不同的任务。继续前先明确范围。

**不要破坏现有功能。** 用户的组件目前可以正常运行。只更改视觉属性。如果不确定某项更改是否会破坏布局，请谨慎处理并明确提示。

**可以迭代。** 通常最好先打好基础（颜色、字体、间距），让用户审核后再处理组件级细节。

## 遇到以下情况时该怎么做……

**网站使用设计系统（Material、shadcn 等）：** 识别该系统并告知用户，然后询问他们是想采用同一套系统，还是只提取视觉令牌。

**CSS 已被压缩/混淆：** 改用截图和视觉分析。你仍然可以通过视觉检查提取颜色、间距和形状。

**灵感网站由 JS 渲染，HTML 抓取结果基本为空：** 向用户说明这一点，截图仍可用于视觉分析，但 CSS 提取会受到限制。你仍然可以通过视觉方式推断出大多数令牌。

**用户的代码库使用组件库（shadcn、Chakra、MUI）：** 通过自定义组件库的主题/配置来应用设计，而不是逐个覆盖组件。

**需要匹配多个页面：** 使用首页提取整体设计令牌，但如果用户想匹配特定页面的外观，可以提出检查内页（例如 `/pricing`、`/docs`）。
