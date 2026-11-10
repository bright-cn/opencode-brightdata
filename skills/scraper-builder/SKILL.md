---
name: scraper-builder
description: "Build production-ready web scrapers for any website using Bright Data infrastructure. Guides you through site analysis, API selection, selector extraction, pagination handling, and complete scraper implementation. Use this skill whenever the user wants to build a scraper, create a crawler, extract data from a website, scrape product pages, handle pagination, build a data pipeline from a web source, or automate data collection from any site — even if they don't explicitly say 'scraper'. Triggers on phrases like 'build a scraper for', 'scrape data from', 'extract products from', 'crawl pages on', 'get data from [website]', or 'I need to pull data from'."
---

# 爬虫构建器

你正在为用户构建可用于生产环境的网页爬虫。你的任务是引导用户从“我想从网站 X 获取数据”逐步实现一个可运行、稳健的爬虫，使其能够处理分页、动态内容、反机器人保护和数据解析等真实场景中的挑战。

## 关键要求：始终验证输出

构建爬虫后，**始终在少量样本（1～3 个页面）上运行它**，并在扩展规模前向用户展示提取的数据。如果输出为空、格式错误或缺少字段，请继续迭代：修复选择器、切换 API 或调整解析逻辑。无法生成干净数据的爬虫还不能算完成。

请认真完成侦察阶段。预先花 2 分钟分析 HTML，可以避免之后花数小时调试。质量比速度更重要。

## 此技能的工作方式

此技能会协调 Bright Data 的四种 API，以智能方式构建爬虫。你不会编写脆弱的自定义抓取代码，而是先分析目标网站，再选择最可靠且最具成本效益的提取方法。决策树如下：

1. **是否已有预构建的爬虫工具？** → 使用网页爬虫工具 API（无需编写解析代码）
2. **页面是静态的/不需要交互吗？** → 使用网络解锁器 API（成本最低、最简单）
3. **页面是否需要点击、滚动或 JS 交互？** → 使用浏览器 API（完整自动化）
4. **需要搜索引擎结果吗？** → 使用搜索引擎 API

此技能会生成完整、可运行的代码，而不是伪代码或大纲。

---

## 阶段 1：了解目标

编写任何代码前，你需要了解用户想要什么以及网站是什么样的。询问以下问题（跳过用户已经回答的内容）：

1. **哪个网站？**：目标 URL 或域名
2. **哪些数据？**：需要哪些字段（产品名称、价格、评价等）
3. **范围多大？**：单个页面、分类页面、搜索结果，还是整个网站分区？
4. **是否分页？**：是否需要跨多个页面抓取？
5. **数据量？**：大约有多少条目/页面？（这会影响同步与异步的选择以及并发策略，参阅 [references/concurrency-guide.md](references/concurrency-guide.md)）
6. **输出格式？**：JSON、CSV 还是数据库？（未指定时默认为 JSON）
7. **语言偏好？**：Python 还是 Node.js？（未指定时默认为 Python）

不要过度询问。如果用户说“为 Amazon 产品页面构建爬虫”，你已经知道：网站 = Amazon，数据 = 产品详情，范围 = 产品页面。直接进入下一步。

---

## 阶段 2：检查预构建爬虫工具

进行任何自定义工作前，先检查 Bright Data 是否已为该域名提供爬虫工具。这是最快、最便宜且最可靠的路径。

阅读 [references/supported-domains.md](references/supported-domains.md)，查看常见预构建爬虫的精选列表。但该列表可能不完整：Bright Data 支持 100 多个域名，并会定期添加新的爬虫工具。如果精选列表中没有目标域名，**请查询实时数据集列表 API** 进行检查：

```bash
curl -H "Authorization: Bearer $BRIGHTDATA_API_KEY" \
     https://api.brightdata.com/datasets/list
```

