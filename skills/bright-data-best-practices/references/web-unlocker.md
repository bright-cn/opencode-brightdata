# 网络解锁器 API 参考

## 目录

- [概述](#概述)
- [身份验证](#身份验证)
- [REST API（推荐）](#rest-api推荐)
- [代理接口](#代理接口)
- [所有请求参数](#所有请求参数)
- [特殊标头](#特殊标头)
- [响应结构](#响应结构)
- [异步请求](#异步请求)
- [输出格式](#输出格式)
- [功能](#功能)
- [计费模式](#计费模式)
- [最佳实践](#最佳实践)
- [反模式](#反模式)

---

## 概述

网络解锁器是 Bright Data 基于 HTTP 的解锁代理。它会自动选择最佳代理网络、处理反机器人保护、破解验证码并重试失败的请求。它适用于非交互式数据提取，可通过简单的 HTTP 请求获取网页的 HTML、JSON、Markdown 或屏幕截图。

**何时使用网络解锁器，而不是其他 API：**

| 需求 | 使用 |
|------|-----|
| 按 URL 抓取任意网页 | 网络解锁器 |
| 搜索引擎结果（Google、Bing） | 搜索引擎 API |
| 已知平台的结构化数据 | 网页爬虫工具 API |
| 点击、滚动、填写表单、运行 JS | 浏览器 API |
| 浏览器自动化库（Playwright/Puppeteer） | 使用浏览器 API，而非网络解锁器 |

---

## 身份验证

从 Bright Data 控制面板 → 账户设置，或从区域的概述选项卡获取 API 密钥。

```bash
# Environment variable (recommended)
export BRIGHTDATA_API_KEY="your-api-key"
export BRIGHTDATA_UNLOCKER_ZONE="your-zone-name"
```

---

## REST API（推荐）

**端点：** `POST https://api.brightdata.com/request`

**标头：** `Authorization: Bearer YOUR_API_KEY`

### 最简请求

```python
import requests

response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": "YOUR_ZONE_NAME",
        "url": "https://example.com",
        "format": "raw"
    }
)
print(response.text)
```

```javascript
const response = await fetch("https://api.brightdata.com/request", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    zone: "YOUR_ZONE_NAME",
    url: "https://example.com",
    format: "raw"
  })
});
const html = await response.text();
```

```bash
curl -H "Authorization: Bearer $BRIGHTDATA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"zone":"'"$BRIGHTDATA_UNLOCKER_ZONE"'","url":"https://example.com","format":"raw"}' \
     https://api.brightdata.com/request
```

---

## 代理接口

REST API 的替代方案：通过代理端点路由请求。

- **主机：** `brd.superproxy.io`
- **端口：** `33335`
- **凭据：** `brd-customer-{CUSTOMER_ID}-zone-{ZONE_NAME}:{ZONE_PASSWORD}`

```python
import requests

proxies = {
    "http": "http://brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD@brd.superproxy.io:33335",
    "https": "http://brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD@brd.superproxy.io:33335"
}
# Install Bright Data's SSL certificate to avoid SSL errors
response = requests.get("https://example.com", proxies=proxies, verify="/path/to/brightdata-cert.crt")
```

特殊代理用户名标志（追加到用户名字符串）：
- `-country-XX` → 地理位置定向到国家/地区（例如 `-country-us`）
- `-ua-mobile` → 使用移动端 User-Agent
- `-debug-full` → 在响应中启用调试标头

---

## 所有请求参数

### REST API 正文参数

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| `zone` | 字符串 | 是 | 控制面板中的区域名称 |
| `url` | 字符串 | 是 | 目标 URL（必须包含 `http://` 或 `https://`） |
| `format` | 字符串 | 是 | `"raw"`（HTML 字符串）或 `"json"`（结构化 JSON） |
| `method` | 字符串 | 否 | HTTP 动词，默认为 `"GET"`。POST 请求使用 `"POST"` 和 `body` |
| `body` | 字符串 | 否 | POST 正文有效负载（与 `"method": "POST"` 配合使用） |
| `country` | 字符串 | 否 | 用于地理位置定向的 2 字母 ISO 国家/地区代码（例如 `"us"`、`"gb"`）。省略时自动选择 |
| `data_format` | 字符串 | 否 | 转换输出：`"markdown"` 或 `"screenshot"` |
| `async` | 布尔值 | 否 | 设置 `true` 以使用异步模式。立即返回 `response_id` |

---

## 特殊标头

与**代理接口**配合使用。通过代理用户名或自定义请求标头传递。

| 标头 | 值 | 说明 |
|--------|-------|-------------|
| `x-unblock-data-format` | `"markdown"` 或 `"screenshot"` | 将响应转换为 Markdown 或 PNG 屏幕截图 |
| `x-unblock-expect` | CSS 选择器、文本或正文内容 | 返回响应前等待此元素/文本。防止页面未完整加载 |
| `x-unblock-url-fragment` | URL 的 `#fragment` 部分 | 在单个请求中处理带哈希片段的 URL |
| `x-unblock-city` | 城市名称字符串 | Amazon 专用：模拟城市选择 |
| `x-unblock-zipcode` | 邮政编码字符串 | Amazon 专用：模拟邮政编码，以获取特定地区内容 |

**代理用户名标志**（追加到用户名）：
- `-ua-mobile` → 使用移动端 User-Agent，而非桌面端
- `-debug-full` → 添加 `x-brd-debug` 响应标头，其中包含：请求 ID、流量指标、计费状态、目标 IP、使用的标头、节点信息和渲染状态

---

## 响应结构

### 同步（格式：“json”）

```json
{
  "status": 200,
  "headers": {
    "content-type": "text/html",
    "...": "..."
  },
  "body": "<html>...</html>"
}
```

### 同步（格式：“raw”）

直接以字符串形式返回原始 HTML/内容。

### 错误代码

| 代码 | 含义 | 操作 |
|------|---------|--------|
| `200` | 成功 | 处理响应 |
| `400` | 错误请求 | 检查必填字段：`zone`、`url`、`format` |
| `401` | 未授权 | 验证 API 密钥 |

---

## 异步请求

### 设置

在控制面板中启用：你的区域 → 高级选项 → 打开“Asynchronous requests”。

### 流程

**第 1 步：提交请求**

```python
response = requests.post(
    "https://api.brightdata.com/unblocker/req",
    params={"zone": "YOUR_ZONE_NAME"},
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"url": "https://example.com"}
)
response_id = response.json()["response_id"]
```

**第 2 步：轮询结果**

```python
import time

while True:
    result = requests.get(
        "https://api.brightdata.com/unblocker/get_result",
        params={"response_id": response_id},
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    if result.status_code == 200:
        print(result.json()["body"])
        break
    time.sleep(5)
```

### 异步处理要点
- 响应通常在 **5 分钟**内完成，高峰期最长可达 **8 小时**
- 结果保存 **48 小时**
- 更适合响应缓慢的网站或大规模 URL 处理
- 生产环境使用 Webhook：在区域设置中设置 Webhook URL，以接收推送通知

---

## 输出格式

### HTML（默认）
原始 HTML 字符串。使用 `format: "raw"`。

### Markdown
从页面提取的整洁 Markdown。最适合供 LLM 使用。

**REST API：**
```json
{ "zone": "...", "url": "...", "format": "raw", "data_format": "markdown" }
```

<strong>代理：</strong>添加标头：`x-unblock-data-format: markdown`

### 屏幕截图
渲染页面的 PNG 屏幕截图。适合调试和视觉验证。

**REST API：**
```json
{ "zone": "...", "url": "...", "format": "raw", "data_format": "screenshot" }
```

---

## 功能

### CAPTCHA 破解
默认启用。自动破解请求期间遇到的验证码。如果不需要 CAPTCHA 破解，可以在高级设置中禁用，以使用轻量级解决方案。

### 高级域名
某些高难度网站需要额外资源。创建区域时，在区域设置中启用“Premium Domains”。只有以高级域名为目标的请求才按更高费率计费。

### 地理位置定向
自动选择最佳 IP 位置。使用 `country` 参数（REST API）或 `-country-XX`（代理）进行覆盖。仅支持国家/地区级定向（不支持城市级：请使用浏览器 API）。

### 移动端 User-Agent
将 `-ua-mobile` 追加到代理用户名，或通过代理用户名标志使用，以启用移动端专用 User-Agent。

### 自动限流
系统会根据成功率自动调整：
- 默认阈值：70% 成功率
- 自动应用表现更好的配置
- 启用自定义标头/Cookie 时：阈值可自定义

### 调试标头
将 `-debug-full` 添加到代理用户名，以接收包含以下信息的 `x-brd-debug` 响应标头：请求 ID、流量指标、计费状态、目标 IP、使用的标头、节点信息和渲染状态。

### 成功率 API
查询过去 7 天特定域名的成功率：
```bash
GET https://api.brightdata.com/unblocker/success_rate/?zone=YOUR_ZONE&domain=example.com
Authorization: Bearer YOUR_API_KEY
```

---

## 自定义标头和 Cookie（高级）

覆盖自动生成的标头和 Cookie。

<strong>适用场景：</strong>需要传递特定会话 Cookie、身份验证标头或自定义值，以访问网站的特定版本时。

<strong>启用方法：</strong>控制面板 → 你的区域 → 高级选项 → 打开“Custom Headers & Cookies”。

<strong>关键计费说明：</strong>启用自定义标头/Cookie 后，**100% 的请求都会计费**（包括成功和失败），因为你接管了请求参数。标准模式仅对成功请求计费。

**限制：**
- 自定义值必须来自合规团队预先批准的列表
- 未列出的值需要获得合规团队批准
- 不能传递身份验证/登录凭据

---

## 计费模式

| 模式 | 计费 |
|------|---------|
| 标准 | CPM：仅按每 1,000 次**成功**请求计费 |
| 启用自定义标头/Cookie | 对**所有**请求（成功 + 失败）计费 |
| 异步收集/获取调用 | **不计费**：仅初始提交计费 |

通过“我的代理”中的“流量”列监控用量（CPM = 每 1,000 次成功请求的成本）。

---

## 最佳实践

### 1. 首先尝试直接访问目标 API 端点
许多网站提供整洁的 API 端点。请先尝试直接访问 API：通常无需额外配置即可成功，而且成本更低。

```python
# Try the API endpoint first
response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"zone": ZONE, "url": "https://site.com/api/products.json", "format": "raw"}
)
```

### 2. 如果 API 失败，则回退到主网页
如果直接 API 端点失败，请改为抓取主网页。

### 3. 对复杂的 JS 密集型场景使用浏览器 API
需要执行 JavaScript、点击元素或与页面交互时，不要勉强使用网络解锁器。请使用浏览器 API。

### 4. 使用 `x-unblock-expect` 防止页面未完整加载
对于渐进式加载内容的页面，请指定预期元素，以确保所需内容已出现。

```json
{
  "zone": "...",
  "url": "https://example.com/products",
  "format": "raw",
  "headers": { "x-unblock-expect": ".product-list" }
}
```

### 5. 为 LLM 管道使用 Markdown 格式
向 LLM 提供抓取内容时，使用 `data_format: "markdown"` 获取不含 HTML 干扰的整洁结构化文本。

### 6. 对批量/大规模处理使用异步模式
异步模式可提高慢速网站的稳定性，并支持无阻塞地处理大批量 URL。

### 7. 对受地区限制的内容使用地理位置定向
需要地区特定内容（价格、库存情况、本地化页面）时，请传递 `country` 参数。

```json
{ "zone": "...", "url": "https://example.com", "format": "raw", "country": "de" }
```

### 8. 启用自定义标头模式前监控成功率
在启用自定义标头（会将计费改为 100%）前，通过 API 检查域名成功率。

---

## 反模式

**请勿将网络解锁器与浏览器自动化库配合使用。**
- Puppeteer、Playwright、Selenium → 请改用**浏览器 API**
- Chrome、Firefox、Edge → 使用 **Bright Data 代理网络**（住宅代理、ISP 代理等）
- 防检测浏览器（Adspower、Multilogin）→ 使用代理网络

网络解锁器针对单次 HTTP 请求进行了优化，不适用于浏览器会话。

<strong>除非必要，否则请勿启用自定义标头。</strong>启用自定义标头会将计费方式从仅成功请求计费改为所有请求 100% 计费。

<strong>对于分页/动态内容，请勿忽略 `x-unblock-expect` 标头。</strong>如果没有该标头，你可能会在 JavaScript 填充内容之前收到不完整的页面。
