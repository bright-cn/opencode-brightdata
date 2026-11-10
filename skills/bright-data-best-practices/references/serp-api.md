# 搜索引擎 API 参考

## 目录

- [概述](#概述)
- [身份验证](#身份验证)
- [REST API（推荐）](#rest-api推荐)
- [代理接口](#代理接口)
- [请求参数](#请求参数)
- [Google 搜索参数](#google-搜索参数)
- [Bing 搜索参数](#bing-搜索参数)
- [解析后的 JSON 输出](#解析后的-json-输出)
- [异步请求](#异步请求)
- [计费模式](#计费模式)
- [最佳实践](#最佳实践)

---

## 概述

Bright Data 搜索引擎 API 可从 Google、Bing、Yandex 和 DuckDuckGo 提取结构化搜索引擎结果。它会自动处理代理管理和验证码破解，并在 5 秒内交付结果。

**返回内容：**
- 自然搜索结果（标题、描述、链接、排名）
- 付费广告（顶部、底部、商品列表、高级广告）
- 本地商家列表（本地三件套）
- 购物结果
- 相关搜索和“其他用户还问了以下问题”
- 知识面板
- 专用 SERP 功能（地图、趋势、评论、Lens、酒店、航班）

---

## 身份验证

```bash
export BRIGHTDATA_API_KEY="your-api-key"
export BRIGHTDATA_SERP_ZONE="your-serp-zone-name"
```

创建搜索引擎 API 区域时会自动生成 API 密钥。你可以在账户设置中生成其他密钥。为提高安全性，建议为密钥设置到期日期。

---

## REST API（推荐）

**端点：** `POST https://api.brightdata.com/request`

**标头：** `Authorization: Bearer YOUR_API_KEY`

### Google 搜索

```python
import requests

response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": "YOUR_SERP_ZONE",
        "url": "https://www.google.com/search?q=python+web+scraping",
        "format": "raw"
    }
)
html = response.text
```

### 带解析后 JSON 的 Google 搜索

```python
response = requests.post(
    "https://api.brightdata.com/request",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": "YOUR_SERP_ZONE",
        "url": "https://www.google.com/search?q=python+web+scraping&brd_json=1",
        "format": "raw"
    }
)
data = response.json()
for result in data.get("organic", []):
    print(result["title"], result["link"])
```

```javascript
const response = await fetch("https://api.brightdata.com/request", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    zone: "YOUR_SERP_ZONE",
    url: "https://www.google.com/search?q=python+web+scraping&brd_json=1",
    format: "raw"
  })
});
const data = await response.json();
```

```bash
curl -H "Authorization: Bearer $BRIGHTDATA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"zone":"'"$BRIGHTDATA_SERP_ZONE"'","url":"https://www.google.com/search?q=python+web+scraping&brd_json=1","format":"raw"}' \
     https://api.brightdata.com/request
```

---

## 代理接口

通过 Bright Data 的代理端点路由搜索请求。

- **主机：** `brd.superproxy.io`
- **端口：** `33335`
- **凭据：** `brd-customer-{CUSTOMER_ID}-zone-{ZONE_NAME}:{ZONE_PASSWORD}`

```python
proxies = {
    "http": "http://brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD@brd.superproxy.io:33335",
    "https": "http://brd-customer-CUSTOMER_ID-zone-ZONE_NAME:PASSWORD@brd.superproxy.io:33335"
}
response = requests.get(
    "https://www.google.com/search?q=python+web+scraping&brd_json=1",
    proxies=proxies,
    verify="/path/to/brightdata-cert.crt"  # Install Bright Data SSL cert
)
```

---

## 请求参数

所有 SERP 端点共享的核心参数：

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| `zone` | 字符串 | 是 | SERP 区域名称 |
| `url` | 字符串 | 是 | 包含查询参数的完整搜索 URL |
| `format` | 字符串 | 是 | `"raw"`（HTML/JSON）或 `"json"`（结构化响应封装） |
| `country` | 字符串 | 否 | 用于代理地理位置定向的 2 字母 ISO 国家/地区代码 |
| `async` | 布尔值 | 否 | 异步模式设为 `true` |

---

## Google 搜索参数

所有参数都会作为查询字符串参数追加到 Google URL。

### 本地化

| 参数 | 说明 | 示例 |
|-----------|-------------|---------|
| `gl` | 搜索位置的 2 字母国家/地区代码 | `gl=us` |
| `hl` | 页面语言的 2 字母语言代码 | `hl=en` |

### 搜索类型

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `tbm` | 搜索类型 | `isch`（图片）、`nws`（新闻）、`vid`（视频） |
| `udm` | 其他搜索类型 | `28`（购物）、`39`（短视频） |
| `ibp` | 职位搜索 | `htl;jobs` |

### 分页

| 参数 | 说明 | 示例 |
|-----------|-------------|---------|
| `start` | 结果偏移量 | `0`、`10`、`20`（每页 = 10） |
| `num` | 结果数量 | 自 2025 年 9 月起**已弃用** |

### 地理位置

| 参数 | 说明 |
|-----------|-------------|
| `uule` | 用于精确地理位置定向的编码位置字符串 |

### 设备与浏览器

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `brd_mobile` | 设备类型 | `0`（桌面端）、`1`（随机移动端）、`ios`、`ipad`、`android`、`android_tablet` |
| `brd_browser` | 浏览器类型 | `chrome`, `safari`, `firefox` |

### 输出格式

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `brd_json` | 启用解析后的 JSON 输出 | `1`（JSON）、`html`（JSON + 原始 HTML） |

### 特殊功能

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `brd_ai_overview` | 提高出现 AI 概览结果的概率 | `2` |

### 酒店搜索（通过 Google 搜索 URL）

| 参数 | 说明 | 示例 |
|-----------|-------------|---------|
| `hotel_occupancy` | 宾客人数 | `1`–`4` |
| `hotel_dates` | 入住/退房 | `2025-06-01,2025-06-07` |

---

## Google 地图参数

追加到 `https://www.google.com/maps/search/...`：

| 参数 | 说明 |
|-----------|-------------|
| `gl`, `hl` | 本地化 |
| `@latitude,longitude,zoom` | 用于位置搜索的 GPS 坐标 |
| `fid` | 地点概览的功能 ID |
| `brd_accomodation_type` | 筛选条件：`hotels` 或 `vacation_rentals` |

---

## Google 趋势参数

追加到 `https://trends.google.com/trends/explore`：

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `brd_json` | 必填：返回解析后的结果 | `1` |
| `brd_trends` | 微件类型 | `timeseries`、`geo_map` 或两者 |
| `geo` | 2 字母国家/地区代码 | `us`, `gb` |
| `hl` | 语言代码 | `en` |
| `date` | 时间范围 | `now 1-H`、`today 12-m`、自定义日期 |
| `cat` | 类别 ID | 整数 |
| `gprop` | Google 产品筛选器 | `images`, `news`, `froogle`, `youtube` |

---

## Google 评论参数

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `fid` | 地点的功能 ID | 字符串 |
| `hl` | 语言代码 | `en` |
| `sort` | 排序方式 | `qualityScore`, `newestFirst`, `ratingHigh`, `ratingLow` |
| `filter` | 关键词筛选器 | 字符串 |
| `start` | 分页偏移量 | 整数 |
| `num` | 每页结果数 | 最大 `20` |

---

## Google Lens 参数

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `url` | 用于反向搜索的图片 URL | 字符串 |
| `hl` | 语言代码 | `en` |
| `brd_lens` | 特定选项卡结果 | `products`, `homework`, `visual_matches`, `exact_matches` |

---

## Google 酒店参数

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `gl`, `hl` | 本地化 | ISO 代码 |
| `brd_dates` | 入住/退房日期 | `YYYY-MM-DD,YYYY-MM-DD` |
| `brd_occupancy` | 宾客人数或明细 | `2` 或 `2,5,7`（成人、儿童年龄） |
| `brd_free_cancellation` | 免费取消筛选器 | `true`/`false` |
| `brd_accomodation_type` | 住宿类型 | 字符串 |
| `brd_currency` | 3 字母货币代码 | `USD`, `EUR` |
| `brd_mobile` | 设备类型 | `0`、`1`、`ios` 等 |
| `brd_json` | 输出格式 | `1` |

---

## Google 航班参数

| 参数 | 说明 |
|-----------|-------------|
| `gl`, `hl` | 本地化 |
| `tfs` | 航班搜索参数字符串 |
| `curr` | 价格的货币代码 |

---

## Bing 搜索参数

<strong>注意：</strong>Microsoft 已于 2025 年 8 月 11 日停用 Bing 搜索 API。Bright Data 仍通过其搜索引擎 API 支持 Bing 域名。

| 参数 | 说明 | 值 |
|-----------|-------------|--------|
| `setLang` | 语言代码 | `en-US`、`fr-FR`（优先使用 4 字母代码） |
| `location` | 与纬度/经度配合使用 | 与 `mkt` 配对 |
| `cc` | 2 字符国家/地区代码 | `us`, `gb` |
| `mkt` | 市场指定 | `en-US` |
| `first` | 结果偏移量（分页） | `1`、`11`、`21`（每次递增 10） |
| `safesearch` | 成人内容筛选器 | `off`、`moderate`（默认）、`strict` |
| `brd_mobile` | 设备类型 | `0`、`1`、`ios`、`android` 等 |
| `brd_browser` | 浏览器类型 | `chrome`, `safari`, `firefox` |

---

## 解析后的 JSON 输出

将 `brd_json=1` 添加到 Google 搜索 URL，以接收结构化 JSON 而非 HTML。

```python
url = "https://www.google.com/search?q=best+laptops+2025&brd_json=1&gl=us&hl=en"
```

### 响应结构

```json
{
  "general": {
    "search_engine": "google",
    "query": "best laptops 2025",
    "results_cnt": 1240000000,
    "language": "en",
    "device": "desktop"
  },
  "organic": [
    {
      "rank": 1,
      "global_rank": 1,
      "title": "Best Laptops 2025",
      "link": "https://example.com/best-laptops",
      "description": "...",
      "sitelinks": []
    }
  ],
  "paid": [],
  "product_listing_ads": [],
  "knowledge_graph": {},
  "people_also_ask": [],
  "related_searches": [],
  "maps": [],
  "news": [],
  "videos": [],
  "recipes": [],
  "perspectives": []
}
```

### 主要字段

| 字段 | 说明 |
|-------|-------------|
| `organic[].rank` | 在自然搜索结果组件中的位置 |
| `organic[].global_rank` | 在整个 SERP 中的总体位置 |
| `organic[].title` | 页面标题 |
| `organic[].link` | URL |
| `organic[].description` | 摘要 |
| `general.results_cnt` | 结果总数（仅限桌面端：移动端不可用） |

如需原始 HTML + 解析后的 JSON，请使用 `brd_json=html`。

---

## 异步请求

### 设置
在控制面板中启用：SERP 区域 → 高级选项 → 打开“Asynchronous requests”。

**Webhook 允许列表 IP**（将其添加到服务器防火墙）：
- `100.27.150.189`
- `18.214.10.85`

### 异步流程

**第 1 步：提交请求**

```python
response = requests.post(
    "https://api.brightdata.com/request",
    params={"async": "1"},
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "zone": "YOUR_SERP_ZONE",
        "url": "https://www.google.com/search?q=python+web+scraping&brd_json=1",
        "format": "raw"
    }
)
response_id = response.headers.get("x-response-id")
```

**第 2 步：获取结果**

```python
result = requests.get(
    "https://api.brightdata.com/serp/get_result",
    params={"response_id": response_id},
    headers={"Authorization": f"Bearer {API_KEY}"}
)
data = result.json()
```

### 异步处理要点
- 响应通常在 **5 分钟**内完成，并保存 **48 小时**
- 异步模式下的成功率为 `99.99%`
- 使用 `x-response-id` 标头中的 `response_id` 获取结果
- 收集/获取调用**不计费**：仅初始提交计费

---

## 计费模式

| 模式 | 计费 |
|------|---------|
| 标准 | 仅按每 1,000 次**成功**请求计费 |
| 异步收集/获取 | **不计费**：仅提交计费 |
| 自动重试 | 仅对成功响应收费一次，而不是按重试次数收费 |
| 失败的请求 | **不收费** |

无需额外付费的功能包括：解析（JSON/Markdown/HTML）、代理管理、CAPTCHA 处理、地理位置定向，以及桌面端和移动端 User-Agent 支持。

---

## 最佳实践

### 1. 数据管道始终使用 `brd_json=1`
HTML 解析较为脆弱。使用 `brd_json=1` 获取结构化数据，这样即使 Google 更改布局也不会失效。

```python
url = "https://www.google.com/search?q=your+query&brd_json=1&gl=us&hl=en"
```

### 2. 设置区域参数（`gl` + `hl`）以获得一致的结果
如果不设置区域参数，结果会因服务器位置而异。请始终同时设置两者，以获得可复现且符合目标地区的结果。

```python
# Good: explicit locale
"url": "https://www.google.com/search?q=coffee+shops&gl=us&hl=en"

# Bad: no locale, results depend on IP
"url": "https://www.google.com/search?q=coffee+shops"
```

### 3. 使用 `brd_mobile` 获取移动端 SERP 数据
移动端与桌面端 SERP 差异显著。请匹配你的目标受众。

```python
# Mobile results
"url": "https://www.google.com/search?q=restaurants+near+me&brd_mobile=1&brd_json=1"
```

### 4. 使用 `start` 参数进行分页
每页结果偏移量为 10。获取第 3 页：`start=20`。

```python
for page in range(5):
    url = f"https://www.google.com/search?q=python+tutorials&brd_json=1&start={page * 10}"
```

### 5. 对高容量管道使用异步模式
对于批量查询（监控排名、抓取大量关键词），异步模式可提供 `99.99%` 的成功率，并且收集/获取调用不收费。

### 6. 需要 AI 概览数据时使用 `brd_ai_overview=2`
此参数会提高 Google AI 概览出现在结果中的概率。

### 7. 使用 `tbm` 按搜索类型筛选
不要抓取错误的 SERP 类型。新闻使用 `tbm=nws`，图片使用 `tbm=isch`，以此类推。

### 8. 对广告密集型研究使用 `Enhanced Ads` 区域设置
在区域设置中启用“Enhanced Ads”，以获取范围更广、更多样化的广告，并模拟无痕浏览。

### 9. 注意：`num` 参数已弃用
自 2025 年 9 月起，`num` 参数不再控制结果数量。请改用 `start` 进行分页。
