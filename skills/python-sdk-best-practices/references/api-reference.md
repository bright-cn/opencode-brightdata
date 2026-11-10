# Bright Data Python SDK：完整 API 参考

## 客户端构造函数参数

### BrightDataClient（异步）

```python
class BrightDataClient:
    def __init__(
        token: Optional[str] = None,           # API token (auto-loads from BRIGHTDATA_API_TOKEN)
        timeout: int = 30,                      # Default request timeout in seconds
        web_unlocker_zone: Optional[str] = None, # Zone for Web Unlocker (default: "sdk_unlocker")
        serp_zone: Optional[str] = None,        # Zone for SERP (default: "sdk_serp")
        browser_username: Optional[str] = None,  # Browser API username
        browser_password: Optional[str] = None,  # Browser API password
        browser_host: Optional[str] = None,      # Browser API host (default: "brd.superproxy.io")
        browser_port: Optional[int] = None,      # Browser API port (default: 9222)
        auto_create_zones: bool = True,          # Auto-create zones on first use
        validate_token: bool = False,            # Validate token during __aenter__
        rate_limit: Optional[float] = None,      # Max requests per period (None = disabled)
        rate_period: float = 1.0,                # Rate limit window in seconds
    )
```

### SyncBrightDataClient

构造函数参数与 `BrightDataClient` 相同。所有服务方法都是同步的（无需 `await`）。

## 服务层级

```
client
├── .scrape_url(url, ...)                    # Direct Web Unlocker scraping
├── .scrape                                   # ScrapeService namespace
│   ├── .amazon
│   │   ├── .products(url)                   # Product details
│   │   ├── .reviews(url)                    # Product reviews
│   │   ├── .sellers(url)                    # Seller info
│   │   ├── .products_search(keyword)        # Search by keyword
│   │   ├── .products_trigger(url)           # Manual trigger -> ScrapeJob
│   │   ├── .products_status(snapshot_id)    # Check status
│   │   └── .products_fetch(snapshot_id)     # Fetch results
│   ├── .linkedin
│   │   ├── .profiles(url)                   # Profile data
│   │   ├── .companies(url)                  # Company data
│   │   ├── .posts(url)                      # Post data
│   │   ├── .profiles_search(keyword, location)
│   │   ├── .jobs_search(keyword, location)
│   │   └── .companies_search(keyword)
│   ├── .instagram
│   │   ├── .profiles(url)                   # Profile data
│   │   ├── .posts(url)                      # Post data
│   │   ├── .comments(url)                   # Post comments
│   │   ├── .reels(url)                      # Reel data
│   │   ├── .profiles_search(user_name)
│   │   ├── .posts_search(url, num_of_posts, start_date, end_date)
│   │   └── .reels_search(url, num_of_posts, start_date, end_date)
│   ├── .facebook
│   │   ├── .posts_by_profile(url, num_of_posts)
│   │   ├── .posts_by_group(url, num_of_posts)
│   │   ├── .comments(url, num_of_comments)
│   │   └── .reels(url)
│   ├── .chatgpt
│   │   ├── .prompt(prompt)                  # Single prompt
│   │   └── .prompts(prompts)               # Batch prompts (List[str])
│   ├── .youtube
│   │   ├── .profiles(url)
│   │   ├── .videos(url)
│   │   ├── .comments(url)
│   │   └── .videos_search(keyword, num_of_videos)
│   ├── .tiktok
│   │   └── .profiles(url)
│   ├── .reddit
│   │   └── .posts(url)
│   ├── .perplexity
│   └── .digikey
├── .search                                   # SearchService namespace
│   ├── .google(query, location, language, device, num_results, mode)
│   ├── .bing(query, location, language, num_results)
│   ├── .yandex(query, location, language, num_results)
│   ├── .amazon                              # Platform-specific SERP
│   ├── .linkedin
│   ├── .instagram
│   ├── .tiktok
│   └── .youtube
├── .datasets                                 # DatasetsClient
│   ├── .<dataset_name>(filter, records_limit)  # Filter -> snapshot_id
│   ├── .<dataset_name>.download(snapshot_id)    # Download results
│   ├── .<dataset_name>.sample(records_limit)    # Quick sample
│   └── .<dataset_name>.get_metadata()           # Field metadata
├── .scraper_studio                           # ScraperStudioService
│   ├── .run(collector, input, timeout, poll_interval)  # Full lifecycle
│   └── .trigger(collector, input)                       # Manual trigger
├── .browser                                  # BrowserService
│   └── .get_connect_url(country)             # CDP WebSocket URL
├── .test_connection()                        # Test token validity -> bool
├── .get_account_info(refresh)                # Account info -> dict
├── .list_zones()                             # List zones -> List[dict]
└── .delete_zone(zone_name)                   # Delete zone
```

## 有效载荷模型

供爬虫工具内部使用。需要了解输入验证时会很有用。