这会返回所有可用爬虫工具及其 `dataset_id` 和名称。在结果中搜索目标域名。你也可以浏览 `https://docs.brightdata.com/llms.txt` 中的完整文档索引，查找特定爬虫的文档和支持的参数。

### 如果存在预构建爬虫工具

使用网页爬虫工具 API 或 Python SDK 的特定平台爬虫。这会直接提供结构化 JSON，无需编写解析代码。

**Python SDK 方法（首选）：**
```python
from brightdata import BrightDataClient

async with BrightDataClient() as client:
    result = await client.scrape.amazon.products(url="https://amazon.com/dp/B0CRMZHDG8")
    if result.success:
        print(result.data)  # Structured product data
```

**REST API 方法（shell/curl）：**
```bash
bash scripts/datasets.sh amazon_product "https://www.amazon.com/dp/B09V3KXJPB"
```

使用预构建爬虫工具进行批量抓取时，请使用异步触发/轮询/获取模式：
```python
async with BrightDataClient() as client:
    # Trigger without waiting
    job = await client.scrape.amazon.products_trigger(url=url)
    # Poll until ready
    await job.wait(timeout=180, poll_interval=10, verbose=True)
    # Fetch results
    data = await job.fetch()
```

如果用户需要使用预构建爬虫工具进行多页面抓取，请跳至阶段 5（分页/编排）。

### 如果不存在预构建爬虫工具

继续进入阶段 3：你需要分析网站并构建自定义爬虫。

---

## 阶段 3：网站侦察

这是区分可靠爬虫和脆弱爬虫的关键步骤。在编写提取代码前，你需要了解网站的结构。

### 步骤 3a：获取页面 HTML

使用网络解锁器获取原始 HTML。这样可以判断内容是由服务器渲染还是客户端渲染，并获得可供分析的实际 DOM。

```python
import requests
import os

API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]

response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": ZONE,
        "url": "https://target-site.com/page",
        "format": "raw"
    }
)
html = response.text
```

或者使用抓取技能中的 shell 脚本：
```bash
bash skills/scrape/scripts/scrape.sh "https://target-site.com/page"
```

### 步骤 3b：分析 HTML 结构

阅读 [references/site-analysis-guide.md](references/site-analysis-guide.md)，查看详细的分析操作手册。

查看获取到的 HTML，并确定：

1. **内容是否位于 HTML 中？** 如果你需要的数据存在于原始 HTML 中，使用网络解锁器即可。如果 HTML 基本只是带有 JS 框架标记（`<div id="root"></div>`、`<div id="__next"></div>`、`ng-app`）的空壳，则内容由客户端渲染，你需要使用浏览器 API。

2. **识别可靠的选择器。** 找到能够定位数据字段的 CSS 选择器或数据属性。按以下顺序优先选择（最可靠 → 最不可靠）：
   - `data-*` 属性（例如 `[data-testid="product-price"]`）：网站改版后仍能保持有效
   - 带有特定类的语义化 HTML（例如 `.product-card .price`）
   - `id` 属性：具有唯一性，但可能发生变化
   - 结构选择器（例如 `div > span:nth-child(2)`）：脆弱，应避免使用

3. **识别数据模式。** 它属于：
   - **列表页**：多个条目以重复结构呈现（产品网格、搜索结果）
   - **详情页**：包含多个字段的单个条目（产品页面、个人资料）
   - **分页**：带有上一页/下一页控件的多页结果
   - **无限滚动**：滚动时加载内容（需要浏览器 API）
   - **API 驱动**：检查 Network 选项卡中的模式；有些网站会从 JSON API 获取数据

4. **检查隐藏 API。** 许多现代网站通过 XHR/fetch 调用内部 API 加载数据。如果你在页面源代码或网络活动中发现结构化 JSON 端点，直接通过网络解锁器访问这些端点通常比解析 HTML 更简洁。

### 步骤 3c：确定提取方法

根据分析结果：

