# 预构建爬虫工具：支持的域名

编写任何自定义抓取代码之前，请先查看此列表。如果目标域名在此列出，请使用网页爬虫工具 API 或 Python SDK 中针对该平台的爬虫工具，而不是构建自定义解决方案。

**此列表为精选子集。** Bright Data 为 100 多个域名提供预构建抓取工具。下表涵盖最常见的域名，但完整列表会动态更新并定期扩展。如果未在此处看到某个域名，**请务必查看实时数据集列表**，然后再考虑使用自定义爬虫。

---

## 发现所有可用爬虫工具（动态查询）

下表可供快速参考，但可能未包含 Bright Data 提供的所有抓取工具。为任何域名构建自定义爬虫之前，请使用以下两种方法检查是否存在预构建解决方案：

### 方法 1：查询数据集列表 API

此 API 会返回所有可用的预构建爬虫及其 `dataset_id` 和名称：

```bash
curl -H "Authorization: Bearer $BRIGHTDATA_API_KEY" \
     https://api.brightdata.com/datasets/list
```

```python
import requests
import os

response = requests.get(
    "https://api.brightdata.com/datasets/list",
    headers={"Authorization": f"Bearer {os.environ['BRIGHTDATA_API_KEY']}"}
)
datasets = response.json()

# Search for a specific domain
domain = "shopify"  # whatever site you're looking for
matches = [d for d in datasets if domain.lower() in d["name"].lower()]
for d in matches:
    print(f"  {d['id']}: {d['name']} ({d['size']:,} records)")
```

**响应格式：**
```json
[
  {"id": "gd_l1vijqt9jfj7olije", "name": "Crunchbase companies information", "size": 2300000},
  {"id": "gd_l1vikfch901nx3by4", "name": "Instagram - Profiles", "size": 620000000}
]
```

每个项目都包含：
- `id`：用于网页爬虫工具 API 的 `dataset_id`（`/datasets/v3/scrape` 或 `/datasets/v3/trigger`）
- `name`：描述爬虫工具的易读名称
- `size`：数据集中的记录数

找到匹配的数据集后，将其 `id` 用作网页爬虫工具 API 调用中的 `dataset_id` 参数。

### 方法 2：浏览完整文档

获取完整的 Bright Data 文档索引：

```
https://docs.brightdata.com/llms.txt
```

此文件列出了所有可用的文档页面。可使用它查找特定爬虫的文档、API 参考资料，以及任何受支持域名的指南。它特别适用于查找特定抓取工具的输入/输出架构和支持的参数。

### 何时使用动态查询

- 目标域名不在下方快速查询表中时，**始终**使用
- 不确定某个已知域名是否有针对特定数据类型的爬虫时（例如，“Bright Data 是否有 Amazon 卖家评论爬虫？”）
- 用户询问小众平台或最近新增的平台时
- 为房地产、旅游、外卖、招聘网站或分类信息等类别的网站构建爬虫时：Bright Data 经常为这些垂直领域添加新的抓取工具

---

## 快速查询

| 域名 | 是否有预构建爬虫？ | 方法 |
|--------|----------------------|----------|
| Amazon | 是 | SDK：`client.scrape.amazon.*` 或 Shell：`datasets.sh amazon_*` |
| LinkedIn | 是 | SDK：`client.scrape.linkedin.*` 或 Shell：`datasets.sh linkedin_*` |
| Instagram | 是 | SDK：`client.scrape.instagram.*` 或 Shell：`datasets.sh instagram_*` |
| Facebook | 是 | SDK：`client.scrape.facebook.*` 或 Shell：`datasets.sh facebook_*` |
| TikTok | 是 | SDK：`client.scrape.tiktok.*` 或 Shell：`datasets.sh tiktok_*` |
| YouTube | 是 | SDK：`client.scrape.youtube.*` 或 Shell：`datasets.sh youtube_*` |
| Twitter/X | 是 | Shell：`datasets.sh x_posts` |
| Reddit | 是 | SDK：`client.scrape.reddit.*` 或 Shell：`datasets.sh reddit_posts` |
| Walmart | 是 | Shell：`datasets.sh walmart_*` |
| eBay | 是 | Shell：`datasets.sh ebay_product` |
| Best Buy | 是 | Shell：`datasets.sh bestbuy_products` |
| Home Depot | 是 | Shell：`datasets.sh homedepot_products` |
| Etsy | 是 | Shell：`datasets.sh etsy_products` |
| Zara | 是 | Shell：`datasets.sh zara_products` |
| Google Maps | 是 | Shell：`datasets.sh google_maps_reviews` |
| Google Shopping | 是 | Shell：`datasets.sh google_shopping` |
| Google Play Store | 是 | Shell：`datasets.sh google_play_store` |
| Apple App Store | 是 | Shell：`datasets.sh apple_app_store` |
| Crunchbase | 是 | Shell：`datasets.sh crunchbase_company` |
| ZoomInfo | 是 | Shell：`datasets.sh zoominfo_company_profile` |
| Zillow | 是 | Shell：`datasets.sh zillow_properties_listing` |
| Booking.com | 是 | Shell：`datasets.sh booking_hotel_listings` |
| Yahoo Finance | 是 | Shell：`datasets.sh yahoo_finance_business` |
| Reuters | 是 | Shell：`datasets.sh reuter_news` |
| GitHub | 是 | Shell：`datasets.sh github_repository_file` |
| 任何其他网站 | 否 | 使用网络解锁器或浏览器 API（自定义爬虫） |

