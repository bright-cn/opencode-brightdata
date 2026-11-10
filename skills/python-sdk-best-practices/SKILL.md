---
name: python-sdk-best-practices
description: Guide for writing correct Bright Data Python SDK code. Always use this skill when writing, modifying, debugging, or reviewing Python code that uses the brightdata-sdk package, imports from brightdata, or interacts with Bright Data APIs. Use when the user asks to scrape websites, search Google/Bing, access datasets, or automate browsers via Bright Data in Python.
---

# Bright Data Python SDK：编程智能体最佳实践

你正在编写使用 `brightdata-sdk` Python 软件包的代码。请严格遵循以下规则。

## 安装

```bash
pip install brightdata-sdk
```

## 关键规则

1. **始终使用上下文管理器。** 客户端必须配合 `async with` 使用（同步模式则使用 `with`）。忘记这样做会导致 `RuntimeError: BrightDataClient not initialized`。
2. **默认使用异步。** 主要客户端是 `BrightDataClient`（异步）。只有在无法使用异步时才使用 `SyncBrightDataClient`。
3. **切勿在异步函数中使用 SyncBrightDataClient。** 这会引发 `RuntimeError`。请改用 `BrightDataClient`。
4. **令牌会自动从环境中加载。** 设置 `BRIGHTDATA_API_TOKEN` 环境变量或传入 `token=` 参数。不要硬编码令牌。
5. **所有抓取工具方法均可等待。** 异步客户端上的每次调用都必须使用 `await`。

## 身份验证

```python
# Option 1: Environment variable (preferred)
# export BRIGHTDATA_API_TOKEN="your_token"
async with BrightDataClient() as client:
    ...

# Option 2: Explicit token
async with BrightDataClient(token="your_token") as client:
    ...

# Option 3: .env file (requires python-dotenv)
# BRIGHTDATA_API_TOKEN=your_token
async with BrightDataClient() as client:
    ...
```

## 导入

```python
# Main clients
from brightdata import BrightDataClient          # Async (primary)
from brightdata import SyncBrightDataClient       # Sync wrapper

# Result models
from brightdata import ScrapeResult, SearchResult, CrawlResult

# Job model (for manual trigger/poll/fetch)
from brightdata import ScrapeJob

# Exceptions
from brightdata import (
    BrightDataError,       # Base exception
    ValidationError,       # Invalid input
    AuthenticationError,   # Bad/missing token
    APIError,              # API request failed (has .status_code, .response_text)
    ZoneError,             # Zone operation failed
    NetworkError,          # Network issue
    SSLError,              # SSL cert error
)

# Scraper Studio
from brightdata import ScraperStudioJob, JobStatus

# Dataset export utility
from brightdata.datasets import export
```

## 核心模式

### 模式 1：网页爬虫（网络解锁器）

通过 Bright Data 的代理网络抓取任意 URL，并绕过机器人检测。

```python
import asyncio
from brightdata import BrightDataClient

async def main():
    async with BrightDataClient() as client:
        # Single URL - returns ScrapeResult
        result = await client.scrape_url("https://example.com")
        print(result.success)  # bool
        print(result.data)     # HTML string or parsed data
        print(result.cost)     # float, USD

        # With options
        result = await client.scrape_url(
            url="https://example.com",
            country="us",              # Proxy country
            response_format="raw",     # "raw" (HTML) or "json"
            method="GET",              # HTTP method
            timeout=60,                # Request timeout seconds
        )

asyncio.run(main())
```

**异步模式**（非阻塞，适用于批处理/后台任务）：
```python
result = await client.scrape_url(
    url="https://example.com",
    mode="async",           # Triggers, polls, returns when ready
    poll_interval=5,        # Seconds between polls
    poll_timeout=180,       # Max wait (Web Unlocker async ~2 min)
)

# Batch: pass a list of URLs
results = await client.scrape_url(
    url=["https://example.com/1", "https://example.com/2"],
    mode="async",
    poll_timeout=180,
)
# Returns List[ScrapeResult]
```