| 发现 | 方法 |
|---------|----------|
| 内容位于 HTML 中，且无需交互 | **网络解锁器**：获取 HTML，并使用 BeautifulSoup/Cheerio 解析 |
| 内容通过 JSON API 加载 | **网络解锁器**：直接访问 API 端点 |
| 内容需要 JS 渲染 | **浏览器 API**：渲染后提取 |
| 内容需要点击/滚动/交互 | **浏览器 API**：自动执行交互 |
| 无限滚动分页 | **浏览器 API**：滚动并采集 |
| 基于标准 URL 的分页 | **网络解锁器**：遍历页面 URL |
| CAPTCHA 较多的网站 | **浏览器 API**：自动破解 CAPTCHA |

---

## 阶段 4：构建提取器

现在编写实际的提取代码。具体方法取决于阶段 3 中的决策。

### 方法 A：网络解锁器 + HTML 解析

最适合静态网站或使用服务器端渲染 HTML 的网站。这是成本最低且速度最快的方法。

```python
import requests
import os
from bs4 import BeautifulSoup

API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]

def fetch_page(url: str) -> str:
    """Fetch a page through Bright Data Web Unlocker."""
    response = requests.post(
        "https://api.brightdata.com/request",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"zone": ZONE, "url": url, "format": "raw"}
    )
    response.raise_for_status()
    return response.text

def parse_products(html: str) -> list[dict]:
    """Extract product data from HTML. Customize selectors per site."""
    soup = BeautifulSoup(html, "html.parser")
    products = []

    for card in soup.select(".product-card"):  # Adjust selector
        product = {
            "name": card.select_one(".product-title").get_text(strip=True),
            "price": card.select_one(".product-price").get_text(strip=True),
            "url": card.select_one("a")["href"],
            # Add more fields as needed
        }
        products.append(product)

    return products

# Usage
html = fetch_page("https://example.com/products")
products = parse_products(html)
```

**稳健解析的关键模式：**
- 始终使用 `.get_text(strip=True)` 清理空白字符
- 使用 `.get("href", "")` 而不是 `["href"]`，以避免属性缺失时出现 KeyError
- 将单个字段的提取包装在 try/except 中，避免一个异常条目导致整个抓取任务失败
- 在单独的步骤中标准化价格（去除货币符号并转换为浮点数）

### 方法 B：网络解锁器 + 直接 API 提取

如果发现网站从 JSON API 端点加载数据，请直接访问该端点。这是最简洁的方法：无需解析 HTML。

```python
import requests
import json
import os

API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]

def fetch_api(api_url: str) -> dict:
    """Fetch a JSON API endpoint through Web Unlocker."""
    response = requests.post(
        "https://api.brightdata.com/request",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"zone": ZONE, "url": api_url, "format": "raw"}
    )
    return json.loads(response.text)

# Example: site with internal API
data = fetch_api("https://example.com/api/products?page=1&limit=50")
products = data["results"]  # Already structured!
```

### 方法 C：浏览器 API + Playwright

当网站需要 JavaScript 渲染、交互（点击、滚动、填写表单）或采用严格的反机器人措施时使用。

```python
import asyncio
from playwright.async_api import async_playwright

AUTH = os.environ.get("BROWSER_AUTH", "brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD")

async def scrape_with_browser(url: str) -> str:
    """Scrape a page using Bright Data Browser API."""
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://{AUTH}@brd.superproxy.io:9222"
        )
        page = await browser.new_page()
        page.set_default_navigation_timeout(120_000)  # 2 minutes — required

        # Block unnecessary resources to reduce bandwidth costs
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}",
                         lambda route: route.abort())

        await page.goto(url, wait_until="domcontentloaded")

        # Wait for the content you need to appear
        await page.wait_for_selector(".product-card", timeout=30_000)

        # Extract data using page.evaluate for performance
        products = await page.evaluate("""
            () => Array.from(document.querySelectorAll('.product-card')).map(card => ({
                name: card.querySelector('.product-title')?.textContent?.trim(),
                price: card.querySelector('.product-price')?.textContent?.trim(),
                url: card.querySelector('a')?.href,
            }))
        """)

        await browser.close()
        return products
```

