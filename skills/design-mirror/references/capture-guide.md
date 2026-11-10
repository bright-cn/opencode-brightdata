# 捕获指南

## 同时运行两种捕获

始终并行运行截图和 HTML 抓取（它们是相互独立的请求）：

```bash
# Run both simultaneously
bash scripts/screenshot.sh "https://target.com" "/tmp/target_screenshot.png" &
SCREENSHOT_PID=$!

bash scripts/scrape_html.sh "https://target.com" "/tmp/target_page.html" &
HTML_PID=$!

wait $SCREENSHOT_PID $HTML_PID
echo "Both captures complete"
```

或者直接在同一条消息中调用两次 Agent 工具。

## 读取截图

对 PNG 文件路径使用 Read 工具：Claude 支持多模态，可以直接分析图像。按照设计令牌类别（颜色、字体、布局、组件、效果）描述你看到的内容。

## 读取 HTML

HTML 文件可能非常大。使用 Grep 提取最有用的部分：

```bash
# Extract CSS custom properties
grep -o '\-\-[a-zA-Z-]*:[^;]*' /tmp/target_page.html | head -100

# Extract @import font statements
grep -E '@import|fonts\.googleapis' /tmp/target_page.html | head -20

# Extract <style> block content
grep -A 500 '<style' /tmp/target_page.html | head -600

# Extract inline styles from key elements
grep -o 'style="[^"]*"' /tmp/target_page.html | head -50

# Look for Tailwind config
grep -A 20 'tailwind.config' /tmp/target_page.html | head -50
```

## 常见问题

### 大型 HTML 文件
使用 Grep 匹配具体模式，而不是读取整个文件。重点关注 `<style>` 标签、`:root`、`@import` 和 `<link rel="stylesheet">`。

### 压缩后的 CSS
压缩后的 CSS 没有空白。你仍然可以通过以下方式提取颜色：
```bash
grep -oE '#[0-9a-fA-F]{3,8}' /tmp/target_page.html | sort -u
grep -oE 'rgb\([^)]+\)' /tmp/target_page.html | sort -u
grep -oE 'rgba\([^)]+\)' /tmp/target_page.html | sort -u
```

### 外部 CSS 文件
HTML 可能会引用外部 `.css` 文件。你会看到 `<link href="/assets/style.abc123.css" rel="stylesheet">`。遗憾的是，API 响应中的相对路径无法正常使用。请通过抓取脚本使用完整 URL：
```bash
bash scripts/scrape_html.sh "https://target.com/assets/style.abc123.css" "/tmp/target_styles.css"
```

### JS 渲染的网站（HTML 基本为空）
如果 HTML 内容很少（React/Next.js SPA），设计通常位于：
1. 截图（已完整渲染）：最有用
2. `<head>` 中链接的外部 CSS 分块
3. 包含配置数据的内联 `<script>` 块

在这种情况下，改为完全基于截图进行视觉提取。

## 截图质量

截图会在桌面视口下捕获完整渲染的页面。对于具有以下特征的网站：
- **深色主题**：截图中的颜色会很准确
- **动画**：截图会捕获某个静态时刻（通常是加载完成后的状态）
- **吸顶页眉**：会显示其位于页面顶部时的状态
- **首屏内容**：最为重要，这是定义品牌形象的部分

如果你需要查看特定部分（例如定价页面或首屏以下的组件），请抓取其他 URL：
```bash
bash scripts/screenshot.sh "https://target.com/pricing" "/tmp/pricing_screenshot.png"
```
