# Bright Data MCP 工具参考

Bright Data MCP 服务器所有工具的完整参考，按模式和类别整理。

## Rapid（免费）工具

默认可用，无需特殊配置。

### search_engine
抓取 Google、Bing 或 Yandex 的搜索结果。Google 的 SERP 结果以 JSON 返回，Bing/Yandex 以 Markdown 返回。支持通过 `cursor` 参数进行分页。

### scrape_as_markdown
使用高级提取功能抓取单个网页并返回 Markdown。使用 Bright Data 的网络解锁器处理机器人防护和 CAPTCHA。

### search_engine_batch
并行执行最多 10 个搜索查询。Google 结果以 JSON 返回，Bing/Yandex 结果以 Markdown 返回。需要 `advanced_scraping` 组或 Pro 模式。

### scrape_batch
在一个请求中抓取最多 10 个网页，并以 Markdown 格式返回 URL／内容对数组。需要 `advanced_scraping` 组或 Pro 模式。

---

## 按组划分的 Pro 工具

### 高级抓取组（`advanced_scraping`）

| 工具 | 说明 |
|------|-------------|
| `scrape_as_html` | 抓取网页并返回原始 HTML。处理机器人检测和 CAPTCHA。 |
| `extract` | 将网页抓取为 Markdown，然后使用 AI 转换为结构化 JSON。接受可选的自定义提取提示词。 |
| `session_stats` | 报告当前 MCP 会话期间每个工具的调用次数。 |
| `search_engine_batch` | 并行执行最多 10 个搜索查询。 |
| `scrape_batch` | 在一个请求中抓取最多 10 个网页。 |

### 电商组（`ecommerce`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_amazon_product` | 必须包含 `/dp/` | 结构化 Amazon 商品数据（标题、价格、评分、图片等） |
| `web_data_amazon_product_reviews` | 必须包含 `/dp/` | 结构化 Amazon 评论数据 |
| `web_data_amazon_product_search` | 需要关键词 + Amazon 域名 URL | 结构化搜索结果（仅第一页） |
| `web_data_walmart_product` | 必须包含 `/ip/` | 结构化 Walmart 商品数据 |
| `web_data_walmart_seller` | 有效的 Walmart 卖家 URL | 结构化卖家数据 |
| `web_data_ebay_product` | 有效的 eBay 商品 URL | 结构化 eBay 商品信息数据 |
| `web_data_homedepot_products` | 有效的 homedepot.com URL | 结构化 Home Depot 数据 |
| `web_data_zara_products` | 有效的 Zara 商品 URL | 结构化 Zara 数据 |
| `web_data_etsy_products` | 有效的 Etsy 商品 URL | 结构化 Etsy 数据 |
| `web_data_bestbuy_products` | 有效的 Best Buy 商品 URL | 结构化 Best Buy 数据 |
| `web_data_google_shopping` | 有效的 Google Shopping URL | 结构化 Google Shopping 数据 |

### 社交媒体组（`social`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_linkedin_person_profile` | 有效的 LinkedIn 个人资料 URL | 个人资料数据（经历、技能、教育） |
| `web_data_linkedin_company_profile` | 有效的 LinkedIn 公司 URL | 公司资料数据 |
| `web_data_linkedin_job_listings` | 有效的 LinkedIn 职位 URL | 职位详情 |
| `web_data_linkedin_posts` | 有效的 LinkedIn 帖子 URL | 帖子内容和互动数据 |
| `web_data_linkedin_people_search` | LinkedIn 人员搜索 URL | 人员搜索结果 |
| `web_data_instagram_profiles` | 有效的 Instagram 个人资料 URL | 简介、粉丝数、关注数 |
| `web_data_instagram_posts` | 有效的 Instagram 帖子 URL | 帖子详情、点赞数、说明文字 |
| `web_data_instagram_reels` | 有效的 Instagram Reels URL | Reels 数据和指标 |
| `web_data_instagram_comments` | 有效的 Instagram URL | 帖子评论 |
| `web_data_facebook_posts` | 有效的 Facebook 帖子 URL | 帖子内容和回应 |
| `web_data_facebook_marketplace_listings` | 有效的 Marketplace 商品 URL | 商品详情 |
| `web_data_facebook_company_reviews` | 有效的 Facebook 公司 URL（+ 可选评论数量） | 公司评论 |
| `web_data_facebook_events` | 有效的 Facebook 活动 URL | 活动详情 |
| `web_data_tiktok_profiles` | 有效的 TikTok 个人资料 URL | 创作者资料数据 |
| `web_data_tiktok_posts` | 有效的 TikTok 帖子 URL | 视频详情和指标 |
| `web_data_tiktok_shop` | 有效的 TikTok Shop 商品 URL | 商品数据 |
| `web_data_tiktok_comments` | 有效的 TikTok 视频 URL | 视频评论 |
| `web_data_x_posts` | 有效的 X（Twitter）帖子 URL | 推文数据 |
| `web_data_youtube_videos` | 有效的 YouTube 视频 URL | 视频元数据 |
| `web_data_youtube_profiles` | 有效的 YouTube 频道 URL | 频道资料数据 |
| `web_data_youtube_comments` | 有效的 YouTube 视频 URL（+ 可选 num_of_comments，默认值为 10） | 视频评论 |
| `web_data_reddit_posts` | 有效的 Reddit 帖子 URL | 帖子和评论数据 |