**必须遵循的浏览器 API 规则：**
- 始终将导航超时设置为 120 秒（`set_default_navigation_timeout(120_000)`）
- 每个会话使用一个 `page.goto()`：对于新 URL，请创建新的浏览器连接
- 使用 `wait_until="domcontentloaded"`，不要使用 `networkidle`（SPA 永远不会达到 networkidle 状态）
- 等待特定选择器，而不是使用任意延迟
- 阻止图片、CSS 和字体，以降低带宽成本
- 使用 `page.evaluate()` 进行批量提取：它比逐个调用选择器更快

### 方法 D：使用浏览器 API 处理无限滚动

适用于在向下滚动时加载更多内容的网站。

```python
async def scrape_infinite_scroll(url: str, max_items: int = 100) -> list:
    """Scrape a page with infinite scroll."""
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://{AUTH}@brd.superproxy.io:9222"
        )
        page = await browser.new_page()
        page.set_default_navigation_timeout(120_000)
        await page.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2}",
                         lambda route: route.abort())
        await page.goto(url, wait_until="domcontentloaded")

        all_items = []
        previous_count = 0

        while len(all_items) < max_items:
            # Scroll to bottom
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)  # Wait for content to load

            # Extract all currently visible items
            items = await page.evaluate("""
                () => Array.from(document.querySelectorAll('.item-selector')).map(el => ({
                    // ... extract fields
                }))
            """)

            all_items = items
            if len(all_items) == previous_count:
                break  # No new content loaded — we've reached the end
            previous_count = len(all_items)

        await browser.close()
        return all_items[:max_items]
```

---

## 阶段 5：处理分页

大多数抓取任务都涉及多个页面。具体方法取决于分页类型。

阅读 [references/pagination-patterns.md](references/pagination-patterns.md)，查看详细的分页策略。

### 模式 1：基于 URL 的分页（最常见）

通过 `?page=2` 或 `?offset=20` 等 URL 参数访问不同页面。

```python
import time

def scrape_all_pages(base_url: str, max_pages: int = 50) -> list[dict]:
    """Scrape all pages of a paginated listing."""
    all_items = []

    for page_num in range(1, max_pages + 1):
        url = f"{base_url}?page={page_num}"
        html = fetch_page(url)
        items = parse_products(html)

        if not items:
            break  # No more results

        all_items.extend(items)
        print(f"Page {page_num}: {len(items)} items (total: {len(all_items)})")

        time.sleep(1)  # Be respectful — don't hammer the site

    return all_items
```

### 模式 2：下一页链接分页

跟随 HTML 中的“下一页”链接。

```python
def scrape_with_next_links(start_url: str) -> list[dict]:
    """Follow next-page links to scrape all pages."""
    all_items = []
    url = start_url

    while url:
        html = fetch_page(url)
        items = parse_products(html)
        all_items.extend(items)

        # Find next page link
        soup = BeautifulSoup(html, "html.parser")
        next_link = soup.select_one("a.next-page, a[rel='next'], .pagination .next a")
        url = next_link["href"] if next_link else None

        # Handle relative URLs
        if url and not url.startswith("http"):
            from urllib.parse import urljoin
            url = urljoin(start_url, url)

        time.sleep(1)

    return all_items
```

### 模式 3：并发批量抓取

当 URL 较多（50 个以上）时，**始终使用由信号量控制的并发请求**：切勿在顺序循环中逐个获取。阅读 [references/concurrency-guide.md](references/concurrency-guide.md)，了解完整的并发操作手册，包括针对不同网站的调优、多网站并行和重试策略。

