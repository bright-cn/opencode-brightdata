---
name: bright-data-best-practices
description: "Build production-ready Bright Data integrations with best practices baked in. Reference documentation for developers using coding assistants (Claude Code, Cursor, etc.) to implement web scraping, search, browser automation, and structured data extraction. Covers Web Unlocker API, SERP API, Web Scraper API, and Browser API (Scraping Browser)."
user-invocable: false
---

# Bright Data API

Bright Data 提供大规模网页数据提取基础设施。四种主要 API 覆盖不同的使用场景：请始终为任务选择最具体的工具。

## 选择合适的 API

| 使用场景 | API | 原因 |
|----------|-----|-----|
| 按 URL 抓取任意网页（无需交互） | 网络解锁器 | 基于 HTTP，可自动绕过机器人检测，成本最低 |
| Google / Bing / Yandex 搜索结果 | 搜索引擎 API | 专为 SERP 提取而设计，返回结构化数据 |
| 来自 Amazon、LinkedIn、Instagram、TikTok 等平台的结构化数据 | 网页爬虫工具 API | 预构建爬虫工具，无需解析 |
| 点击、滚动、填写表单、运行 JS、拦截 XHR | 浏览器 API | 完整的浏览器自动化 |
| Puppeteer / Playwright / Selenium 自动化 | 浏览器 API | 通过 CDP/WebDriver 连接 |

## 身份验证模式（所有 API）

所有 API 使用相同的身份验证模型：

```bash
export BRIGHTDATA_API_KEY="your-api-key"         # From Control Panel > Account Settings
export BRIGHTDATA_UNLOCKER_ZONE="zone-name"       # Web Unlocker zone name
export BRIGHTDATA_SERP_ZONE="serp-zone-name"      # SERP API zone name
export BROWSER_AUTH="brd-customer-ID-zone-NAME:PASSWORD"  # Browser API credentials
```

网络解锁器和搜索引擎 API 的 REST API 身份验证标头：
```
Authorization: Bearer YOUR_API_KEY
```

---

## 网络解锁器 API

基于 HTTP 的抓取代理。最适合无需浏览器交互的简单页面获取。

**端点：** `POST https://api.brightdata.com/request`

```python
import requests

response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": "YOUR_ZONE_NAME",
        "url": "https://example.com/product/123",
        "format": "raw"
    }
)
html = response.text
```

### 主要参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `zone` | 字符串 | 区域名称（必填） |
| `url` | 字符串 | 包含 `http://` 或 `https://` 的目标 URL（必填） |
| `format` | 字符串 | `"raw"`（HTML）或 `"json"`（结构化封装）（必填） |
| `method` | 字符串 | HTTP 动词，默认为 `"GET"` |
| `country` | 字符串 | 用于地理位置定向的 2 字母 ISO 代码（例如 `"us"`、`"de"`） |
| `data_format` | 字符串 | 转换：`"markdown"` 或 `"screenshot"` |
| `async` | 布尔值 | 异步模式设为 `true` |

### 快捷模式

```python
# Get markdown (best for LLM input)
response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"zone": ZONE, "url": url, "format": "raw", "data_format": "markdown"}
)

# Geo-targeted request
json={"zone": ZONE, "url": url, "format": "raw", "country": "de"}

# Screenshot for debugging
json={"zone": ZONE, "url": url, "format": "raw", "data_format": "screenshot"}

# Async for bulk processing
json={"zone": ZONE, "url": url, "format": "raw", "async": True}
```

<strong>关键规则：</strong>切勿将网络解锁器与 Puppeteer、Playwright、Selenium 或防检测浏览器配合使用。请改用浏览器 API。

完整参考请参阅 **[references/web-unlocker.md](references/web-unlocker.md)**，其中包括代理接口、特殊标头、异步流程、功能和计费。

---

## 搜索引擎 API

针对 Google、Bing、Yandex、DuckDuckGo 的结构化搜索引擎结果提取。

**端点：** `POST https://api.brightdata.com/request`（与网络解锁器相同）

```python
response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": "YOUR_SERP_ZONE",
        "url": "https://www.google.com/search?q=python+web+scraping&brd_json=1&gl=us&hl=en",
        "format": "raw"
    }
)
data = response.json()
for result in data.get("organic", []):
    print(result["rank"], result["title"], result["link"])
```

### Google URL 基本参数

