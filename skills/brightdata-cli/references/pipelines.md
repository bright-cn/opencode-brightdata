# 管道类型参考

可通过 `bdata pipelines <type> [params...]` 使用的所有管道类型。

运行 `bdata pipelines list` 可在终端中查看所有类型。

## 参数模式

大多数类型只需要一个 URL：
```bash
bdata pipelines <type> "<url>"
```

某些类型具有额外参数，具体如下。

---

## 电商

| 类型 | 平台 | 参数 |
|------|----------|------------|
| `amazon_product` | Amazon 商品页面 | `<url>` |
| `amazon_product_reviews` | Amazon 评论 | `<url>` |
| `amazon_product_search` | Amazon 搜索结果 | `<keyword> <domain_url>` |
| `walmart_product` | Walmart 商品页面 | `<url>` |
| `walmart_seller` | Walmart 卖家资料 | `<url>` |
| `ebay_product` | eBay 商品信息 | `<url>` |
| `bestbuy_products` | Best Buy | `<url>` |
| `etsy_products` | Etsy | `<url>` |
| `homedepot_products` | Home Depot | `<url>` |
| `zara_products` | Zara | `<url>` |
| `google_shopping` | Google Shopping | `<url>` |

### Amazon 搜索示例
```bash
# Requires both keyword and domain URL
bdata pipelines amazon_product_search "wireless headphones" "https://amazon.com"
```

---

## 职业网络

| 类型 | 平台 | 参数 |
|------|----------|------------|
| `linkedin_person_profile` | LinkedIn 个人 | `<url>` |
| `linkedin_company_profile` | LinkedIn 公司 | `<url>` |
| `linkedin_job_listings` | LinkedIn 职位 | `<url>` |
| `linkedin_posts` | LinkedIn 帖子 | `<url>` |
| `linkedin_people_search` | LinkedIn 人员搜索 | `<url> <first_name> <last_name>` |
| `crunchbase_company` | Crunchbase | `<url>` |
| `zoominfo_company_profile` | ZoomInfo | `<url>` |

### LinkedIn 人员搜索示例
```bash
# Requires URL, first name, and last name
bdata pipelines linkedin_people_search "https://linkedin.com/search/results/people" "John" "Doe"
```

---

## 社交媒体

| 类型 | 平台 | 参数 |
|------|----------|------------|
| `instagram_profiles` | Instagram 个人资料 | `<url>` |
| `instagram_posts` | Instagram 帖子 | `<url>` |
| `instagram_reels` | Instagram Reels | `<url>` |
| `instagram_comments` | Instagram 评论 | `<url>` |
| `facebook_posts` | Facebook 帖子 | `<url>` |
| `facebook_marketplace_listings` | Facebook Marketplace | `<url>` |
| `facebook_company_reviews` | Facebook 评论 | `<url> [num_reviews]` |
| `facebook_events` | Facebook 活动 | `<url>` |
| `tiktok_profiles` | TikTok 个人资料 | `<url>` |
| `tiktok_posts` | TikTok 帖子 | `<url>` |
| `tiktok_shop` | TikTok Shop | `<url>` |
| `tiktok_comments` | TikTok 评论 | `<url>` |
| `x_posts` | X（Twitter）帖子 | `<url>` |
| `youtube_profiles` | YouTube 频道 | `<url>` |
| `youtube_videos` | YouTube 视频 | `<url>` |
| `youtube_comments` | YouTube 评论 | `<url> [num_comments]` |
| `reddit_posts` | Reddit 帖子 | `<url>` |

### YouTube 评论示例
```bash
# Optional second param: number of comments (default: 10)
bdata pipelines youtube_comments "https://youtube.com/watch?v=dQw4w9WgXcQ" 50
```

### Facebook 评论示例
```bash
# Optional second param: number of reviews (default: 10)
bdata pipelines facebook_company_reviews "https://facebook.com/company" 25
```

---

## 地图、评论和其他

| 类型 | 平台 | 参数 |
|------|----------|------------|
| `google_maps_reviews` | Google 地图评论 | `<url> [days_limit]` |
| `google_play_store` | Google Play | `<url>` |
| `apple_app_store` | Apple App Store | `<url>` |
| `reuter_news` | Reuters 新闻 | `<url>` |
| `github_repository_file` | GitHub 代码库文件 | `<url>` |
| `yahoo_finance_business` | Yahoo Finance | `<url>` |
| `zillow_properties_listing` | Zillow | `<url>` |
| `booking_hotel_listings` | Booking.com | `<url>` |

### Google 地图评论示例
```bash
# Optional second param: days_limit (default: 3)
bdata pipelines google_maps_reviews "https://maps.google.com/maps/place/..." 7
```

---

## 输出选项

所有管道命令均支持：

```bash
# JSON (default)
bdata pipelines amazon_product "<url>"

# CSV
bdata pipelines amazon_product "<url>" --format csv

# NDJSON / JSONL
bdata pipelines amazon_product "<url>" --format ndjson

# Save to file
bdata pipelines amazon_product "<url>" -o product.json

# Custom timeout (default 600 seconds)
bdata pipelines amazon_product "<url>" --timeout 1200
```

## 管道的工作原理

1. CLI 使用数据集 ID 和输入向 `/datasets/v3/trigger` 发送触发请求
2. 接收 `snapshot_id`
3. 轮询 `/datasets/v3/snapshot/{snapshot_id}`，直到状态不再是 `starting`/`building`/`running`
4. 以请求的格式返回采集的数据

默认超时时间为 600 秒（10 分钟）。对于大型数据集，请使用 `--timeout` 延长超时时间，或设置 `BRIGHTDATA_POLLING_TIMEOUT` 环境变量。