### 商业情报组（`business`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_crunchbase_company` | 有效的 Crunchbase 公司 URL | 公司融资、员工和轮次 |
| `web_data_zoominfo_company_profile` | 有效的 ZoomInfo 公司 URL | 公司资料数据 |
| `web_data_google_maps_reviews` | 有效的 Google 地图 URL（+ 可选 days_limit，默认值为 3） | 商家评论 |
| `web_data_zillow_properties_listing` | 有效的 Zillow 房源 URL | 房产信息数据 |

### 金融组（`finance`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_yahoo_finance_business` | 有效的 Yahoo Finance 企业 URL | 公司资料和股票数据 |

### 研究组（`research`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_reuter_news` | 有效的 Reuters 新闻文章 URL | 结构化新闻数据 |
| `web_data_github_repository_file` | 有效的 GitHub 文件 URL | 代码库文件数据 |

### 应用商店组（`app_stores`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_google_play_store` | 有效的 Play Store 应用 URL | 应用数据和评论 |
| `web_data_apple_app_store` | 有效的 App Store 应用 URL | 应用数据和评论 |

### 旅行组（`travel`）

| 工具 | URL 要求 | 说明 |
|------|-----------------|-------------|
| `web_data_booking_hotel_listings` | 有效的 Booking.com 房源 URL | 酒店房源数据 |

### 浏览器自动化组（`browser`）

按顺序使用这些工具执行交互式网页自动化。

| 工具 | 说明 |
|------|-------------|
| `scraping_browser_navigate` | 打开或复用会话并导航到 URL。重置已跟踪的网络请求。 |
| `scraping_browser_go_back` | 返回上一页。 |
| `scraping_browser_go_forward` | 前进到下一页。 |
| `scraping_browser_snapshot` | 捕获列出交互元素及其引用的 ARIA 快照。 |
| `scraping_browser_click_ref` | 通过 ARIA 快照中的引用点击元素。需要引用 + 便于理解的说明。 |
| `scraping_browser_type_ref` | 通过引用填写输入元素。可选择在输入后按 Enter。 |
| `scraping_browser_screenshot` | 捕获屏幕截图。支持可选的 `full_page` 模式。 |
| `scraping_browser_network_requests` | 列出页面加载后的网络请求（方法、URL、状态）。 |
| `scraping_browser_wait_for_ref` | 等待元素变为可见（可选超时时间，单位为毫秒）。 |
| `scraping_browser_get_text` | 返回页面正文的文本内容。 |
| `scraping_browser_get_html` | 返回页面 HTML。除非需要 head/script 标签，否则请避免使用 `full_page`。 |
| `scraping_browser_scroll` | 滚动到页面底部。 |
| `scraping_browser_scroll_to_ref` | 滚动到由 ARIA 引用指定的元素进入视野。 |

#### 浏览器自动化最佳实践

1. 始终先使用 `scraping_browser_navigate` 打开目标 URL
2. 点击或输入前，使用 `scraping_browser_snapshot` 查找交互元素
3. 所有交互都使用快照中的引用（不要使用选择器）
4. 交互后，获取新的 `scraping_browser_snapshot` 以查看更新后的状态
5. 调试时使用 `scraping_browser_screenshot` 直观验证状态
6. 与动态加载的元素交互前使用 `scraping_browser_wait_for_ref`
7. 使用 `scraping_browser_get_text` 或 `scraping_browser_get_html` 提取最终内容

---

## 可用组摘要

| 组 | 说明 | 主要工具 |
|-------|-------------|-----------|
| `ecommerce` | 电商平台 | Amazon、Walmart、eBay、Best Buy、Etsy 等 |
| `social` | 社交媒体和职业平台 | LinkedIn、Instagram、Facebook、TikTok、YouTube、X、Reddit |
| `business` | 商业情报 | Crunchbase、ZoomInfo、Google 地图、Zillow |
| `finance` | 金融数据 | Yahoo Finance |
| `research` | 研究和新闻 | Reuters、GitHub |
| `app_stores` | 应用商店 | Google Play、Apple App Store |
| `travel` | 旅行平台 | Booking.com |
| `browser` | 浏览器自动化 | 导航、点击、输入、截图、提取 |
| `advanced_scraping` | 高级提取 | HTML 抓取、AI 提取、批处理操作 |