| 参数 | 说明 | 示例 |
|-----------|-------------|---------|
| `q` | 搜索查询 | `q=python+web+scraping` |
| `brd_json` | 解析后的 JSON 输出 | `brd_json=1`（数据管道始终使用此参数） |
| `gl` | 搜索国家/地区 | `gl=us` |
| `hl` | 语言 | `hl=en` |
| `start` | 分页偏移量 | `start=10`（第 2 页）、`start=20`（第 3 页） |
| `tbm` | 搜索类型 | `tbm=nws`（新闻）、`tbm=isch`（图片）、`tbm=vid`（视频） |
| `brd_mobile` | 设备 | `brd_mobile=1`（移动端）、`brd_mobile=ios` |
| `brd_browser` | 浏览器 | `brd_browser=chrome` |
| `brd_ai_overview` | 触发 AI 概览 | `brd_ai_overview=2` |
| `uule` | 编码后的地理位置 | 用于精确位置定向 |

<strong>注意：</strong>自 2025 年 9 月起，`num` 参数已**弃用**。请使用 `start` 进行分页。

### 解析后的 JSON 响应结构

```json
{
  "organic": [{"rank": 1, "global_rank": 1, "title": "...", "link": "...", "description": "..."}],
  "paid": [],
  "people_also_ask": [],
  "knowledge_graph": {},
  "related_searches": [],
  "general": {"results_cnt": 1240000000, "query": "..."}
}
```

### Bing 主要参数

| 参数 | 说明 |
|-----------|-------------|
| `q` | 搜索查询 |
| `setLang` | 语言（建议使用 4 字母代码：`en-US`） |
| `cc` | 国家/地区代码 |
| `first` | 分页（每次递增 10：1、11、21……） |
| `safesearch` | `off`, `moderate`, `strict` |
| `brd_mobile` | 设备类型 |

### 批量 SERP 异步处理

```python
# Submit
response = requests.post(
    "https://api.brightdata.com/request",
    params={"async": "1"},
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"zone": SERP_ZONE, "url": "https://www.google.com/search?q=test&brd_json=1", "format": "raw"}
)
response_id = response.headers.get("x-response-id")

# Retrieve (retrieve calls are NOT billed)
result = requests.get(
    "https://api.brightdata.com/serp/get_result",
    params={"response_id": response_id},
    headers={"Authorization": f"Bearer {API_KEY}"}
)
```

<strong>计费：</strong>仅按每 1,000 次成功请求付费。异步结果获取调用不计费。

完整参考请参阅 **[references/serp-api.md](references/serp-api.md)**，其中包括地图、趋势、评论、Lens、酒店和航班参数。

---

## 网页爬虫工具 API

用于从 100 多个平台提取结构化数据的预构建爬虫工具。无需解析逻辑。

**同步端点：** `POST https://api.brightdata.com/datasets/v3/scrape` **异步端点：** `POST https://api.brightdata.com/datasets/v3/trigger`

```python
# Sync (up to 20 URLs, returns immediately)
response = requests.post(
    "https://api.brightdata.com/datasets/v3/scrape",
    params={"dataset_id": "YOUR_DATASET_ID", "format": "json"},
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"input": [{"url": "https://www.amazon.com/dp/B09X7M8TBQ"}]}
)

if response.status_code == 200:
    data = response.json()  # Results ready
elif response.status_code == 202:
    snapshot_id = response.json()["snapshot_id"]  # Poll for completion
```

### 参数

| 参数 | 类型 | 说明 |
|-----------|------|-------------|
| `dataset_id` | 字符串 | 爬虫工具库中的抓取工具标识符（必填） |
| `format` | 字符串 | `json`（默认）、`ndjson`、`jsonl`、`csv` |
| `custom_output_fields` | 字符串 | 以竖线分隔的字段：`url\|title\|price` |
| `include_errors` | 布尔值 | 在结果中包含错误信息 |

### 请求正文

```json
{
  "input": [
    { "url": "https://www.amazon.com/dp/B09X7M8TBQ" },
    { "url": "https://www.amazon.com/dp/B0B7CTCPKN" }
  ]
}
```

### 轮询异步结果

```python
import time

# Trigger
snapshot_id = requests.post(
    "https://api.brightdata.com/datasets/v3/trigger",
    params={"dataset_id": DATASET_ID, "format": "json"},
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"input": [{"url": u} for u in urls]}
).json()["snapshot_id"]

# Poll
while True:
    status = requests.get(
        f"https://api.brightdata.com/datasets/v3/progress/{snapshot_id}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    ).json()["status"]

    if status == "ready": break
    if status == "failed": raise Exception("Job failed")
    time.sleep(10)

# Download
data = requests.get(
    f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}",
    params={"format": "json"},
    headers={"Authorization": f"Bearer {API_KEY}"}
).json()
```

**进度状态值：** `starting` → `running` → `ready` | `failed` <strong>数据保留期：</strong>30 天。<strong>计费：</strong>按交付的记录计费。因无效输入 URL 而失败的请求仍会计费。