### 模式 2：特定平台爬虫工具

从主流平台提取结构化数据。模式：`client.scrape.<platform>.<method>(url=...)`。

```python
async with BrightDataClient() as client:
    # Amazon
    product = await client.scrape.amazon.products(url="https://amazon.com/dp/B0CRMZHDG8")
    reviews = await client.scrape.amazon.reviews(url="https://amazon.com/dp/B0CRMZHDG8")
    sellers = await client.scrape.amazon.sellers(url="https://amazon.com/dp/B0CRMZHDG8")

    # LinkedIn
    profile = await client.scrape.linkedin.profiles(url="https://linkedin.com/in/username")
    company = await client.scrape.linkedin.companies(url="https://linkedin.com/company/name")
    posts   = await client.scrape.linkedin.posts(url="https://linkedin.com/posts/...")

    # Instagram
    ig_profile  = await client.scrape.instagram.profiles(url="https://instagram.com/username")
    ig_posts    = await client.scrape.instagram.posts(url="https://instagram.com/p/...")
    ig_comments = await client.scrape.instagram.comments(url="https://instagram.com/p/...")
    ig_reels    = await client.scrape.instagram.reels(url="https://instagram.com/reel/...")

    # Facebook
    fb_posts    = await client.scrape.facebook.posts_by_profile(url="https://facebook.com/user", num_of_posts=10)
    fb_group    = await client.scrape.facebook.posts_by_group(url="https://facebook.com/groups/...", num_of_posts=10)
    fb_comments = await client.scrape.facebook.comments(url="https://facebook.com/post/...", num_of_comments=20)
    fb_reels    = await client.scrape.facebook.reels(url="https://facebook.com/reel/...")

    # YouTube
    yt_profile  = await client.scrape.youtube.profiles(url="https://youtube.com/@channel")
    yt_video    = await client.scrape.youtube.videos(url="https://youtube.com/watch?v=...")
    yt_comments = await client.scrape.youtube.comments(url="https://youtube.com/watch?v=...")

    # ChatGPT
    response = await client.scrape.chatgpt.prompt(prompt="What is Python?")
    # Batch prompts
    responses = await client.scrape.chatgpt.prompts(prompts=["Q1", "Q2", "Q3"])

    # TikTok
    tt_profile = await client.scrape.tiktok.profiles(url="https://tiktok.com/@user")

    # Reddit
    reddit_post = await client.scrape.reddit.posts(url="https://reddit.com/r/...")
```

**所有抓取工具方法都会返回 `ScrapeResult`**，其中包含 `.success`、`.data`、`.cost`、`.status`。

### 模式 3：搜索发现（基于关键词）

根据关键词而非 URL 查找内容：

```python
async with BrightDataClient() as client:
    # Amazon product search
    results = await client.scrape.amazon.products_search(keyword="wireless headphones")

    # LinkedIn searches
    profiles = await client.scrape.linkedin.profiles_search(keyword="data engineer", location="San Francisco")
    jobs     = await client.scrape.linkedin.jobs_search(keyword="python developer", location="New York")
    companies = await client.scrape.linkedin.companies_search(keyword="AI startup")

    # Instagram search
    ig_profiles = await client.scrape.instagram.profiles_search(user_name="photography")
    ig_posts    = await client.scrape.instagram.posts_search(url="https://instagram.com/user", num_of_posts=20)
    ig_reels    = await client.scrape.instagram.reels_search(url="https://instagram.com/user", num_of_posts=10)

    # YouTube search
    videos = await client.scrape.youtube.videos_search(keyword="python tutorial", num_of_videos=10)
```

### 模式 4：SERP（搜索引擎结果）

