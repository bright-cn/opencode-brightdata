# 分页模式

使用 Bright Data 构建爬虫时，用于处理各种常见分页模式的完整参考。

---

## 目录

- [模式 1：URL 参数分页](#模式-1url-参数分页)
- [模式 2：下一页链接分页](#模式-2下一页链接分页)
- [模式 3：基于偏移量的分页](#模式-3基于偏移量的分页)
- [模式 4：游标/令牌分页](#模式-4游标令牌分页)
- [模式 5：无限滚动](#模式-5无限滚动)
- [模式 6：加载更多按钮](#模式-6加载更多按钮)
- [模式 7：分类/站点地图爬取](#模式-7分类站点地图爬取)
- [异步批量分页](#异步批量分页)
- [速率限制和礼貌抓取](#速率限制和礼貌抓取)
- [检测结果末尾](#检测结果末尾)

---

## 模式 1：URL 参数分页

最常见的模式。通过 `?page=2` 等参数访问页面。

### 基本实现

```python
import time
import requests
import os

API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]

def fetch_page(url: str) -> str:
    response = requests.post(
        "https://api.brightdata.com/request",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"zone": ZONE, "url": url, "format": "raw"},
        timeout=60,
    )
    response.raise_for_status()
    return response.text

def scrape_paginated(base_url: str, param: str = "page", start: int = 1, max_pages: int = 100) -> list:
    """
    Scrape pages where pagination is controlled by a URL parameter.

    Args:
        base_url: The URL without pagination parameter (e.g., "https://site.com/products")
        param: The pagination parameter name (e.g., "page", "p", "pg")
        start: Starting page number (usually 1, sometimes 0)
        max_pages: Safety limit to prevent infinite loops
    """
    all_items = []
    separator = "&" if "?" in base_url else "?"

    for page_num in range(start, start + max_pages):
        url = f"{base_url}{separator}{param}={page_num}"
        html = fetch_page(url)
        items = parse_items(html)  # Your parsing function

        if not items:
            break

        all_items.extend(items)
        time.sleep(1)

    return all_items
```

### 常见 URL 模式

| 网站模式 | URL 格式 | 参数 |
|-------------|-----------|-----------|
| `?page=2` | 最常见 | `page` |
| `?p=2` | 简写 | `p` |
| `?pg=2` | 替代形式 | `pg` |
| `/page/2` | 基于路径 | 以不同方式构建 URL |
| `?page=2&sort=price` | 包含其他参数 | 保留现有参数 |

### 基于路径的分页

某些网站使用 `/page/2/` 而不是 `?page=2`：

```python
def scrape_path_paginated(base_url: str, max_pages: int = 100) -> list:
    all_items = []

    for page_num in range(1, max_pages + 1):
        if page_num == 1:
            url = base_url
        else:
            url = f"{base_url.rstrip('/')}/page/{page_num}/"

        html = fetch_page(url)
        items = parse_items(html)

        if not items:
            break

        all_items.extend(items)
        time.sleep(1)

    return all_items
```

---

## 模式 2：下一页链接分页

跟随 HTML 中的“下一页”链接。适用于页码无法预测或 URL 较为复杂的情况。

```python
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def scrape_with_next_links(start_url: str, max_pages: int = 100) -> list:
    all_items = []
    url = start_url
    pages_scraped = 0

    while url and pages_scraped < max_pages:
        html = fetch_page(url)
        items = parse_items(html)
        all_items.extend(items)
        pages_scraped += 1

        # Find the next page link — try multiple common selectors
        soup = BeautifulSoup(html, "html.parser")
        next_link = (
            soup.select_one('a[rel="next"]') or
            soup.select_one('.pagination .next a') or
            soup.select_one('a.next-page') or
            soup.select_one('li.next a') or
            soup.select_one('[aria-label="Next page"]') or
            soup.select_one('[aria-label="Next"]')
        )

        if next_link and next_link.get("href"):
            url = urljoin(url, next_link["href"])
        else:
            url = None

        time.sleep(1)

    return all_items
```

---

## 模式 3：基于偏移量的分页

API 使用偏移量（要跳过的条目数），而不是页码。

```python
def scrape_offset_based(base_url: str, limit: int = 20, max_items: int = 1000) -> list:
    """
    Scrape with offset-based pagination.
    Common URL pattern: ?offset=0&limit=20, ?offset=20&limit=20, etc.
    """
    all_items = []
    offset = 0

    while offset < max_items:
        separator = "&" if "?" in base_url else "?"
        url = f"{base_url}{separator}offset={offset}&limit={limit}"

        html_or_json = fetch_page(url)
        items = parse_items(html_or_json)

        if not items:
            break

        all_items.extend(items)
        offset += limit
        time.sleep(1)

    return all_items
```

---

## 模式 4：游标/令牌分页

API 会返回用于获取下一批数据的 `next_cursor` 或 `next_token`。常见于现代 REST 和 GraphQL API。

```python
import json

def scrape_cursor_based(api_url: str, limit: int = 100) -> list:
    """
    Scrape API with cursor-based pagination.
    Each response includes a cursor for the next page.
    """
    all_items = []
    cursor = None

    while True:
        url = f"{api_url}?limit={limit}"
        if cursor:
            url += f"&cursor={cursor}"

        raw = fetch_page(url)
        data = json.loads(raw)

        items = data.get("results", data.get("data", data.get("items", [])))
        if not items:
            break

        all_items.extend(items)

        # Look for next cursor in common locations
        cursor = (
            data.get("next_cursor") or
            data.get("cursor") or
            data.get("pagination", {}).get("next_cursor") or
            data.get("meta", {}).get("next_cursor")
        )

        if not cursor:
            break

        time.sleep(1)

    return all_items
```

---

## 模式 5：无限滚动

当用户滚动到底部时加载内容。需要使用浏览器 API。

```python
import asyncio
from playwright.async_api import async_playwright

AUTH = os.environ.get("BROWSER_AUTH")

async def scrape_infinite_scroll(
    url: str,
    item_selector: str,
    max_items: int = 500,
    scroll_pause: float = 2.0,
    max_scroll_attempts: int = 20,
) -> list:
    """
    Scrape a page with infinite scroll.

    Args:
        url: The page URL
        item_selector: CSS selector for individual items
        max_items: Stop after this many items
        scroll_pause: Seconds to wait after each scroll for content to load
        max_scroll_attempts: Stop if no new content after this many scrolls
    """
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://{AUTH}@brd.superproxy.io:9222"
        )
        page = await browser.new_page()
        page.set_default_navigation_timeout(120_000)

        # Block unnecessary resources
        await page.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}",
                         lambda route: route.abort())

        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_selector(item_selector, timeout=30_000)

        previous_count = 0
        no_new_content_count = 0

        while no_new_content_count < max_scroll_attempts:
            # Count current items
            current_count = await page.evaluate(
                f"document.querySelectorAll('{item_selector}').length"
            )

            if current_count >= max_items:
                break

            if current_count == previous_count:
                no_new_content_count += 1
            else:
                no_new_content_count = 0

            previous_count = current_count

            # Scroll to bottom
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(int(scroll_pause * 1000))

        # Extract all items at once
        items = await page.evaluate(f"""
            () => Array.from(document.querySelectorAll('{item_selector}')).map(el => ({{
                // Customize extraction per site:
                text: el.textContent.trim(),
                // name: el.querySelector('.name')?.textContent?.trim(),
                // price: el.querySelector('.price')?.textContent?.trim(),
            }}))
        """)

        await browser.close()
        return items[:max_items]
```

### 检测无限滚动 API 端点

许多无限滚动页面实际上会在滚动时从 API 获取数据。如果能找到该 API 端点，你可以完全跳过浏览器，直接使用网络解锁器访问 API：这样更快且成本更低。

在页面 JavaScript 中查找以下模式：
- 滚动时触发的 Fetch/XHR 调用
- 带有 `page`、`offset`、`after` 或 `cursor` 参数的 URL
- 带有分页变量的 GraphQL 查询

如果找到 API，请使用模式 4（游标）或模式 3（偏移量）配合网络解锁器。

---

## 模式 6：加载更多按钮

通过“加载更多”或“显示更多”按钮获取更多条目。有两种方法：

### 如果按钮会触发 API 调用（首选）

找到 API 端点并通过网络解锁器直接访问：无需浏览器。

### 如果无法发现 API：使用浏览器 API

```python
async def scrape_load_more(
    url: str,
    item_selector: str,
    button_selector: str,
    max_clicks: int = 50,
) -> list:
    """Click 'Load More' button repeatedly to load all content."""
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp(
            f"wss://{AUTH}@brd.superproxy.io:9222"
        )
        page = await browser.new_page()
        page.set_default_navigation_timeout(120_000)
        await page.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2}",
                         lambda route: route.abort())

        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_selector(item_selector, timeout=30_000)

        for _ in range(max_clicks):
            try:
                button = await page.wait_for_selector(
                    button_selector, timeout=5_000
                )
                if not button:
                    break
                await button.click()
                await page.wait_for_timeout(2000)
            except Exception:
                break  # Button gone — all content loaded

        # Extract all items
        items = await page.evaluate(f"""
            () => Array.from(document.querySelectorAll('{item_selector}')).map(el => ({{
                text: el.textContent.trim(),
            }}))
        """)

        await browser.close()
        return items
```

---

## 模式 7：分类/站点地图爬取

需要抓取多个分类、分区或整个网站时使用。

### 方法 A：抓取 sitemap.xml

许多网站会发布列出所有页面的站点地图：

```python
from bs4 import BeautifulSoup

def get_urls_from_sitemap(sitemap_url: str) -> list[str]:
    """Extract all URLs from a sitemap.xml file."""
    xml = fetch_page(sitemap_url)
    soup = BeautifulSoup(xml, "xml")

    urls = []
    # Handle sitemap index (links to other sitemaps)
    for sitemap in soup.select("sitemap loc"):
        sub_xml = fetch_page(sitemap.text.strip())
        sub_soup = BeautifulSoup(sub_xml, "xml")
        urls.extend(loc.text.strip() for loc in sub_soup.select("url loc"))

    # Handle direct URL listings
    urls.extend(loc.text.strip() for loc in soup.select("url loc"))

    return urls

# Usage
all_urls = get_urls_from_sitemap("https://example.com/sitemap.xml")
product_urls = [u for u in all_urls if "/product/" in u]
```

### 方法 B：爬取分类页面

```python
def discover_and_scrape(category_urls: list[str]) -> list:
    """Scrape category listing pages to find individual item URLs, then scrape each."""
    all_items = []

    for cat_url in category_urls:
        # Scrape the category listing (may be paginated)
        item_urls = scrape_paginated_listing(cat_url)

        # Scrape each individual item page
        for item_url in item_urls:
            item_data = scrape_item_page(item_url)
            all_items.append(item_data)
            time.sleep(1)

    return all_items
```

---

## 异步批量分页

如果预先知道所有页面 URL，请并发获取它们以实现最高速度。

### 使用 Python SDK

```python
import asyncio
from brightdata import BrightDataClient

async def scrape_all_pages_async(urls: list[str]) -> list:
    """Fetch multiple pages concurrently."""
    async with BrightDataClient() as client:
        # Scrape all URLs concurrently
        tasks = [client.scrape_url(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_items = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Failed: {urls[i]} — {result}")
                continue
            if result.success:
                items = parse_items(result.data)
                all_items.extend(items)

        return all_items

# Generate all page URLs upfront
urls = [f"https://example.com/products?page={i}" for i in range(1, 51)]
items = asyncio.run(scrape_all_pages_async(urls))
```

### 使用网页爬虫工具 API 触发器（适用于支持的域名）

对于有预构建爬虫工具的网站，一次性提交所有 URL：

```python
import requests
import time

def bulk_scrape_with_trigger(urls: list[str], dataset_id: str) -> list:
    """Submit all URLs to Web Scraper API at once."""
    # Trigger
    response = requests.post(
        "https://api.brightdata.com/datasets/v3/trigger",
        params={"dataset_id": dataset_id, "format": "json"},
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={"input": [{"url": u} for u in urls]}
    )
    snapshot_id = response.json()["snapshot_id"]

    # Poll
    while True:
        progress = requests.get(
            f"https://api.brightdata.com/datasets/v3/progress/{snapshot_id}",
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        status = progress.json()["status"]
        if status == "ready":
            break
        if status == "failed":
            raise RuntimeError("Bulk scrape failed")
        time.sleep(10)

    # Download
    data = requests.get(
        f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}",
        params={"format": "json"},
        headers={"Authorization": f"Bearer {API_KEY}"}
    ).json()

    return data
```

---

## 速率限制和礼貌抓取

即使 Bright Data 会处理代理轮换和反机器人绕过，也应尊重目标网站：

```python
import time
import random

def polite_delay(min_seconds: float = 0.5, max_seconds: float = 2.0):
    """Random delay between requests to avoid hammering the site."""
    time.sleep(random.uniform(min_seconds, max_seconds))
```

**准则：**
- 顺序抓取时，在请求之间添加 1～2 秒延迟
- 进行并发/异步抓取时，由 Bright Data 的基础设施处理速率限制
- 如果持续失败，请增加延迟
- 对于浏览器 API 会话，延迟不太重要，因为每个会话都是独立的

---

## 检测结果末尾

知道何时停止与知道如何分页同样重要。

### 策略

1. **结果为空：** 如果 `parse_items()` 返回空列表，则停止。

2. **重复检测：** 如果出现已抓取过的条目，说明分页已经循环。
   ```python
   seen_ids = set()
   for item in items:
       if item["id"] in seen_ids:
           return all_items  # Duplicates — stop
       seen_ids.add(item["id"])
   ```

3. **比较总数：** 如果页面显示“Y 个结果中的第 X 个”，请检查是否已达到 Y。
   ```python
   total_match = re.search(r'of (\d+) results', html)
   if total_match:
       total = int(total_match.group(1))
       if len(all_items) >= total:
           break
   ```

4. **相同页面检测：** 对于下一页链接分页，请检查是否循环回之前的页面。
   ```python
   visited_urls = set()
   if url in visited_urls:
       break  # Already visited this page
   visited_urls.add(url)
   ```

5. **条目数少于预期：** 如果某页返回的条目数少于页面大小，则它是最后一页。
   ```python
   if len(items) < expected_page_size:
       all_items.extend(items)
       break  # Partial page = last page
   ```
