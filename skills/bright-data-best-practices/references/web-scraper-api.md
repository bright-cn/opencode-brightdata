# 网页爬虫工具 API 参考

## 目录

- [概述](#概述)
- [身份验证](#身份验证)
- [选择同步或异步](#选择同步或异步)
- [同步请求](#同步请求)
- [异步请求](#异步请求)
- [监控进度](#监控进度)
- [下载结果](#下载结果)
- [爬虫类型](#爬虫类型)
- [输出格式](#输出格式)
- [计费模式](#计费模式)
- [最佳实践](#最佳实践)

---

## 概述

Bright Data 网页爬虫工具 API 为 Amazon、LinkedIn、Instagram、TikTok、YouTube、Facebook 等 100 多个热门网站提供预构建爬虫工具（“数据集”）。你只需提供输入（URL 或关键词），无需编写任何抓取逻辑，即可获得整洁的结构化 JSON/CSV 数据。

<strong>支持的域名包括：</strong>Amazon、eBay、Walmart、LinkedIn、Instagram、TikTok、YouTube、Facebook、Reddit、Twitter/X、Crunchbase、ZoomInfo 等。

---

## 身份验证

```bash
export BRIGHTDATA_API_KEY="your-api-key"
```

从以下位置获取 API 密钥：`https://www.bright.cn/cp/setting/users`

所有请求均使用 Bearer 令牌身份验证：
```
Authorization: Bearer YOUR_API_KEY
```

---

## 选择同步或异步

| 因素 | 同步（`/scrape`） | 异步（`/trigger`） |
|--------|------------------------|---------------------------|
| 输入大小 | 最多 **20 个 URL** | 任意大小：专为批量处理而构建 |
| 响应时间 | 立即返回（1 分钟内） | 后台任务：轮询直至完成 |
| 超时行为 | 超过 1 分钟时返回 202 + `snapshot_id` | 不适用：始终异步 |
| 最适合 | 实时单项查询 | 大型批次、计划任务 |

---

## 同步请求

**端点：** `POST https://api.brightdata.com/datasets/v3/scrape`

结果会立即在响应正文中返回。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| `dataset_id` | 字符串 | 是 | 标识要使用的爬虫工具（来自爬虫工具库） |
| `format` | 字符串 | 否 | 输出格式：`json`（默认）、`ndjson`、`jsonl` 或 `csv` |
| `custom_output_fields` | 字符串 | 否 | 用于筛选输出、以竖线分隔的字段名称（例如 `url\|title\|price`） |
| `include_errors` | 布尔值 | 否 | 在结果中包含错误报告 |

### 请求正文

```json
{
  "input": [
    { "url": "https://www.amazon.com/dp/B09X7M8TBQ" },
    { "url": "https://www.amazon.com/dp/B0B7CTCPKN" }
  ]
}
```

### Python 示例

```python
import requests

response = requests.post(
    "https://api.brightdata.com/datasets/v3/scrape",
    params={
        "dataset_id": "gd_l7q7dkf244hwjntr0",  # Amazon product dataset_id
        "format": "json"
    },
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "input": [
            {"url": "https://www.amazon.com/dp/B09X7M8TBQ"},
            {"url": "https://www.amazon.com/dp/B0B7CTCPKN"}
        ]
    }
)

if response.status_code == 200:
    data = response.json()
    for item in data:
        print(item["title"], item["price"])
elif response.status_code == 202:
    # Processing exceeded 1-minute timeout — use snapshot_id for async retrieval
    snapshot_id = response.json().get("snapshot_id")
    print(f"Processing... poll with snapshot_id: {snapshot_id}")
```

```javascript
const response = await fetch(
  "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l7q7dkf244hwjntr0&format=json",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: [
        { url: "https://www.amazon.com/dp/B09X7M8TBQ" }
      ]
    })
  }
);

if (response.status === 200) {
  const data = await response.json();
  console.log(data);
} else if (response.status === 202) {
  const { snapshot_id } = await response.json();
  // Poll for completion
}
```

### 响应代码（同步）

| 代码 | 含义 |
|------|---------|
| `200 OK` | 数据直接在响应正文中返回 |
| `202 Accepted` | 处理超过 1 分钟超时限制：响应中包含用于异步获取的 `snapshot_id` |

---

## 异步请求

对大型批次或不需要立即响应的情况使用 `/trigger`。

**端点：** `POST https://api.brightdata.com/datasets/v3/trigger`

### 请求参数（与同步相同，另加）

| 参数 | 类型 | 必填 | 说明 |
|-----------|------|----------|-------------|
| `dataset_id` | 字符串 | 是 | 抓取工具标识符 |
| `format` | 字符串 | 否 | `json`, `ndjson`, `jsonl`, `csv` |
| `custom_output_fields` | 字符串 | 否 | 以竖线分隔的字段名称 |
| `include_errors` | 布尔值 | 否 | 在输出中包含错误 |
| `notify` | 字符串 | 否 | 用于接收完成通知的 Webhook URL |
| `output` | 对象 | 否 | 外部存储交付配置（S3、GCS 等） |

### Python 示例（触发 + 轮询）

```python
import requests
import time

# Step 1: Trigger the job
trigger_response = requests.post(
    "https://api.brightdata.com/datasets/v3/trigger",
    params={
        "dataset_id": "gd_l7q7dkf244hwjntr0",
        "format": "json"
    },
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "input": [
            {"url": "https://www.amazon.com/dp/B09X7M8TBQ"},
            # ... hundreds more URLs
        ]
    }
)
snapshot_id = trigger_response.json()["snapshot_id"]

# Step 2: Poll until ready
while True:
    progress = requests.get(
        f"https://api.brightdata.com/datasets/v3/progress/{snapshot_id}",
        headers={"Authorization": f"Bearer {API_KEY}"}
    )
    status = progress.json()["status"]
    print(f"Status: {status}")

    if status == "ready":
        break
    elif status == "failed":
        raise Exception("Scraping job failed")

    time.sleep(10)

# Step 3: Download results
results = requests.get(
    f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}",
    params={"format": "json"},
    headers={"Authorization": f"Bearer {API_KEY}"}
)
data = results.json()
```

---

## 监控进度

**端点：** `GET https://api.brightdata.com/datasets/v3/progress/{snapshot_id}`

```python
response = requests.get(
    f"https://api.brightdata.com/datasets/v3/progress/{snapshot_id}",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
status = response.json()["status"]
```

### 状态值

| 状态 | 说明 |
|--------|-------------|
| `starting` | 任务初始化 |
| `running` | 数据采集进行中 |
| `ready` | 结果可供下载 |
| `failed` | 任务失败 |

### 错误响应

| 代码 | 含义 |
|------|---------|
| `401` | API 密钥缺失或无效 |
| `404` | 找不到快照 ID |

---

## 下载结果

**端点：** `GET https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}`

```python
response = requests.get(
    f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot_id}",
    params={"format": "json"},
    headers={"Authorization": f"Bearer {API_KEY}"}
)
data = response.json()
```

### 快照生命周期
- 快照在采集后可用 **30 天**
- 以 JSON、NDJSON、JSONL 或 CSV 格式下载

---

## 爬虫类型

爬虫工具库包含按类型组织的预构建抓取工具：

### PDP 爬虫工具（产品/个人资料详情）
- 接受一个或多个 URL
- 返回每个 URL 的详细数据
- 示例：Amazon 商品页面 → 价格、标题、评论、规格

### 发现型爬虫工具
- 接受搜索词、关键词或类别 URL
- 返回可供探索的结果列表
- 示例：Amazon 搜索 → 匹配商品列表

### 查找数据集 ID
1. 转到 `https://www.bright.cn/cp/datasets`（爬虫工具库）
2. 选择所需的平台和数据类型
3. 每个抓取工具都有唯一的 `dataset_id`，显示在 API 参考中

---

## 输出格式

| 格式 | 说明 |
|--------|-------------|
| `json` | 标准 JSON 数组（默认） |
| `ndjson` | 以换行符分隔的 JSON（每行一个对象）：适合流式处理大型结果 |
| `jsonl` | 与 ndjson 相同 |
| `csv` | CSV 格式 |

### 自定义输出字段

筛选返回的字段，以减小有效负载大小：

```python
params = {
    "dataset_id": "gd_l7q7dkf244hwjntr0",
    "format": "json",
    "custom_output_fields": "url|title|price|rating"  # pipe-separated
}
```

嵌套字段使用点号表示法：`about.updated_on`

---

## 计费模式

| 场景 | 计费 |
|----------|---------|
| 标准 | 按**交付的记录**计费：每 1,000 条记录 $0.75 起 |
| 因用户输入错误而失败 | **计费**：处理无效输入时已消耗资源 |
| 同步超时 (202) → 异步获取 | 仅对记录收费一次，不会重复收费 |
| 实时模式 | 每次调用最多输入 20 个 URL |

<strong>数据保留期：</strong>采集的快照可用 **30 天**。

---

## 最佳实践

### 1. 不超过 20 个 URL 时使用同步模式，更大批次使用异步模式
同步模式更适合小型任务。对于更大的任务，请使用 `/trigger` 并进行轮询。

```python
if len(urls) <= 20:
    # Use /scrape for immediate results
    endpoint = "https://api.brightdata.com/datasets/v3/scrape"
else:
    # Use /trigger for bulk
    endpoint = "https://api.brightdata.com/datasets/v3/trigger"
```

### 2. 在同步模式下处理 202 响应
如果同步请求耗时超过 1 分钟，你会收到包含 `snapshot_id` 的 202 响应。请始终处理这种情况：

```python
if response.status_code == 202:
    snapshot_id = response.json()["snapshot_id"]
    # Fall through to polling logic
```

### 3. 对生产环境异步工作流使用 Webhook
开发期间可以使用轮询。在生产环境中，请配置 `notify` URL 以接收推送通知：

```python
json={
    "input": [...],
    "notify": "https://your-server.com/webhook/brightdata"
}
```

### 4. 使用 `custom_output_fields` 减小有效负载
只请求所需字段。这可以减少带宽和响应大小：

```python
params={"custom_output_fields": "url|title|price|availability"}
```

### 5. 对大型结果集使用 `ndjson` 格式
NDJSON 更适合大型数据集的内存高效处理，因为你可以逐行进行流式处理：

```python
for line in response.iter_lines():
    record = json.loads(line)
    process(record)
```

### 6. 检查数据保留期（30 天）
请在 30 天内下载快照。此后数据将被删除。

### 7. 提交前验证输入
提交因用户错误而失败的无效 URL/输入仍会计费。发送前请验证 URL：

```python
from urllib.parse import urlparse

def is_valid_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)

urls = [u for u in raw_urls if is_valid_url(u)]
```

### 8. 对大型任务使用外部存储交付
对于大型数据集，请在触发请求中配置交付到 S3/GCS，而不是通过 API 下载：

```python
json={
    "input": [...],
    "output": {
        "type": "s3",
        "bucket": "your-bucket",
        "prefix": "brightdata/results/"
    }
}
```
