---
name: data-feeds
description: Extract structured data from 40+ websites including Amazon, LinkedIn, Instagram, TikTok, Facebook, YouTube, and more. Uses Bright Data's Web Data APIs with automatic polling. Returns clean JSON with product details, profiles, reviews, posts, and comments.
---

# Bright Data - 结构化数据源

从主要网站提取结构化数据并自动解析。无需抓取逻辑：只需提供 URL，即可获得简洁的 JSON 数据。

## 设置

### 环境变量（必需）
```bash
export BRIGHTDATA_API_KEY="your-api-key"
```

### 可选
```bash
export BRIGHTDATA_POLLING_TIMEOUT=600  # Max seconds to wait (default: 600)
```

从 [Bright Data 控制面板](https://www.bright.cn/cp)获取 API 密钥。

## 用法

```bash
bash scripts/datasets.sh <dataset_type> <url> [additional_params...]
```

## 可用数据集

### 电商

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| Amazon 商品 | `datasets.sh amazon_product <url>` | 商品详情、定价、评分 |
| Amazon 评论 | `datasets.sh amazon_product_reviews <url>` | 商品的客户评论 |
| Amazon 搜索 | `datasets.sh amazon_product_search <keyword> <domain_url>` | 搜索结果 |
| Walmart 商品 | `datasets.sh walmart_product <url>` | 来自 Walmart 的商品详情 |
| Walmart 卖家 | `datasets.sh walmart_seller <url>` | 卖家信息 |
| eBay 商品 | `datasets.sh ebay_product <url>` | eBay 商品详情 |
| Home Depot | `datasets.sh homedepot_products <url>` | Home Depot 商品数据 |
| Zara | `datasets.sh zara_products <url>` | Zara 商品详情 |
| Etsy | `datasets.sh etsy_products <url>` | Etsy 商品数据 |
| Best Buy | `datasets.sh bestbuy_products <url>` | Best Buy 商品信息 |

### 职业网络

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| LinkedIn 个人 | `datasets.sh linkedin_person_profile <url>` | 个人资料数据（经历、技能） |
| LinkedIn 公司 | `datasets.sh linkedin_company_profile <url>` | 公司页面数据 |
| LinkedIn 职位 | `datasets.sh linkedin_job_listings <url>` | 招聘信息详情 |
| LinkedIn 帖子 | `datasets.sh linkedin_posts <url>` | 帖子内容和互动数据 |
| LinkedIn 搜索 | `datasets.sh linkedin_people_search <url> <first> <last>` | 查找人员 |
| Crunchbase | `datasets.sh crunchbase_company <url>` | 公司融资、员工 |
| ZoomInfo | `datasets.sh zoominfo_company_profile <url>` | 公司资料数据 |

### Instagram

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| 个人资料 | `datasets.sh instagram_profiles <url>` | 简介、粉丝数、关注数 |
| 帖子 | `datasets.sh instagram_posts <url>` | 帖子详情、点赞数、说明文字 |
| Reels | `datasets.sh instagram_reels <url>` | Reels 数据和指标 |
| 评论 | `datasets.sh instagram_comments <url>` | 帖子评论 |

### Facebook

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| 帖子 | `datasets.sh facebook_posts <url>` | 帖子内容和回应 |
| Marketplace | `datasets.sh facebook_marketplace_listings <url>` | 商品详情 |
| 评论 | `datasets.sh facebook_company_reviews <url> [num]` | 公司评论 |
| 活动 | `datasets.sh facebook_events <url>` | 活动详情 |

### TikTok

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| 个人资料 | `datasets.sh tiktok_profiles <url>` | 创作者资料数据 |
| 帖子 | `datasets.sh tiktok_posts <url>` | 视频详情和指标 |
| Shop | `datasets.sh tiktok_shop <url>` | TikTok Shop 商品数据 |
| 评论 | `datasets.sh tiktok_comments <url>` | 视频评论 |

### YouTube

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| 个人资料 | `datasets.sh youtube_profiles <url>` | 频道数据 |
| 视频 | `datasets.sh youtube_videos <url>` | 视频详情和统计信息 |
| 评论 | `datasets.sh youtube_comments <url> [num]` | 视频评论（默认：10） |

### 其他社交媒体

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| X（Twitter） | `datasets.sh x_posts <url>` | 推文数据 |
| Reddit | `datasets.sh reddit_posts <url>` | 帖子和评论数据 |

### Google 服务

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| 地图评论 | `datasets.sh google_maps_reviews <url> [days]` | 商家评论（默认：3 天） |
| Shopping | `datasets.sh google_shopping <url>` | 商品比较数据 |
| Play Store | `datasets.sh google_play_store <url>` | 应用详情和评论 |

### 其他

| 数据集 | 命令 | 说明 |
|---------|---------|-------------|
| Apple App Store | `datasets.sh apple_app_store <url>` | iOS 应用数据 |
| Reuters 新闻 | `datasets.sh reuter_news <url>` | 新闻文章内容 |
| GitHub | `datasets.sh github_repository_file <url>` | 代码库文件数据 |
| Yahoo Finance | `datasets.sh yahoo_finance_business <url>` | 股票和公司数据 |
| Zillow | `datasets.sh zillow_properties_listing <url>` | 房产信息详情 |
| Booking.com | `datasets.sh booking_hotel_listings <url>` | 酒店房源数据 |

## 示例

### 获取 LinkedIn 个人资料
```bash
bash scripts/datasets.sh linkedin_person_profile "https://www.linkedin.com/in/satyanadella/"
```

### 获取 Amazon 商品
```bash
bash scripts/datasets.sh amazon_product "https://www.amazon.com/dp/B09V3KXJPB"
```

### 获取 Instagram 个人资料
```bash
bash scripts/datasets.sh instagram_profiles "https://www.instagram.com/natgeo/"
```

### 获取 YouTube 评论
```bash
bash scripts/datasets.sh youtube_comments "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 20
```

### 搜索 Amazon
```bash
bash scripts/datasets.sh amazon_product_search "wireless headphones" "https://www.amazon.com"
```

## 输出格式

返回包含网站特定字段的结构化 JSON。LinkedIn 个人资料示例：

```json
{
  "name": "Satya Nadella",
  "headline": "Chairman and CEO at Microsoft",
  "location": "Greater Seattle Area",
  "connections": "500+",
  "experience": [...],
  "education": [...],
  "skills": [...]
}
```

## 工作原理

1. **触发**：将 URL 发送到 Bright Data 的 Web Data API
2. **轮询**：等待数据采集完成（每秒检查一次）
3. **返回**：就绪后输出结构化 JSON

轮询机制通过等待完整提取来处理速率限制并确保数据质量。

## 高级：直接获取

适用于自定义数据集 ID 或高级用例：

```bash
bash scripts/fetch.sh <dataset_id> '<json_input>'
```

示例：
```bash
bash scripts/fetch.sh gd_l1viktl72bvl7bjuj0 '{"url":"https://linkedin.com/in/someone"}'
```
