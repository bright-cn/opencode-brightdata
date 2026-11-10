---
name: scrape
description: Scrape any webpage as clean markdown via Bright Data Web Unlocker API. Bypasses bot detection and CAPTCHA. Requires BRIGHTDATA_API_KEY and BRIGHTDATA_UNLOCKER_ZONE environment variables.
---

# Bright Data：网页抓取工具

使用 Bright Data 的网络解锁器 API 抓取任意网页并获得干净的 Markdown 内容。自动绕过机器人检测和 CAPTCHA。

## 设置

**1. 获取 API 密钥：** 从 [Bright Data 控制面板](https://www.bright.cn/cp)获取密钥。

**2. 创建网络解锁器区域：** 在 www.bright.cn/cp 中点击右上角的“添加”，然后选择“解锁器区域”来创建区域。

**3. 设置环境变量：**
```bash
export BRIGHTDATA_API_KEY="your-api-key"
export BRIGHTDATA_UNLOCKER_ZONE="your-zone-name"
```

## 用法

```bash
bash scripts/scrape.sh "url"
```

**参数：**
- `url`（必需）：要抓取的网页 URL

**示例：**
```bash
# Scrape a news article
bash scripts/scrape.sh "https://example.com/article"

# Scrape a product page
bash scripts/scrape.sh "https://shop.example.com/product/123"
```

## 输出格式

返回从网页中提取的干净 Markdown 内容：
```markdown
# Page Title

Main content of the page converted to markdown format...

## Section Heading

More content...
```

## 功能

- **绕过机器人检测**：自动处理反机器人措施
- **CAPTCHA 破解**：绕过 CAPTCHA 挑战
- **干净的 Markdown**：返回格式规范的 Markdown 内容
- **JavaScript 渲染**：处理大量使用 JavaScript 的页面

## 依赖项

- `curl` - 用于 API 请求