---

## 电商爬虫工具

### Amazon

| 数据类型 | Shell 命令 | Python SDK | 数据集 ID |
|-----------|--------------|------------|------------|
| 商品详情 | `datasets.sh amazon_product <url>` | `client.scrape.amazon.products(url=...)` | `gd_l7q7dkf244hwjntr0` |
| 商品评论 | `datasets.sh amazon_product_reviews <url>` | `client.scrape.amazon.reviews(url=...)` | — |
| 卖家信息 | — | `client.scrape.amazon.sellers(url=...)` | — |
| 商品搜索 | `datasets.sh amazon_product_search <keyword> <domain>` | `client.scrape.amazon.products_search(keyword=...)` | — |

**Amazon 专属技巧：**
- 使用网络解锁器时添加 `x-unblock-zipcode` 标头，以获取特定地区的价格
- 商品搜索接受关键词 + 域名 URL（例如 `https://www.amazon.com`）
- 评论爬虫会返回指定商品 URL 的所有评论

### Walmart

| 数据类型 | Shell 命令 | 数据集 ID |
|-----------|--------------|------------|
| 商品详情 | `datasets.sh walmart_product <url>` | — |
| 卖家信息 | `datasets.sh walmart_seller <url>` | — |

### eBay

| 数据类型 | Shell 命令 | 数据集 ID |
|-----------|--------------|------------|
| 商品详情 | `datasets.sh ebay_product <url>` | — |

### 其他电商平台

| 平台 | Shell 命令 |
|----------|--------------|
| Best Buy | `datasets.sh bestbuy_products <url>` |
| Home Depot | `datasets.sh homedepot_products <url>` |
| Etsy | `datasets.sh etsy_products <url>` |
| Zara | `datasets.sh zara_products <url>` |
| Google Shopping | `datasets.sh google_shopping <url>` |

---

## 社交媒体爬虫工具

### Instagram

| 数据类型 | Shell 命令 | Python SDK |
|-----------|--------------|------------|
| 个人资料 | `datasets.sh instagram_profiles <url>` | `client.scrape.instagram.profiles(url=...)` |
| 帖子 | `datasets.sh instagram_posts <url>` | `client.scrape.instagram.posts(url=...)` |
| Reels | `datasets.sh instagram_reels <url>` | `client.scrape.instagram.reels(url=...)` |
| 评论 | `datasets.sh instagram_comments <url>` | `client.scrape.instagram.comments(url=...)` |
| 个人资料搜索 | — | `client.scrape.instagram.profiles_search(user_name=...)` |
| 用户发布的帖子 | — | `client.scrape.instagram.posts_search(url=..., num_of_posts=20)` |

### Facebook

| 数据类型 | Shell 命令 | Python SDK |
|-----------|--------------|------------|
| 帖子 | `datasets.sh facebook_posts <url>` | `client.scrape.facebook.posts_by_profile(url=..., num_of_posts=10)` |
| 群组帖子 | — | `client.scrape.facebook.posts_by_group(url=..., num_of_posts=10)` |
| Marketplace | `datasets.sh facebook_marketplace_listings <url>` | — |
| 评论 | `datasets.sh facebook_company_reviews <url> [num]` | — |
| 活动 | `datasets.sh facebook_events <url>` | — |
| Reels | — | `client.scrape.facebook.reels(url=...)` |
| 评论 | — | `client.scrape.facebook.comments(url=..., num_of_comments=20)` |

### TikTok