```python
import asyncio
import aiohttp

CONCURRENCY = 20  # Start here, tune per site — see concurrency guide

async def scrape_pages_concurrent(urls: list[str]) -> list[dict]:
    """Scrape multiple pages with controlled concurrency."""
    sem = asyncio.Semaphore(CONCURRENCY)

    async def fetch_one(session, url):
        async with sem:
            async with session.post(
                "https://api.brightdata.com/request",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={"zone": ZONE, "url": url, "format": "raw"},
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                return {"url": url, "html": await resp.text()}

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    all_items = []
    for r in results:
        if not isinstance(r, Exception):
            all_items.extend(parse_products(r["html"]))
    return all_items

# Generate all page URLs
urls = [f"https://example.com/products?page={i}" for i in range(1, 51)]
items = asyncio.run(scrape_pages_concurrent(urls))
```

### 模式 4：基于游标/令牌的分页（API）

某些 API 使用游标令牌而不是页码。

```python
def scrape_with_cursor(api_base: str) -> list[dict]:
    """Handle cursor-based API pagination."""
    all_items = []
    cursor = None

    while True:
        url = f"{api_base}?limit=100"
        if cursor:
            url += f"&cursor={cursor}"

        data = fetch_api(url)
        all_items.extend(data["results"])

        cursor = data.get("next_cursor")
        if not cursor:
            break

    return all_items
```

---

## 阶段 6：组装完整爬虫

现在将所有部分组合成整洁、可运行的脚本。你构建的每个爬虫都应包含：

1. **配置**：环境变量、目标 URL、输出设置
2. **获取器**：检索页面的函数（网络解锁器或浏览器 API）
3. **解析器**：从 HTML/JSON 中提取结构化数据的函数
4. **分页器**：处理多个页面的逻辑
5. **并发**：通过信号量控制并行获取（参阅 [references/concurrency-guide.md](references/concurrency-guide.md)）
6. **输出**：以所需格式保存结果
7. **错误处理**：重试、日志记录、优雅失败

**重要提示：** 如果用户需要抓取约 50 个以上的 URL，爬虫**必须**使用并发请求，而不是顺序循环。有关完整的并发爬虫模板和调优指南，请参阅 [references/concurrency-guide.md](references/concurrency-guide.md)。

### 模板：完整爬虫脚本

```python
#!/usr/bin/env python3
"""
Scraper for [SITE NAME] - [DESCRIPTION]
Built with Bright Data [API NAME]

Usage:
    export BRIGHTDATA_API_KEY="your-api-key"
    export BRIGHTDATA_UNLOCKER_ZONE="your-zone-name"
    python scraper.py
"""

import json
import os
import sys
import time
import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# --- Configuration ---
API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]
TARGET_URL = "https://example.com/products"
OUTPUT_FILE = "results.json"
MAX_PAGES = 50

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger(__name__)

# --- Fetcher ---
def fetch_page(url: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            response = requests.post(
                "https://api.brightdata.com/request",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json={"zone": ZONE, "url": url, "format": "raw"},
                timeout=60,
            )
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            log.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to fetch {url} after {retries} attempts")

# --- Parser ---
def parse_items(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []

    for card in soup.select("ITEM_SELECTOR"):
        try:
            item = {
                "name": card.select_one("NAME_SELECTOR").get_text(strip=True),
                "price": card.select_one("PRICE_SELECTOR").get_text(strip=True),
                "url": card.select_one("a").get("href", ""),
            }
            items.append(item)
        except (AttributeError, TypeError) as e:
            log.warning(f"Failed to parse item: {e}")
            continue

    return items

# --- Paginator ---
def scrape_all(base_url: str) -> list[dict]:
    all_items = []

    for page in range(1, MAX_PAGES + 1):
        url = f"{base_url}?page={page}"
        log.info(f"Scraping page {page}...")

        html = fetch_page(url)
        items = parse_items(html)

        if not items:
            log.info(f"No items on page {page} — stopping")
            break

        all_items.extend(items)
        log.info(f"Got {len(items)} items (total: {len(all_items)})")
        time.sleep(1)

    return all_items

# --- Output ---
def save_results(items: list[dict], path: str):
    with open(path, "w") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    log.info(f"Saved {len(items)} items to {path}")

# --- Main ---
if __name__ == "__main__":
    items = scrape_all(TARGET_URL)
    save_results(items, OUTPUT_FILE)
```