完整参考请参阅 **[references/web-scraper-api.md](references/web-scraper-api.md)**，其中包括爬虫类型、输出格式、交付选项和计费详情。

---

## 浏览器 API（抓取浏览器）

通过 CDP/WebDriver 实现完整的浏览器自动化。自动处理 CAPTCHA、指纹识别和反机器人检测。

**连接：**
- Playwright/Puppeteer：`wss://${AUTH}@brd.superproxy.io:9222`
- Selenium：`https://${AUTH}@brd.superproxy.io:9515`

```javascript
const { chromium } = require("playwright-core");

const AUTH = process.env.BROWSER_AUTH;
const browser = await chromium.connectOverCDP(`wss://${AUTH}@brd.superproxy.io:9222`);
const page = await browser.newPage();
page.setDefaultNavigationTimeout(120000); // Always set to 2 minutes

await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
const html = await page.content();
await browser.close();
```

```python
from playwright.async_api import async_playwright

async with async_playwright() as p:
    browser = await p.chromium.connect_over_cdp(f"wss://{AUTH}@brd.superproxy.io:9222")
    page = await browser.new_page()
    page.set_default_navigation_timeout(120000)
    await page.goto("https://example.com", wait_until="domcontentloaded")
    html = await page.content()
    await browser.close()
```

### 自定义 CDP 函数

| 函数 | 用途 |
|----------|---------|
| `Captcha.solve` | 手动触发 CAPTCHA 破解 |
| `Captcha.setAutoSolve` | 启用/禁用自动验证码破解 |
| `Proxy.setLocation` | 设置精确地理位置（必须在 goto 之前调用） |
| `Proxy.useSession` | 跨会话保持相同 IP |
| `Emulation.setDevice` | 应用设备配置文件（iPhone 14 等） |
| `Emulation.getSupportedDevices` | 列出可用的设备配置文件 |
| `Unblocker.enableAdBlock` | 屏蔽广告以节省带宽 |
| `Unblocker.disableAdBlock` | 重新启用广告 |
| `Input.type` | 用于批量填写表单的快速文本输入 |
| `Browser.addCertificate` | 为会话安装客户端 SSL 证书 |
| `Page.inspect` | 获取实时会话的 DevTools 调试 URL |

```javascript
// CDP session pattern for custom functions
const client = await page.target().createCDPSession();

// CAPTCHA solve with timeout
const result = await client.send("Captcha.solve", { timeout: 30000 });

// Precise geo location (must be before goto)
await client.send("Proxy.setLocation", {
  latitude: 37.7749,
  longitude: -122.4194,
  distance: 10,
  strict: true
});

// Block unnecessary resources
await client.send("Network.setBlockedURLs", { urls: ["*google-analytics*", "*.ads.*"] });

// Device emulation
await client.send("Emulation.setDevice", { deviceName: "iPhone 14" });
```

### 会话规则
- **每个会话只能进行一次初始导航**：新 URL = 新会话
- <strong>空闲超时：</strong>5 分钟
- <strong>最长持续时间：</strong>30 分钟

### 地理位置
- 国家/地区级：将 `-country-us` 追加到凭据用户名
- 欧盟范围：追加 `-country-eu`（通过 29 个以上欧洲国家/地区路由）
- 精确位置：使用 `Proxy.setLocation` CDP 命令（导航前）

### 错误代码

| 代码 | 问题 | 修复方法 |
|------|-------|-----|
| `407` | 端口错误 | Playwright/Puppeteer → `9222`，Selenium → `9515` |
| `403` | 身份验证错误 | 检查凭据格式和区域类型 |
| `503` | 服务扩缩容 | 等待 1 分钟后重新连接 |

<strong>计费：</strong>仅按流量计费。屏蔽图片/CSS/字体可降低成本。

完整参考请参阅 **[references/browser-api.md](references/browser-api.md)**，其中包括所有 CDP 函数、带宽优化、CAPTCHA 处理模式和调试。

---

## 详细参考

- **[references/web-unlocker.md](references/web-unlocker.md)**：网络解锁器：完整参数列表、代理接口、特殊标头、异步流程、功能、计费和反模式
- **[references/serp-api.md](references/serp-api.md)**：搜索引擎 API：所有 Google 参数（地图、趋势、评论、Lens、酒店、航班）、Bing 参数、解析后的 JSON 结构、异步处理和计费
- **[references/web-scraper-api.md](references/web-scraper-api.md)**：网页爬虫工具 API：同步与异步、所有参数、轮询、爬虫类型、输出格式和计费
- **[references/browser-api.md](references/browser-api.md)**：浏览器 API：连接字符串、会话规则、所有 CDP 函数、地理位置定向、带宽优化、CAPTCHA、调试和错误代码
