# 浏览器 API（抓取浏览器）参考

## 目录

- [概述](#概述)
- [身份验证](#身份验证)
- [连接字符串](#连接字符串)
- [支持的框架](#支持的框架)
- [会话规则](#会话规则)
- [快速入门示例](#快速入门示例)
- [自定义 CDP 函数](#自定义-cdp-函数)
- [地理位置定向](#地理位置定向)
- [带宽优化](#带宽优化)
- [CAPTCHA 处理](#captcha-处理)
- [调试](#调试)
- [高级域名](#高级域名)
- [错误代码](#错误代码)
- [计费模式](#计费模式)
- [最佳实践](#最佳实践)
- [反模式](#反模式)

---

## 概述

Bright Data 浏览器 API（也称为抓取浏览器）是一项托管式云浏览器服务。它会自动处理代理管理、指纹识别、验证码破解和机器人检测绕过。当你需要完整的浏览器自动化功能时，请使用它，例如点击、滚动、填写表单、执行 JavaScript 或处理 SPA。

**何时使用浏览器 API，而不是其他 API：**

| 需求 | 使用 |
|------|-----|
| 简单 HTTP 抓取，无需交互 | 网络解锁器 |
| Google/Bing 搜索结果 | 搜索引擎 API |
| 已知平台的结构化数据 | 网页爬虫工具 API |
| 点击、滚动、填写表单、运行 JS | **浏览器 API** |
| 拦截页面中的 XHR/fetch 调用 | **浏览器 API** |
| 处理需要浏览器的复杂反机器人机制 | **浏览器 API** |
| Puppeteer/Playwright/Selenium 自动化 | **浏览器 API** |

---

## 身份验证

从控制面板中浏览器 API 区域的**概述选项卡**获取凭据。

- **用户名：** `brd-customer-{CUSTOMER_ID}-zone-{ZONE_NAME}`
- <strong>密码：</strong>你的区域密码

```bash
export BROWSER_AUTH="brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD"
```

---

## 连接字符串

| 框架 | 连接类型 | 端点 |
|-----------|----------------|----------|
| Playwright | WebSocket | `wss://${AUTH}@brd.superproxy.io:9222` |
| Puppeteer | WebSocket | `wss://${AUTH}@brd.superproxy.io:9222` |
| Selenium | HTTPS | `https://${AUTH}@brd.superproxy.io:9515` |

将 `${AUTH}` 替换为 `username:password`。

<strong>关键提示：</strong>端口错误会导致 407 错误。Playwright/Puppeteer 使用端口 `9222`。Selenium 使用端口 `9515`。

---

## 支持的框架

- <strong>Node.js：</strong>Puppeteer、Playwright、Selenium WebDriver
- <strong>Python：</strong>Playwright、Selenium
- <strong>C# (.NET)：</strong>PuppeteerSharp、Playwright、Selenium
- <strong>其他语言：</strong>任何支持 CDP 或 WebDriver 的语言（Ruby、Go、Java 等）

---

## 会话规则

- <strong>每个会话只能进行一次初始导航。</strong>执行 `page.goto(url)` 后，你可以在同一页面中进行交互（点击、滚动、求值），但不能在同一会话中导航到其他 URL。访问新目标时，请启动新会话。
- <strong>空闲超时：</strong>处于非活动状态 **5 分钟以上**的会话会自动关闭。
- <strong>最长持续时间：</strong>会话不能超过 **30 分钟**。
- <strong>密码输入：</strong>默认为禁用状态，以保护非公开数据。请联系 Bright Data 启用此功能。

---

## 快速入门示例

### Playwright (Node.js)

```javascript
const { chromium } = require("playwright-core");

const AUTH = process.env.BROWSER_AUTH || "brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD";
const TARGET_URL = "https://example.com";

(async () => {
  const browser = await chromium.connectOverCDP(
    `wss://${AUTH}@brd.superproxy.io:9222`
  );
  const page = await browser.newPage();

  // Set navigation timeout to 2 minutes (recommended for complex unlocking)
  page.setDefaultNavigationTimeout(120000);

  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  const html = await page.content();
  console.log(html);

  await browser.close();
})();
```

### Playwright (Python)

```python
import asyncio
from playwright.async_api import async_playwright

AUTH = "brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD"
TARGET_URL = "https://example.com"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://{AUTH}@brd.superproxy.io:9222"
        )
        page = await browser.new_page()
        page.set_default_navigation_timeout(120000)

        await page.goto(TARGET_URL, wait_until="domcontentloaded")
        html = await page.content()
        print(html)

        await browser.close()

asyncio.run(main())
```

### Puppeteer (Node.js)

```javascript
const puppeteer = require("puppeteer-core");

const AUTH = process.env.BROWSER_AUTH || "brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD";

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://${AUTH}@brd.superproxy.io:9222`
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(120000);

  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  const html = await page.content();
  console.log(html);

  await browser.close();
})();
```

### Selenium (Python)

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

AUTH = "brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD"

options = Options()
options.add_argument("--ignore-certificate-errors")

driver = webdriver.Remote(
    command_executor=f"https://{AUTH}@brd.superproxy.io:9515",
    options=options
)
driver.get("https://example.com")
print(driver.page_source)
driver.quit()
```

---

## 自定义 CDP 函数

Bright Data 使用专用命令扩展了标准 CDP。使用 `page.evaluate` 或 `client.send` 调用这些命令。

### CAPTCHA 处理

#### `Captcha.setAutoSolve`
控制自动 CAPTCHA 破解。

```javascript
// Disable auto-solve (use manual control instead)
const client = await page.target().createCDPSession();
await client.send("Captcha.setAutoSolve", { autoSolve: false });
```

#### `Captcha.solve`
手动触发验证码破解并等待完成。

```javascript
const client = await page.target().createCDPSession();
const result = await client.send("Captcha.solve", { timeout: 30000 });
console.log(result.status); // "solved" | "not_detected" | "timeout"
```

```python
# Python equivalent
client = await page.context.new_cdp_session(page)
result = await client.send("Captcha.solve", {"timeout": 30000})
print(result["status"])
```

### 地理位置

#### `Proxy.setLocation`
通过坐标设置精确的代理位置。**必须在导航到网站之前调用。**

```javascript
const client = await page.target().createCDPSession();
await client.send("Proxy.setLocation", {
  latitude: 37.7749,
  longitude: -122.4194,
  distance: 10,   // Search radius in km
  strict: true    // true = only peers within distance; false = expand if none found
});
await page.goto("https://example.com");
```

```python
client = await page.context.new_cdp_session(page)
await client.send("Proxy.setLocation", {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "distance": 10,
    "strict": True
})
await page.goto("https://example.com")
```

### 会话管理

#### `Proxy.useSession`
在多个浏览会话之间保持同一代理节点，实现相同 IP 的连续性。

```javascript
const client = await page.target().createCDPSession();
await client.send("Proxy.useSession", { sessionId: "my-session-123" });
```

### 设备模拟

#### `Emulation.getSupportedDevices`
获取可用设备配置文件列表。

```javascript
const client = await page.target().createCDPSession();
const { devices } = await client.send("Emulation.getSupportedDevices");
console.log(devices); // ["iPhone 14", "Samsung Galaxy S21", ...]
```

#### `Emulation.setDevice`
应用特定设备配置文件（User-Agent、屏幕尺寸、触控）。

```javascript
await client.send("Emulation.setDevice", {
  deviceName: "iPhone 14"
});
// Optional: landscape orientation
await client.send("Emulation.setDevice", {
  deviceName: "iPhone 14",
  landscape: true
});
```

### 广告拦截

#### `Unblocker.enableAdBlock` / `Unblocker.disableAdBlock`
屏蔽/取消屏蔽广告，以减少内容密集型网站的带宽用量。

```javascript
const client = await page.target().createCDPSession();
await client.send("Unblocker.enableAdBlock");
// ... scrape page ...
await client.send("Unblocker.disableAdBlock"); // if needed later
```

### 输入加速

#### `Input.type`
比标准键盘模拟更快的文本输入。适合批量填写表单。

```javascript
const client = await page.target().createCDPSession();
await client.send("Input.type", {
  text: "search query here",
  selector: "#search-input"
});
```

### 文件下载

#### `Download.*`
通过内容类型筛选控制文件下载。

```javascript
const client = await page.target().createCDPSession();
await client.send("Download.setDownloadBehavior", {
  behavior: "allow",
  downloadPath: "/tmp/downloads"
});
// Retrieve file as base64
const { data } = await client.send("Download.getDownloadedFile", {
  guid: "download-guid-here"
});
```

### 安全性/客户端证书

#### `Browser.addCertificate`
安装客户端 SSL/TLS 证书，以访问需要身份验证的域名。会话结束时，证书会被自动移除。

```javascript
await client.send("Browser.addCertificate", {
  host: "example.com",
  certificate: "base64-encoded-cert",
  privateKey: "base64-encoded-key"
});
```

### 调试

#### `Page.inspect`
获取 Chrome DevTools 调试器 URL，以连接并检查实时会话。

```javascript
const { url } = await client.send("Page.inspect");
console.log(`DevTools: ${url}`);
// Open in Chrome or use programmatically
```

---

## 地理位置定向

### 国家/地区级（通过凭据）
将 `-country-XX` 追加到你的用户名（2 字母 ISO 代码）：

```javascript
const AUTH = "brd-customer-ID-zone-NAME-country-us:PASSWORD";
const browser = await chromium.connectOverCDP(`wss://${AUTH}@brd.superproxy.io:9222`);
```

**欧盟定向**：自动通过 29 个以上欧洲国家/地区路由：
```javascript
const AUTH = "brd-customer-ID-zone-NAME-country-eu:PASSWORD";
```

### 精确位置（通过 CDP）
使用 `Proxy.setLocation` 进行城市/街区级定向。**在 `page.goto()` 之前调用**：

```javascript
const client = await page.target().createCDPSession();
await client.send("Proxy.setLocation", {
  latitude: 51.5074,   // London
  longitude: -0.1278,
  distance: 5,          // 5km radius
  strict: false         // expand search if no peers found nearby
});
await page.goto("https://example.com");
```

---

## 带宽优化

浏览器会话按流量计费。以下方法可降低成本：

### 屏蔽不必要的资源

```javascript
// Puppeteer
await page.setRequestInterception(true);
page.on("request", (req) => {
  const blocked = ["image", "stylesheet", "font", "media"];
  if (blocked.includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});
```

```python
# Playwright
async def block_resources(route, request):
    blocked = ["image", "stylesheet", "font", "media"]
    if request.resource_type in blocked:
        await route.abort()
    else:
        await route.continue_()

await page.route("**/*", block_resources)
```

### 屏蔽特定 URL（CDP）

```javascript
const client = await page.target().createCDPSession();
await client.send("Network.setBlockedURLs", {
  urls: [
    "*google-analytics*",
    "*facebook.com/tr*",
    "*.doubleclick.net*"
  ]
});
```

### 启用广告拦截器

```javascript
await client.send("Unblocker.enableAdBlock");
```

### 浏览器缓存
浏览器 API 会在同一会话内多次导航到同一域名时自动缓存资源。无需额外配置。

---

## CAPTCHA 处理

### 自动（默认）
默认启用 CAPTCHA 破解。无需编写代码：浏览器会无感破解验证码。

### 检测并等待 CAPTCHA

```javascript
// Navigate and wait for CAPTCHA to be solved automatically
const client = await page.target().createCDPSession();
await page.goto("https://example.com");

// If CAPTCHA appears, explicitly wait for it
const captchaResult = await client.send("Captcha.solve", { timeout: 60000 });
if (captchaResult.status === "solved") {
  console.log("CAPTCHA solved");
}
```

### 禁用自动破解

```javascript
const client = await page.target().createCDPSession();
await client.send("Captcha.setAutoSolve", { autoSolve: false });
// Now you control when/if to solve CAPTCHAs
```

---

## 调试

### 通过控制面板
导航至你的浏览器 API 区域 → 概述选项卡 → 点击“Chrome Dev Tools Debugger”。

### 通过 CDP 命令

```javascript
const { url } = await client.send("Page.inspect");
// Opens Chrome DevTools for the live session
```

### 编程式检查（Playwright）
Playwright 提供 `slowMo` 和调试 URL 选项。使用 `Page.inspect` 获取调试 URL 并通过 Chrome 连接。

---

## 高级域名

某些被归类为“高级”的网站需要更多浏览器 API 资源：

- 创建区域时启用：打开“Premium Domains”
- 只有访问被归类为高级域名的流量才按更高费率计费
- Bright Data 会根据算法定期更新高级域名列表
- 在你的区域设置中查看当前高级域名列表

---

## 错误代码

| 代码 | 问题 | 解决方案 |
|------|-------|----------|
| `407` | 端口错误 | Playwright/Puppeteer = 端口 `9222`，Selenium = 端口 `9515` |
| `403` | 身份验证失败 | 验证用户名格式和密码；确认你使用的是浏览器 API 区域（而非代理区域） |
| `503` | 服务不可用（扩缩容中） | 1 分钟后重新连接 |

---

## 计费模式

| 因素 | 详情 |
|--------|--------|
| 计价单位 | 仅按流量（消耗的带宽）计费 |
| 时间/实例费用 | 无 |
| 会话空闲超时 | 5 分钟：会话自动关闭 |
| 会话最长持续时间 | 30 分钟 |
| 资源屏蔽 | 减少带宽 = 降低成本 |

---

## 最佳实践

### 1. 始终将导航超时设置为 2 分钟
复杂的反机器人处理需要时间。默认超时（30 秒）太短。

```javascript
page.setDefaultNavigationTimeout(120000); // 2 minutes
```

### 2. 在导航前调用 `Proxy.setLocation`
位置选择必须在 `page.goto()` 之前进行，以确保选择正确的代理。

```javascript
// CORRECT: Set location first
await client.send("Proxy.setLocation", { latitude: 37.7749, longitude: -122.4194, distance: 10 });
await page.goto("https://example.com");

// WRONG: Location set after navigation has no effect on proxy selection
await page.goto("https://example.com");
await client.send("Proxy.setLocation", { ... }); // too late
```

### 3. 屏蔽不必要的资源以降低带宽成本
数据提取通常不需要图片、样式表和字体。请屏蔽它们。

```javascript
await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", route => route.abort());
```

### 4. 优先使用 `waitUntil: "domcontentloaded"`，而非 `networkidle`
`networkidle` 会等待所有网络活动停止，速度较慢且通常没有必要。`domcontentloaded` 更快，对大多数页面而言已经足够。

```javascript
await page.goto(url, { waitUntil: "domcontentloaded" });
```

### 5. 为每个新目标 URL 启动全新会话
由于每个会话只允许一次初始导航，请为每个独立抓取任务创建新的浏览器连接。

```javascript
async function scrapeUrl(url) {
  const browser = await chromium.connectOverCDP(`wss://${AUTH}@brd.superproxy.io:9222`);
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return await page.content();
  } finally {
    await browser.close();
  }
}
```

### 6. 使用 `Proxy.useSession` 跨会话保持 IP 连续性
当多个请求需要使用同一 IP 时（例如跨会话执行登录 → 抓取 → 退出流程）：

```javascript
await client.send("Proxy.useSession", { sessionId: "user-session-abc123" });
```

### 7. 对内容密集型网站使用 `Unblocker.enableAdBlock`
广告网络会显著增加带宽。屏蔽广告可降低新闻网站、博客及类似页面的成本。

### 8. 对移动端特定页面使用 `Emulation.setDevice`
某些网站会向移动用户提供不同内容。请设置设备配置文件，而不是手动设置 User-Agent。

```javascript
await client.send("Emulation.setDevice", { deviceName: "iPhone 14" });
await page.goto("https://example.com/mobile");
```

### 9. 开发期间通过 `Page.inspect` 监控会话
开发期间，使用 `Page.inspect` 获取实时 DevTools URL，以调试浏览器实际看到的内容。

### 10. 使用 `Input.type` 批量填写表单
`Input.type` 比模拟逐个按键更快，这对于大规模填写多个字段尤为重要。

---

## 反模式

<strong>请勿将代理网络与 Playwright/Puppeteer/Selenium 配合使用。</strong>浏览器自动化库应连接浏览器 API，而不是通过代理路由。浏览器 API 端点（`wss://...`）会完全取代代理配置。

<strong>请勿对不同的目标 URL 重复使用会话。</strong>一个会话 = 一次 `page.goto()`。此后只能与已加载的页面交互。对于新 URL，请创建新会话。

<strong>请勿将导航超时设置为低于 60 秒。</strong>Bright Data 的解锁过程可能需要一些时间。低于 60 秒可能导致高难度网站过早超时。建议设置为 120 秒。

<strong>除非必要，否则请勿启用自定义标头。</strong>自定义标头/Cookie 会将计费方式从仅成功请求计费改为所有请求 100% 计费。

<strong>不要对 SPA 页面依赖 `networkidle`。</strong>单页应用可能永远无法达到真正的 `networkidle` 状态。请改用特定元素等待器：
```javascript
await page.waitForSelector(".product-data", { timeout: 30000 });
```