```python
async with BrightDataClient() as client:
    # Google
    result = await client.search.google(
        query="python web scraping",
        location="United States",    # Optional
        language="en",               # Default: "en"
        device="desktop",            # "desktop" or "mobile"
        num_results=10,              # Number of results
    )
    for item in result.data:
        print(item["title"], item["link"])

    # Bing
    result = await client.search.bing(query="python tutorial", num_results=10)

    # Yandex
    result = await client.search.yandex(query="python", num_results=10)
```

**SERP 异步模式：**
```python
result = await client.search.google(
    query="python",
    mode="async",
    poll_interval=2,
    poll_timeout=30,
)
```

**SERP 返回 `SearchResult`**，其中包含 `.data`（字典列表）、`.query`、`.search_engine`。

### 模式 5：数据集 API

访问 175 个以上预采集的结构化数据集。

```python
async with BrightDataClient() as client:
    # Filter a dataset - returns snapshot_id (string)
    snapshot_id = await client.datasets.imdb_movies(
        filter={"name": "title", "operator": "includes", "value": "black"},
        records_limit=5,
    )

    # Download results (polls until ready)
    data = await client.datasets.imdb_movies.download(snapshot_id)
    print(f"Got {len(data)} records")

    # Quick sample (no filter needed)
    snapshot_id = await client.datasets.amazon_products.sample(records_limit=10)
    data = await client.datasets.amazon_products.download(snapshot_id)

    # Get field metadata
    metadata = await client.datasets.imdb_movies.get_metadata()
    for name, field in metadata.fields.items():
        print(f"{name}: {field.type}")
```

**导出到文件：**
```python
from brightdata.datasets import export

export(data, "results.json")    # JSON
export(data, "results.csv")     # CSV
export(data, "results.jsonl")   # JSONL
```

**可用数据集包括：** amazon_products、amazon_reviews、linkedin_profiles、linkedin_companies、linkedin_jobs、airbnb_properties、imdb_movies、google_maps_reviews、yelp_businesses、glassdoor_companies、zillow_properties、instagram_profiles、tiktok_profiles、facebook_pages_posts、reddit_posts、goodreads_books、nba_players_stats，以及另外 150 多个数据集。

### 模式 6：爬虫工作室（自定义爬虫工具）

运行在 Bright Data 爬虫工作室中构建的自定义爬虫工具。

```python
async with BrightDataClient() as client:
    # High-level: trigger + poll + return
    data = await client.scraper_studio.run(
        collector="c_abc123",                          # Collector ID from dashboard
        input={"url": "https://example.com/page"},     # Input for the scraper
        timeout=180,                                    # Max wait seconds
        poll_interval=10,                               # Poll frequency
    )

    # Manual control
    job = await client.scraper_studio.trigger(
        collector="c_abc123",
        input={"url": "https://example.com/page"},
    )
    print(job.response_id)
    status = await job.status()        # Returns JobStatus enum
    data = await job.wait_and_fetch(timeout=120, poll_interval=10)
```

### 模式 7：浏览器 API（CDP）

通过 Chrome DevTools Protocol 连接到 Bright Data 云浏览器。

```python
from brightdata import BrightDataClient

client = BrightDataClient(
    browser_username="brd-customer-hl_xxx-zone-scraping_browser1",
    browser_password="your_password",
)
# Or use env vars: BRIGHTDATA_BROWSERAPI_USERNAME, BRIGHTDATA_BROWSERAPI_PASSWORD

url = client.browser.get_connect_url(country="us")  # Optional country

# With Playwright
from playwright.async_api import async_playwright

async with async_playwright() as pw:
    browser = await pw.chromium.connect_over_cdp(url)
    page = await browser.new_page()
    await page.goto("https://example.com")
    content = await page.content()
    await browser.close()
```

### 模式 8：手动触发/轮询/获取

用于精细控制长时间运行的抓取任务：

