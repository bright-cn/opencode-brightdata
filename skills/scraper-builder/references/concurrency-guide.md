# 爬虫并发与并行指南

## 问题

默认情况下，编程智能体会编写**逐个**获取 URL 的爬虫：使用带有 `time.sleep()` 的顺序循环。对于小型任务（10～20 个页面），这没有问题；但对于数千个 URL，速度会极其缓慢。以每秒 1 个请求的速度顺序抓取 9,000 个 URL 需要 **2.5 小时**。使用 20 个并发请求，只需 **7.5 分钟**。

**当用户需要抓取约 50 个以上的 URL 时，始终使用并发方式构建爬虫。** 这不是一种优化，而是生产级爬虫的基本要求。

---

## 核心原则：由信号量控制并发

切勿一次性发出所有请求（`asyncio.gather(*all_tasks)`）：这会让目标网站和代理基础设施都不堪重负。应使用**信号量**限制同时进行的请求数量。

```python
import asyncio
import aiohttp

CONCURRENCY = 20  # Max concurrent requests — tune per site (see below)

async def fetch_page(session: aiohttp.ClientSession, sem: asyncio.Semaphore, url: str) -> dict:
    """Fetch a single URL with concurrency control."""
    async with sem:
        async with session.post(
            "https://api.brightdata.com/request",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"zone": ZONE, "url": url, "format": "raw"},
            timeout=aiohttp.ClientTimeout(total=60),
        ) as response:
            html = await response.text()
            return {"url": url, "html": html, "status": response.status}

async def scrape_concurrent(urls: list[str]) -> list[dict]:
    """Scrape all URLs with controlled concurrency."""
    sem = asyncio.Semaphore(CONCURRENCY)
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_page(session, sem, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    successes = []
    for r in results:
        if isinstance(r, Exception):
            log.warning(f"Failed: {r}")
        else:
            successes.append(r)
    return successes
```

---

## 如何选择合适的并发级别

最佳并发级别取决于你使用的 Bright Data API 和目标网站。以下是建议的起始值：

| API | 建议并发数 | 说明 |
|-----|------------------------|-------|
| 网络解锁器 | 20～50 个并发请求 | Bright Data 会在其服务端处理速率限制 |
| 网页爬虫工具 API（异步） | 5～10 个批量触发任务 | 每次触发都会在内部处理批任务 |
| 浏览器 API | 5～10 个并发会话 | 每个会话都是真实浏览器：资源占用较高 |
| 搜索引擎 API | 20～50 个并发请求 | 与网络解锁器类似 |

### 按网站调优

从建议的默认值开始，然后进行调整：

1. **从保守值开始**：先使用 10 个并发请求
2. **观察错误**：如果出现 429（速率受限）或 502/503 错误，请降低并发数
3. **逐步提高**：如果执行 100 个请求后没有错误，将并发数提高到 20，然后提高到 30，依此类推
4. **不同网站有不同限制**：如果抓取 3 个网站，请分别进行调优

```python
# Per-site concurrency configuration
SITE_CONCURRENCY = {
    "amazon.com": 10,       # Aggressive anti-bot — keep low
    "example-blog.com": 30, # Lenient site — can push higher
    "news-site.com": 20,    # Middle ground
}
```

---

## 多网站并发抓取

同时抓取多个网站时（例如，从 3 个不同来源扩充数据库），并发运行各网站的爬虫，并为每个网站设置**独立的并发控制**：

```python
import asyncio
import aiohttp

async def scrape_site(site_name: str, urls: list[str], concurrency: int) -> list[dict]:
    """Scrape one site with its own concurrency limit."""
    sem = asyncio.Semaphore(concurrency)
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_page(session, sem, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    log.info(f"{site_name}: scraped {len([r for r in results if not isinstance(r, Exception)])} / {len(urls)}")
    return [r for r in results if not isinstance(r, Exception)]

async def scrape_all_sites(site_configs: dict[str, dict]) -> dict[str, list[dict]]:
    """Scrape multiple sites in parallel, each with its own concurrency limit.

    site_configs = {
        "surfline": {"urls": [...], "concurrency": 20},
        "magicseaweed": {"urls": [...], "concurrency": 15},
        "wannasurf": {"urls": [...], "concurrency": 10},
    }
    """
    tasks = {
        name: scrape_site(name, cfg["urls"], cfg["concurrency"])
        for name, cfg in site_configs.items()
    }
    results = await asyncio.gather(*tasks.values())
    return dict(zip(tasks.keys(), results))
```

---

## 添加带退避机制的重试

并发爬虫需要比顺序爬虫更智能的重试逻辑。请使用指数退避：

