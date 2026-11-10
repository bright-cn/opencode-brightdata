---
name: search
description: Search Google via Bright Data SERP API. Returns structured JSON results with title, link, and description. Requires BRIGHTDATA_API_KEY and BRIGHTDATA_UNLOCKER_ZONE environment variables.
---

# Bright Data - Google 搜索

使用 Bright Data 的搜索引擎 API 搜索 Google 并获取结构化 JSON 结果。

## 设置

**1. 获取 API 密钥：** 从 [Bright Data 控制面板](https://www.bright.cn/cp)获取密钥。

**2. 创建网络解锁器区域：** 在 www.bright.cn/cp 中点击右上角的“添加”，然后选择“解锁器区域”来创建区域。

**3. 设置环境变量：**
```bash
export BRIGHTDATA_API_KEY="your-api-key"
export BRIGHTDATA_UNLOCKER_ZONE="your-zone-name"
```

## 用法

```bash
bash scripts/search.sh "query" [cursor]
```

**参数：**
- `query`（必填）：搜索词
- `cursor`（可选）：分页页码（从 0 开始，默认值：0）

**示例：**
```bash
# Basic search
bash scripts/search.sh "climate change"

# Get page 2 of results
bash scripts/search.sh "climate change" 1
```

## 输出格式

返回包含结构化 `organic` 数组的 JSON：
```json
{
  "organic": [
    {
      "link": "https://example.com/article",
      "title": "Article Title",
      "description": "Brief description of the page..."
    }
  ]
}
```

## 依赖项

- `curl` - 用于 API 请求
- `jq` - 用于 JSON 处理