为用户构建爬虫时，请自定义此模板：
- 将 `ITEM_SELECTOR`、`NAME_SELECTOR`、`PRICE_SELECTOR` 替换为阶段 3 中确定的实际选择器
- 选择正确的获取器（网络解锁器或浏览器 API）
- 从阶段 5 中选择正确的分页模式
- 添加用户所需的具体字段
- 如果用户需要 CSV 或写入数据库，请调整输出格式

---

## 决策参考：API 选择快速指南

| 场景 | API | 成本 | 速度 |
|----------|-----|------|-------|
| 网站有预构建爬虫工具（Amazon、LinkedIn 等） | 网页爬虫工具 API | 按记录计费 | 快 |
| 静态 HTML 页面，不需要 JS | 网络解锁器 | 按请求计费（仅成功时） | 快 |
| 网站提供 JSON API | 网络解锁器 → API 端点 | 按请求计费（仅成功时） | 最快 |
| JS 渲染的内容（React、Vue、Angular） | 浏览器 API | 按带宽计费 | 中等 |
| 无限滚动 | 浏览器 API | 按带宽计费 | 慢 |
| 需要提交表单/登录 | 浏览器 API | 按带宽计费 | 中等 |
| CAPTCHA 较多的网站 | 浏览器 API | 按带宽计费 | 中等 |
| 搜索引擎结果 | 搜索引擎 API | 按请求计费 | 快 |

---

## 应避免的常见陷阱

1. **当网络解锁器足够时，不要默认使用浏览器 API。** 浏览器 API 成本更高（按带宽计费），而且速度更慢。始终先尝试网络解锁器。

2. **不要使用结构型 CSS 选择器**，例如 `div:nth-child(3) > span`。网站添加横幅或重新排列元素后，这类选择器就会失效。请使用数据属性或语义化选择器。

3. **不要硬编码分页上限。** 始终检查页面是否返回了实际条目。空页面意味着已经到达末尾。

4. **不要跳过侦察阶段。** 花 2 分钟分析 HTML，可以避免之后花数小时调试脆弱的选择器。

5. **不要忘记按条目处理错误。** 一个格式异常的产品卡片不应导致整个抓取任务崩溃。请将单个条目的解析包装在 try/except 中。

6. **不要将 `networkidle` 与浏览器 API 一起使用。** SPA 永远不会真正达到网络空闲状态。请改用 `domcontentloaded` + `wait_for_selector`。

7. **抓取列表时，不要为每个页面创建新的浏览器会话。** 如果你位于列表页并点击“下一页”，可以继续使用同一会话。仅针对不同的基础 URL 创建新会话。

8. **当 URL 很多时，不要顺序抓取。** 逐个获取 1,000 多个 URL，并在每次请求之间执行 `time.sleep(1)`，速度慢得无法接受。请使用由信号量控制的并发请求。参阅 [references/concurrency-guide.md](references/concurrency-guide.md)。

---

## 示例

### 示例 1：电商产品爬虫（存在预构建工具）

用户说：“为 Amazon 产品页面构建爬虫，我有 200 个 ASIN 的列表”

操作：
1. 检查 supported-domains.md → Amazon 有预构建爬虫工具
2. 200 个 URL → 使用异步触发/轮询/获取模式（超过同步模式的 20 个 URL 限制）
3. 使用 `client.scrape.amazon.products_trigger()` 批量提交 URL
4. 轮询直至数据就绪，然后下载结构化 JSON
5. 无需解析 HTML：数据已预先结构化