```python
from brightdata import (
    # Amazon
    AmazonProductPayload,       # url, reviews_count, images_count
    AmazonReviewPayload,        # url
    AmazonSellerPayload,        # url

    # LinkedIn
    LinkedInProfilePayload,     # url
    LinkedInJobPayload,         # url
    LinkedInCompanyPayload,     # url
    LinkedInPostPayload,        # url
    LinkedInProfileSearchPayload,  # keyword, location
    LinkedInJobSearchPayload,      # keyword, location
    LinkedInPostSearchPayload,     # keyword

    # Instagram
    InstagramProfilePayload,    # url
    InstagramPostPayload,       # url
    InstagramCommentPayload,    # url
    InstagramReelPayload,       # url
    InstagramPostsDiscoverPayload,   # url, num_of_posts, start_date, end_date
    InstagramReelsDiscoverPayload,   # url, num_of_posts, start_date, end_date

    # Facebook
    FacebookPostsProfilePayload,   # url, num_of_posts
    FacebookPostsGroupPayload,     # url, num_of_posts
    FacebookPostPayload,           # url
    FacebookCommentsPayload,       # url, num_of_comments
    FacebookReelsPayload,          # url

    # ChatGPT
    ChatGPTPromptPayload,          # prompt
)
```

## ScrapeJob 生命周期

```python
# Returned by *_trigger() methods
job: ScrapeJob

job.snapshot_id         # str - unique ID
job.platform_name       # Optional[str]
job.cost_per_record     # float
job.triggered_at        # datetime

# Async methods
await job.status(refresh=True)     # str - current status
await job.wait(                    # Wait for completion
    timeout=300,                   # Max wait seconds
    poll_interval=10,              # Poll frequency
    verbose=False,                 # Print progress
)
await job.fetch(format="json")     # Any - fetch results
await job.to_result(timeout=300)   # ScrapeResult - wait + fetch combined

# Sync methods (for SyncBrightDataClient)
job.status_sync()
job.wait_sync(timeout=300)
job.fetch_sync()
job.to_result_sync()
```

## ScraperStudioJob

```python
job: ScraperStudioJob

job.response_id                  # str
await job.status()               # JobStatus enum
await job.wait_and_fetch(        # Wait + return data
    timeout=180,
    poll_interval=10,
)
await job.fetch()                # Fetch without waiting

# JobStatus values
from brightdata import JobStatus
JobStatus.PENDING
JobStatus.IN_PROGRESS
JobStatus.COMPLETED
JobStatus.FAILED
```

## 异常层级

```
BrightDataError (base)
├── ValidationError           # Invalid parameters, missing required fields
├── AuthenticationError       # Invalid/expired token, missing credentials
├── APIError                  # HTTP errors from Bright Data API
│   ├── .status_code          # int - HTTP status code
│   ├── .response_text        # str - raw response body
│   └── .message              # str - error description
├── DataNotReadyError         # HTTP 202 - data still processing
├── ZoneError                 # Zone create/delete/list failures
├── NetworkError              # Connection refused, DNS failures, timeouts
└── SSLError                  # SSL certificate verification errors
```

## SDK 常量

```python
from brightdata.constants import *

# Default polling
DEFAULT_POLL_INTERVAL = 10       # seconds
DEFAULT_POLL_TIMEOUT = 600       # seconds

# Timeouts by platform
DEFAULT_TIMEOUT_SHORT = 180      # LinkedIn, ChatGPT
DEFAULT_TIMEOUT_MEDIUM = 240     # Amazon, Facebook, Instagram
DEFAULT_TIMEOUT_LONG = 120       # ChatGPT

# Cost per record (USD)
DEFAULT_COST_PER_RECORD = 0.001
COST_PER_RECORD_LINKEDIN = 0.002
COST_PER_RECORD_FACEBOOK = 0.002
COST_PER_RECORD_INSTAGRAM = 0.002
COST_PER_RECORD_CHATGPT = 0.005
COST_PER_RECORD_PERPLEXITY = 0.005
COST_PER_RECORD_TIKTOK = 0.002
COST_PER_RECORD_YOUTUBE = 0.002

# Scraper Studio
SCRAPER_STUDIO_DEFAULT_TIMEOUT = 180
SCRAPER_STUDIO_POLL_INTERVAL = 10
```

## 数据集筛选语法

```python
# Single filter
filter = {
    "name": "field_name",        # Field to filter on
    "operator": "includes",      # Comparison operator
    "value": "search_term",      # Value to match
}

# Operators: "=", "!=", "includes", ">=", "<=", ">", "<"
```

## Pandas 集成

```python
import pandas as pd
from brightdata import BrightDataClient

async with BrightDataClient() as client:
    result = await client.scrape.amazon.products(url="https://amazon.com/dp/B123")
    if result.success and isinstance(result.data, list):
        df = pd.DataFrame(result.data)
    elif result.success and isinstance(result.data, dict):
        df = pd.DataFrame([result.data])

    # From datasets
    snapshot_id = await client.datasets.amazon_products.sample(records_limit=100)
    data = await client.datasets.amazon_products.download(snapshot_id)
    df = pd.DataFrame(data)
```

## 速率限制

SDK 内置速率限制（启用后默认为每秒 10 个请求）：

```python
# Enable rate limiting
client = BrightDataClient(rate_limit=10, rate_period=1.0)

# Disable rate limiting
client = BrightDataClient(rate_limit=None)
```

启用速率限制后，超出限制的请求会自动排队并延迟执行。

## 依赖项

**必需：**
- `aiohttp>=3.8.0` - 异步 HTTP 客户端
- `requests>=2.25.0` - 同步 HTTP 回退方案
- `python-dotenv>=0.19.0` - .env 文件支持

**可选：**
- `playwright` - 用于浏览器 API
- `pandas` - 用于 DataFrame 集成
- `pydantic` - 用于数据验证