```python
async with BrightDataClient() as client:
    # Step 1: Trigger (non-blocking)
    job = await client.scrape.amazon.products_trigger(url="https://amazon.com/dp/B123")
    print(f"Snapshot ID: {job.snapshot_id}")

    # Step 2: Check status
    status = await job.status()  # "ready", "running", etc.

    # Step 3: Wait for completion
    await job.wait(timeout=180, poll_interval=10, verbose=True)

    # Step 4: Fetch results
    data = await job.fetch()

    # Or combine wait + fetch into ScrapeResult:
    result = await job.to_result(timeout=180)
    print(result.data)
```

### 模式 9：并发批量操作

```python
import asyncio
from brightdata import BrightDataClient

async def main():
    async with BrightDataClient() as client:
        # Concurrent scraping
        urls = [
            "https://amazon.com/dp/B001",
            "https://amazon.com/dp/B002",
            "https://amazon.com/dp/B003",
        ]
        tasks = [client.scrape.amazon.products(url=u) for u in urls]
        results = await asyncio.gather(*tasks)

        for r in results:
            print(f"{r.url}: success={r.success}, cost=${r.cost:.4f}")

        # Concurrent SERP queries
        queries = ["python", "javascript", "rust"]
        search_tasks = [client.search.google(query=q) for q in queries]
        search_results = await asyncio.gather(*search_tasks)

asyncio.run(main())
```

### 模式 10：同步客户端

适用于脚本、笔记本或非异步代码库：

```python
from brightdata import SyncBrightDataClient

with SyncBrightDataClient() as client:
    # All methods are synchronous - no await needed
    result = client.scrape_url("https://example.com")
    print(result.data)

    result = client.scrape.amazon.products(url="https://amazon.com/dp/B123")
    result = client.search.google(query="python")

    # Datasets
    snapshot_id = client.datasets.imdb_movies(
        filter={"name": "title", "operator": "includes", "value": "black"},
        records_limit=5,
    )
    data = client.datasets.imdb_movies.download(snapshot_id)
```

**警告：** 切勿在 `async def` 函数内使用 `SyncBrightDataClient`。这会引发 RuntimeError。

## 结果对象参考

所有结果都继承自 `BaseResult`：

```python
result.success          # bool - operation succeeded
result.cost             # Optional[float] - cost in USD
result.error            # Optional[str] - error message if failed
result.elapsed_ms()     # Optional[float] - total time in ms
result.to_dict()        # Dict - serializable dictionary
result.to_json(indent=2)  # str - JSON string
result.save_to_file("out.json")  # Save to file
```

**ScrapeResult** 附加字段：
```python
result.url              # str - original URL
result.status           # "ready" | "error" | "timeout" | "in_progress"
result.data             # Any - scraped data (dict, list, or HTML string)
result.snapshot_id      # Optional[str] - Bright Data snapshot ID
result.platform         # Optional[str] - "amazon", "linkedin", etc.
result.row_count        # Optional[int] - number of data rows
```

**SearchResult** 附加字段：
```python
result.query            # Dict - original query params
result.data             # List[Dict] - search results
result.search_engine    # "google" | "bing" | "yandex"
result.total_found      # Optional[int] - total results found
```

## 错误处理

```python
from brightdata import (
    BrightDataClient,
    BrightDataError,
    ValidationError,
    AuthenticationError,
    APIError,
    NetworkError,
)

async with BrightDataClient() as client:
    try:
        result = await client.scrape_url("https://example.com")
    except AuthenticationError:
        print("Invalid API token")
    except APIError as e:
        print(f"API error {e.status_code}: {e.message}")
        print(f"Response: {e.response_text}")
    except NetworkError:
        print("Network connectivity issue")
    except ValidationError:
        print("Invalid input parameters")
    except BrightDataError as e:
        print(f"Bright Data error: {e.message}")
```

## 客户端配置