结果：包含异步批量抓取、进度日志和 JSON 输出的完整 Python 脚本。

### 示例 2：自定义网站爬虫（无预构建工具）

用户说：“我需要抓取 jobs.customsite.com 上的所有职位列表，包括分页内容”

操作：
1. 检查 supported-domains.md → 未列出 → 查询数据集列表 API → 未找到
2. 通过网络解锁器获取页面 HTML 并分析结构
3. 内容位于 HTML 中（SSR）→ 使用网络解锁器方法
4. 确定选择器：`.job-card`、`.job-title`、`.company-name`、`.salary`
5. 通过 `?page=N` URL 参数进行分页
6. 构建包含获取器 + 解析器 + 分页器的完整爬虫

结果：使用网络解锁器 + BeautifulSoup，并通过 URL 进行分页的完整 Python 脚本。

### 示例 3：大量使用 JS 的网站（需要浏览器 API）

用户说：“从通过滚动加载数据的 React SPA 中抓取产品价格”

操作：
1. 通过网络解锁器获取 HTML → body 是空的 `div#root` → 客户端渲染
2. 检查页面源代码中是否存在隐藏 API → 未找到 API
3. 升级为使用浏览器 API + Playwright
4. 实现带资源阻止功能的无限滚动模式
5. 内容加载后通过 `page.evaluate()` 提取数据

结果：包含浏览器 API、无限滚动处理和带宽优化的异步 Playwright 脚本。

---

## 故障排除

### 网络解锁器返回空白页面或被阻止的页面
**原因：** 网站需要 JavaScript 渲染，或采用了严格的机器人检测措施。**解决方案：** 升级为使用浏览器 API。还可以尝试添加 `data_format: "markdown"`，查看内容是否以其他格式存在。

### 选择器在本地有效，但在生产环境中失效
**原因：** 网站会根据不同地区或 User-Agent 返回不同的 HTML。**解决方案：** 在网络解锁器请求中添加 `country` 参数，以指定相同地区。请在 API 实际返回的 HTML 上验证选择器，而不是在浏览器 DevTools 中验证。

### 爬虫在不同页面中返回重复条目
**原因：** 分页逻辑发生循环，或网站的分页行为不一致。**解决方案：** 使用集合跟踪已见过的条目 ID。出现重复项时终止。确认分页 URL 模式正确。

### 浏览器 API 会话超时
**原因：** 导航超时时间太短，或网站解除封锁的速度较慢。**解决方案：** 始终设置 `set_default_navigation_timeout(120_000)`。使用 `wait_until="domcontentloaded"`，不要使用 `networkidle`。检查你的区域是否需要启用高级域名。

### API 返回 401 Unauthorized
**原因：** 缺少 `BRIGHTDATA_API_KEY` 环境变量或其值无效。**解决方案：** 验证密钥是否已设置：`echo $BRIGHTDATA_API_KEY`。从 `https://www.bright.cn/cp/setting/users` 获取新密钥。

---

## 参考文件

- **[references/supported-domains.md](references/supported-domains.md)**：预构建爬虫工具的完整列表，包含数据集 ID 和 Python SDK 方法。编写自定义抓取代码前，请首先检查此文件。
- **[references/site-analysis-guide.md](references/site-analysis-guide.md)**：分析网站 HTML 结构和选择可靠选择器的分步操作手册。
- **[references/pagination-patterns.md](references/pagination-patterns.md)**：适用于各种常见模式的详细分页策略和代码示例。
- **[references/concurrency-guide.md](references/concurrency-guide.md)**：如何通过信号量控制并发抓取 URL，包括针对不同网站的调优、多网站并行、重试和进度跟踪。**每当用户需要抓取 50 个以上的 URL 时，请阅读此文件。**
