# 设计应用指南

如何将提取的设计令牌应用到不同的前端技术栈。

## Tailwind CSS 项目

### 1. 更新 tailwind.config.js / tailwind.config.ts

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          page:    '#0a0a0f',
          surface: '#13131a',
          elevated:'#1a1a2e',
        },
        brand: {
          DEFAULT: '#7c3aed',
          hover:   '#6d28d9',
        },
        border: 'rgba(255,255,255,0.08)',
        text: {
          primary:   '#ffffff',
          secondary: '#a0a0b8',
          muted:     '#606080',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '20px',
        'xl': '28px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 24px rgba(124,58,237,0.3)',
      },
    }
  }
}
```

### 2. 更新 globals.css，以处理非 Tailwind 属性

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --gradient-hero: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
  --gradient-subtle: radial-gradient(ellipse at top, rgba(124,58,237,0.15), transparent);
  --blur-glass: blur(16px);
  --transition: all 0.2s ease;
}

body {
  background-color: #0a0a0f;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}
```

### 3. 更新组件类

检查用户的主要组件，并将硬编码的颜色/间距类替换为新的类。重点关注：
- `bg-*` → 新背景令牌
- `text-*` → 新文本令牌
- `border-*` → 新边框令牌
- `rounded-*` → 新圆角令牌

---

## 原生 CSS / CSS Modules 项目

### 1. 创建/更新设计令牌文件

```css
/* styles/tokens.css or styles/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Colors */
  --color-bg-page:     #0a0a0f;
  --color-bg-surface:  #13131a;
  --color-bg-elevated: #1a1a2e;
  --color-text:        #ffffff;
  --color-text-muted:  #a0a0b8;
  --color-brand:       #7c3aed;
  --color-brand-hover: #6d28d9;
  --color-border:      rgba(255, 255, 255, 0.08);

  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   20px;
  --text-xl:   24px;
  --text-2xl:  32px;
  --text-3xl:  48px;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Borders */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-pill: 9999px;

  /* Shadows & Effects */
  --shadow-card:  0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-glow:  0 0 24px rgba(124, 58, 237, 0.3);
  --blur-glass:   blur(16px);

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);

  /* Animation */
  --transition: all 0.2s ease;
}

body {
  background: var(--color-bg-page);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.5;
}
```

### 2. 更新组件样式

在所有组件 CSS 文件中用变量替换硬编码值。对常见模式使用查找和替换。

---

## styled-components / Emotion 项目

### 1. 更新主题对象

```ts
// theme.ts
export const theme = {
  colors: {
    bg: {
      page:    '#0a0a0f',
      surface: '#13131a',
      elevated:'#1a1a2e',
    },
    text: {
      primary:  '#ffffff',
      muted:    '#a0a0b8',
    },
    brand: '#7c3aed',
    border:'rgba(255,255,255,0.08)',
  },
  fonts: {
    sans: "'Inter', sans-serif",
  },
  radii: {
    sm:   '6px',
    md:   '12px',
    lg:   '20px',
    pill: '9999px',
  },
  shadows: {
    card: '0 4px 24px rgba(0,0,0,0.4)',
    glow: '0 0 24px rgba(124,58,237,0.3)',
  },
  gradients: {
    hero: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
  },
  transitions: {
    default: 'all 0.2s ease',
  },
}
```

---

## Next.js / Nuxt 项目

这些项目底层通常使用 Tailwind 或 CSS Modules：应用上方对应的指南。

对于 Next.js，具体如下：
- 全局样式：`app/globals.css`（App Router）或 `styles/globals.css`（Pages Router）
- Tailwind 配置：根目录中的 `tailwind.config.ts`

---

## 组件优先级顺序

按以下顺序应用设计，以最低风险获得最大效果：

1. **全局背景色和文本颜色**：立即改变整体外观，且没有破坏性风险
2. **字体导入和 font-family**：只需修改一行，就能产生巨大的视觉影响
3. **导航/页眉**：最醒目，可奠定整体基调
4. **卡片和容器**：背景、边框、圆角、阴影
5. **按钮**：颜色、形状、悬停状态
6. **表单输入框**：背景、边框、焦点环
7. **排版比例**：标题字号和字重
8. **特殊效果**：玻璃模糊、渐变、光晕（最后再处理，这些只是锦上添花）

---

## 玻璃拟态效果（常见于现代 SaaS/AI 网站）

如果目标网站使用玻璃卡片（常见于深色 AI/SaaS 网站）：

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
```

在 Tailwind 中：
```html
<div class="bg-white/5 backdrop-blur-md border border-white/8 rounded-xl">
```

注意：在某些浏览器中，`backdrop-filter` 要求其祖先元素未设置 `overflow: hidden`。如果用户发现玻璃效果不生效，请向他们指出这一点。

---

## 渐变文本（常见于 AI/科技网站）

```css
.gradient-text {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

在 Tailwind 中（需要自定义配置或内联样式）：
```html
<span class="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
```

---

## 检查你的工作

应用后，在脑中逐项检查：
- [ ] 页面背景是否匹配
- [ ] 主要文本颜色是否匹配
- [ ] 卡片/面板的背景和边框是否匹配
- [ ] 主按钮的颜色和形状是否匹配
- [ ] 字体系列是否匹配（检查 Chrome DevTools → Computed → font-family）
- [ ] 标题的字重和字号感觉是否相似
- [ ] 是否包含所有特殊效果（模糊、渐变、光晕）
- [ ] 悬停过渡的速度/样式感觉是否相似
- [ ] 移动端布局是否相似（内边距、堆叠方式）