```python
client = BrightDataClient(
    token="...",                    # API token (or use env var)
    timeout=30,                     # Default request timeout (seconds)
    web_unlocker_zone="sdk_unlocker",  # Web Unlocker zone name
    serp_zone="sdk_serp",          # SERP zone name
    auto_create_zones=True,        # Auto-create zones if missing
    validate_token=False,          # Validate token on init
    rate_limit=10.0,               # Max requests per rate_period (None to disable)
    rate_period=1.0,               # Rate limit window (seconds)
)
```

**自动创建区域：** 默认情况下，SDK 会在首次使用时创建 `sdk_unlocker` 和 `sdk_serp` 区域。设置 `auto_create_zones=False` 可禁用此行为。

## 区域管理

```python
async with BrightDataClient() as client:
    # List all active zones
    zones = await client.list_zones()
    for zone in zones:
        print(f"{zone['name']}: {zone.get('type', 'unknown')}")

    # Delete a zone
    await client.delete_zone("test_zone")

    # Test connection
    is_valid = await client.test_connection()
```

## 应避免的常见错误

1. **忘记使用上下文管理器：**
   ```python
   # WRONG - will raise RuntimeError
   client = BrightDataClient()
   result = await client.scrape_url("https://example.com")

   # CORRECT
   async with BrightDataClient() as client:
       result = await client.scrape_url("https://example.com")
   ```

2. **在异步代码中使用同步客户端：**
   ```python
   # WRONG - will raise RuntimeError
   async def main():
       with SyncBrightDataClient() as client:
           result = client.scrape_url("...")

   # CORRECT
   async def main():
       async with BrightDataClient() as client:
           result = await client.scrape_url("...")
   ```

3. **忘记 await：**
   ```python
   # WRONG - returns coroutine, not result
   result = client.scrape_url("https://example.com")

   # CORRECT
   result = await client.scrape_url("https://example.com")
   ```

4. **未检查 result.success：**
   ```python
   result = await client.scrape_url("https://example.com")
   # Always check success before using data
   if result.success:
       process(result.data)
   else:
       print(f"Failed: {result.error}")
   ```

5. **硬编码 API 令牌：**
   ```python
   # WRONG
   client = BrightDataClient(token="abc123secret")

   # CORRECT - use environment variable
   # export BRIGHTDATA_API_TOKEN=abc123secret
   client = BrightDataClient()
   ```

## 环境变量

| 变量 | 用途 | 默认值 |
|----------|---------|---------|
| `BRIGHTDATA_API_TOKEN` | API 身份验证令牌 | 必填 |
| `WEB_UNLOCKER_ZONE` | 网络解锁器区域名称 | `sdk_unlocker` |
| `SERP_ZONE` | SERP 区域名称 | `sdk_serp` |
| `BRIGHTDATA_BROWSERAPI_USERNAME` | 浏览器 API 用户名 | 无 |
| `BRIGHTDATA_BROWSERAPI_PASSWORD` | 浏览器 API 密码 | 无 |

## 快速决策指南

| 任务 | 方法 |
|------|--------|
| 抓取任意 URL（HTML） | `client.scrape_url(url)` |
| 抓取 Amazon/LinkedIn 等平台（结构化数据） | `client.scrape.<platform>.<method>(url=...)` |
| 搜索 Google/Bing/Yandex | `client.search.google(query=...)` |
| 通过关键词查找产品/个人资料 | `client.scrape.<platform>.<type>_search(keyword=...)` |
| 访问预采集的数据集 | `client.datasets.<name>(filter=..., records_limit=...)` |
| 运行自定义爬虫工作室爬虫 | `client.scraper_studio.run(collector=..., input=...)` |
| 自动化浏览器（Playwright/Puppeteer） | `client.browser.get_connect_url()` |
| 手动控制长时间运行的抓取任务 | 先执行 `client.scrape.<platform>.<method>_trigger(url=...)`，然后执行 `job.wait()` + `job.fetch()` |

有关完整 API 功能和高级模式，请阅读 [references/api-reference.md](references/api-reference.md)。