```python
async def fetch_with_retry(
    session: aiohttp.ClientSession,
    sem: asyncio.Semaphore,
    url: str,
    max_retries: int = 3,
) -> dict | None:
    """Fetch a URL with concurrency control and exponential backoff."""
    async with sem:
        for attempt in range(max_retries):
            try:
                async with session.post(
                    "https://api.brightdata.com/request",
                    headers={"Authorization": f"Bearer {API_KEY}"},
                    json={"zone": ZONE, "url": url, "format": "raw"},
                    timeout=aiohttp.ClientTimeout(total=60),
                ) as response:
                    if response.status == 429:
                        wait = 2 ** attempt
                        log.warning(f"Rate limited on {url}, waiting {wait}s")
                        await asyncio.sleep(wait)
                        continue
                    response.raise_for_status()
                    return {"url": url, "html": await response.text()}
            except Exception as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    log.error(f"Failed after {max_retries} attempts: {url} — {e}")
                    return None
```

---

## 进度跟踪

对于大型任务，请显示进度，让用户知道任务正在运行：

```python
import asyncio

async def scrape_with_progress(urls: list[str], concurrency: int = 20) -> list[dict]:
    """Scrape with a live progress counter."""
    sem = asyncio.Semaphore(concurrency)
    completed = 0
    total = len(urls)
    results = []

    async def fetch_and_track(session, url):
        nonlocal completed
        result = await fetch_with_retry(session, sem, url)
        completed += 1
        if completed % 50 == 0 or completed == total:
            log.info(f"Progress: {completed}/{total} ({100*completed//total}%)")
        return result

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_and_track(session, url) for url in urls]
        results = await asyncio.gather(*tasks)

    return [r for r in results if r is not None]
```

---

## 完整模板：并发爬虫

```python
#!/usr/bin/env python3
"""
Concurrent scraper template.
Usage:
    export BRIGHTDATA_API_KEY="your-key"
    export BRIGHTDATA_UNLOCKER_ZONE="your-zone"
    python scraper.py
"""

import asyncio
import json
import logging
import os

import aiohttp
from bs4 import BeautifulSoup

API_KEY = os.environ["BRIGHTDATA_API_KEY"]
ZONE = os.environ["BRIGHTDATA_UNLOCKER_ZONE"]
CONCURRENCY = 20
OUTPUT_FILE = "results.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger(__name__)


async def fetch_page(session, sem, url, max_retries=3):
    async with sem:
        for attempt in range(max_retries):
            try:
                async with session.post(
                    "https://api.brightdata.com/request",
                    headers={"Authorization": f"Bearer {API_KEY}"},
                    json={"zone": ZONE, "url": url, "format": "raw"},
                    timeout=aiohttp.ClientTimeout(total=60),
                ) as resp:
                    if resp.status == 429:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    resp.raise_for_status()
                    return {"url": url, "html": await resp.text()}
            except Exception as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    log.error(f"Failed: {url} — {e}")
                    return None


def parse_items(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for card in soup.select("ITEM_SELECTOR"):
        try:
            items.append({
                "name": card.select_one("NAME_SELECTOR").get_text(strip=True),
                "url": card.select_one("a").get("href", ""),
            })
        except (AttributeError, TypeError):
            continue
    return items


async def main():
    # Generate your URLs
    urls = [f"https://example.com/page/{i}" for i in range(1, 501)]

    sem = asyncio.Semaphore(CONCURRENCY)
    completed = 0
    total = len(urls)
    all_items = []

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_page(session, sem, url) for url in urls]
        for coro in asyncio.as_completed(tasks):
            result = await coro
            completed += 1
            if result:
                items = parse_items(result["html"])
                all_items.extend(items)
            if completed % 50 == 0 or completed == total:
                log.info(f"Progress: {completed}/{total} — {len(all_items)} items extracted")

    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_items, f, indent=2, ensure_ascii=False)
    log.info(f"Done. Saved {len(all_items)} items to {OUTPUT_FILE}")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 快速决策指南

| 场景 | 方法 |
|-----------|----------|
| 少于 50 个 URL | 使用顺序方式即可：保持简单 |
| 50～500 个 URL | 使用由信号量控制的并发（并发数 = 10～20） |
| 500～10,000 个 URL | 使用由信号量控制的并发（并发数 = 20～50），并添加进度跟踪 |
| 10,000 个以上 URL | 使用并发 + 每 1,000 个 URL 分成一个批次，并保存中间结果 |
| 多个网站 | 为每个网站使用独立的并发爬虫，并行运行 |
| 预构建爬虫工具（网页爬虫工具 API） | 使用异步触发/轮询/获取：内置批处理功能 |
