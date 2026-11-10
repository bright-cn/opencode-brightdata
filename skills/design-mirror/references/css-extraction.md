# CSS 提取操作手册

抓取原始 HTML 后，系统化地提取设计令牌。按顺序处理以下各层。

## 第 1 层：CSS 自定义属性（宝藏）

在 HTML 中搜索 `:root` 块：使用这些属性的设计系统已经替你完成了大部分工作：

```html
<style>
  :root {
    --color-bg: #0a0a0f;
    --color-primary: #7c3aed;
    --font-sans: 'Inter', sans-serif;
    --radius: 12px;
  }
</style>
```

获取每个 `--variable` 并对其进行分类：颜色、字体、间距、阴影、圆角、动画。

## 第 2 层：字体导入

在 `<style>` 块顶部和 `<link>` 标签中查找 `@import`：

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
```

或者在 CSS 中：
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap');
```

记录字体系列及加载的字重：字重能告诉你字体的用途（例如，300 = 浅色正文，700 = 粗体标题）。

## 第 3 层：Tailwind 配置（如果网站使用 Tailwind）

使用 Tailwind 的迹象：存在 `bg-purple-600`、`text-gray-200`、`rounded-xl`、`shadow-lg`、`backdrop-blur-md` 等类。

如果存在自定义 Tailwind 主题，它可能会以内联脚本的形式出现：
```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: { brand: '#7c3aed' }
      }
    }
  }
</script>
```

对于没有自定义配置的标准 Tailwind 网站，使用视觉截图识别其使用的 Tailwind 颜色，然后用相同的类名复现。

## 第 4 层：重复的类模式

扫描 HTML，查找同类元素上重复的类组合。这些模式会揭示设计系统：

```html
<!-- Repeated card pattern -->
<div class="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">

<!-- Repeated button pattern -->
<button class="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-all">
```

即使没有明确的自定义属性，这些模式也能说明组件级设计决策。

## 第 5 层：内联样式和渐变

在主视觉区、页眉和高亮元素上查找内联 `style=""` 属性：这些属性通常包含最具设计意图的选择：

```html
<section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
<div style="background: radial-gradient(ellipse at top, rgba(124,58,237,0.15) 0%, transparent 60%);">
```

## 第 6 层：动画和过渡模式

注意 CSS 过渡和动画：它们决定了网站的“观感”：

```css
transition: all 0.2s ease;        /* snappy */
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);  /* Material-style */
animation: fadeIn 0.6s ease forwards;  /* page load feel */
```

## HTML 内容稀少时（JS 渲染的网站）

迹象：`<div id="root"></div>` 中的内容极少，或 `<div id="__next">` 中只有加载指示器。

在这种情况下：
1. 截图仍然完全可用于视觉分析
2. 查找指向外部 CSS 文件的 `<link>` 标签：即使无法获取，也要记录其路径
3. 查找包含内联配置的 `<script>` 标签（Next.js/Nuxt 通常会嵌入主题数据）
4. 检查 `<meta>` theme-color 标签：`<meta name="theme-color" content="#7c3aed">`
5. 改为根据截图进行完整的视觉提取

## 输出格式

在编写任何代码前，始终以结构化令牌映射的形式输出提取结果：

```
EXTRACTED DESIGN TOKENS
========================
Source: https://example.com
Method: CSS custom properties + visual analysis

COLORS
  Background:
    page:    #0a0a0f
    surface: #13131a  (cards, panels)
    elevated:#1a1a2e  (modals, dropdowns)
  Text:
    primary: #ffffff
    secondary:#a0a0b8
    muted:   #606080
  Brand:
    primary: #7c3aed
    hover:   #6d28d9
    glow:    rgba(124,58,237,0.3)
  Border:   rgba(255,255,255,0.08)

TYPOGRAPHY
  Heading font: 'Inter', sans-serif (weights: 600, 700)
  Body font:    'Inter', sans-serif (weight: 400)
  Size scale:   12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px
  Line height:  1.5 body / 1.2 headings

SPACING
  Base unit: 8px
  Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 96px

BORDERS & EFFECTS
  Radius sm:  6px   (badges, inputs)
  Radius md:  12px  (cards)
  Radius lg:  20px  (modals, large containers)
  Radius pill: 9999px (buttons, tags)
  Shadow:     0 4px 24px rgba(0,0,0,0.4)
  Glass blur: backdrop-filter: blur(16px)

GRADIENTS
  Hero:    linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)
  Subtle:  radial-gradient(ellipse at top, rgba(124,58,237,0.15), transparent)

ANIMATIONS
  Transition: all 0.2s ease
  Hover scale: transform: scale(1.02)
```