| 数据类型 | Shell 命令 | Python SDK |
|-----------|--------------|------------|
| 个人资料 | `datasets.sh tiktok_profiles <url>` | `client.scrape.tiktok.profiles(url=...)` |
| 帖子/视频 | `datasets.sh tiktok_posts <url>` | — |
| 店铺商品 | `datasets.sh tiktok_shop <url>` | — |
| 评论 | `datasets.sh tiktok_comments <url>` | — |

### YouTube

| 数据类型 | Shell 命令 | Python SDK |
|-----------|--------------|------------|
| 频道 | `datasets.sh youtube_profiles <url>` | `client.scrape.youtube.profiles(url=...)` |
| 视频 | `datasets.sh youtube_videos <url>` | `client.scrape.youtube.videos(url=...)` |
| 评论 | `datasets.sh youtube_comments <url> [num]` | `client.scrape.youtube.comments(url=...)` |
| 视频搜索 | — | `client.scrape.youtube.videos_search(keyword=..., num_of_videos=10)` |

### Twitter/X

| 数据类型 | Shell 命令 |
|-----------|--------------|
| 帖子/推文 | `datasets.sh x_posts <url>` |

### Reddit

| 数据类型 | Shell 命令 | Python SDK |
|-----------|--------------|------------|
| 帖子 | `datasets.sh reddit_posts <url>` | `client.scrape.reddit.posts(url=...)` |

---

## 职业/商业爬虫工具

### LinkedIn

| 数据类型 | Shell 命令 | Python SDK |
|-----------|--------------|------------|
| 个人资料 | `datasets.sh linkedin_person_profile <url>` | `client.scrape.linkedin.profiles(url=...)` |
| 公司资料 | `datasets.sh linkedin_company_profile <url>` | `client.scrape.linkedin.companies(url=...)` |
| 职位列表 | `datasets.sh linkedin_job_listings <url>` | — |
| 帖子 | `datasets.sh linkedin_posts <url>` | `client.scrape.linkedin.posts(url=...)` |
| 人员搜索 | `datasets.sh linkedin_people_search <url> <first> <last>` | `client.scrape.linkedin.profiles_search(keyword=..., location=...)` |
| 职位搜索 | — | `client.scrape.linkedin.jobs_search(keyword=..., location=...)` |
| 公司搜索 | — | `client.scrape.linkedin.companies_search(keyword=...)` |

### 其他商业数据

| 平台 | Shell 命令 |
|----------|--------------|
| Crunchbase | `datasets.sh crunchbase_company <url>` |
| ZoomInfo | `datasets.sh zoominfo_company_profile <url>` |

---

## 其他爬虫工具

| 平台 | 数据类型 | Shell 命令 |
|----------|-----------|--------------|
| Zillow | 房源列表 | `datasets.sh zillow_properties_listing <url>` |
| Booking.com | 酒店列表 | `datasets.sh booking_hotel_listings <url>` |
| Yahoo Finance | 公司/股票数据 | `datasets.sh yahoo_finance_business <url>` |
| Reuters | 新闻文章 | `datasets.sh reuter_news <url>` |
| GitHub | 代码仓库文件 | `datasets.sh github_repository_file <url>` |
| Google Maps | 商家评论 | `datasets.sh google_maps_reviews <url> [days]` |
| Google Play | 应用详情 | `datasets.sh google_play_store <url>` |
| Apple App Store | 应用详情 | `datasets.sh apple_app_store <url>` |

---

## 使用预构建爬虫执行批量操作

### Python SDK：并发批处理

```python
import asyncio
from brightdata import BrightDataClient

async def bulk_scrape(urls: list[str]):
    async with BrightDataClient() as client:
        tasks = [client.scrape.amazon.products(url=u) for u in urls]
        results = await asyncio.gather(*tasks)
        return [r.data for r in results if r.success]
```

### Shell：通过网页爬虫工具 API 处理多个 URL

```bash
# Direct API call with multiple inputs
bash scripts/fetch.sh gd_l7q7dkf244hwjntr0 '[{"url":"https://amazon.com/dp/B001"},{"url":"https://amazon.com/dp/B002"}]'
```

### REST API：针对大型批次的异步触发

对于 20 个以上的 URL，请使用异步触发端点：

```python
import requests

# Trigger
response = requests.post(
    "https://api.brightdata.com/datasets/v3/trigger",
    params={"dataset_id": "gd_l7q7dkf244hwjntr0", "format": "json"},
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={"input": [{"url": u} for u in urls]}
)
snapshot_id = response.json()["snapshot_id"]

# Poll + Download (see Web Scraper API reference for full pattern)
```
