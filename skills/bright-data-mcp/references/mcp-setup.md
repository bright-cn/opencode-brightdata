# Bright Data MCP 服务器设置

## 前提条件

1. Bright Data 账号：在 [brightdata.com](https://www.bright.cn/) 注册
2. 来自 [Bright Data 控制面板](https://www.bright.cn/cp)的 API 令牌

## 远程 MCP 服务器（推荐）

远程 MCP 服务器无需在本地安装。可通过 URL 直接连接。

### 基础 URL

```
https://mcp.brightdata.com/mcp?token=<YOUR_BRIGHTDATA_API_TOKEN>
```

### 可选参数

| 参数 | 值 | 说明 |
|-----------|--------|-------------|
| `pro` | `1` | 启用全部 60 多个 Pro 工具（浏览器自动化、结构化提取） |
| `groups` | 组名称 | 在不启用完整 Pro 模式的情况下启用特定工具组 |
| `tools` | 工具名称 | 仅启用特定的单个工具 |

### URL 示例

**Rapid（免费）模式** - 仅搜索和抓取：
```
https://mcp.brightdata.com/mcp?token=YOUR_TOKEN
```

**完整 Pro 模式** - 全部 60 多个工具：
```
https://mcp.brightdata.com/mcp?token=YOUR_TOKEN&pro=1
```

**特定组** - 例如社交媒体 + 电商：
```
https://mcp.brightdata.com/mcp?token=YOUR_TOKEN&groups=social,ecommerce
```

**特定工具** - 例如仅启用 Amazon 商品和搜索：
```
https://mcp.brightdata.com/mcp?token=YOUR_TOKEN&tools=web_data_amazon_product,search_engine
```

### 在 Claude.ai 中设置

1. 前往设置 > 扩展
2. 点击“添加扩展”或“添加 MCP 服务器”
3. 输入包含令牌的 MCP URL
4. 确认连接显示“已连接”状态

### 在 Claude Code 中设置

添加到 Claude Code MCP 设置中（通常为 `~/.claude/settings.json` 或项目级别的 `.claude/settings.json`）：

```json
{
  "mcpServers": {
    "brightdata": {
      "url": "https://mcp.brightdata.com/mcp?token=YOUR_TOKEN&pro=1"
    }
  }
}
```

仅使用 Rapid（免费）模式：
```json
{
  "mcpServers": {
    "brightdata": {
      "url": "https://mcp.brightdata.com/mcp?token=YOUR_TOKEN"
    }
  }
}
```

## 本地 MCP 服务器

适用于希望在本地运行 MCP 服务器的用户。

### 安装

通过 npm 安装：
```bash
npm install -g @brightdata/mcp
```

### 环境变量

| 变量 | 必填 | 说明 |
|----------|----------|-------------|
| `API_TOKEN` | 是 | 你的 Bright Data API 令牌 |
| `PRO_MODE` | 否 | 设为 `true` 以启用 Pro 工具 |
| `GROUPS` | 否 | 以逗号分隔的组名称 |

### 在本地运行

```bash
API_TOKEN=your_token PRO_MODE=true npx @brightdata/mcp
```

## 选择模式

所有模式**每月最多 5,000 次请求均免费**：包括 Pro 工具。

### Rapid（免费）- 默认
- 可使用 `search_engine` 和 `scrape_as_markdown`（以及批处理版本）
- 最适合：日常浏览、读取网页、搜索查询

### Pro 模式（`pro=1`）
- 启用全部 60 多个工具
- 获取 Amazon、LinkedIn、Instagram、TikTok、YouTube 等平台的结构化数据
- 浏览器自动化工具
- 最适合：数据提取、社交媒体分析、电商监控、自动化

### 工具组（选择性 Pro）
仅启用你需要的工具组：
- `ecommerce` - Amazon、Walmart、eBay、Best Buy 等
- `social` - LinkedIn、Instagram、Facebook、TikTok、YouTube、X、Reddit
- `business` - Crunchbase、ZoomInfo、Google 地图、Zillow
- `finance` - Yahoo Finance
- `research` - Reuters、GitHub
- `app_stores` - Google Play、Apple App Store
- `travel` - Booking.com
- `browser` - 完整浏览器自动化
- `advanced_scraping` - HTML 抓取、AI 提取、批处理操作

## 验证设置

连接后，使用简单的工具调用进行测试：

1. 询问 Claude：“使用 Bright Data MCP 搜索‘test query’”
2. 这应该会调用 `search_engine` 并返回结果
3. 如果成功，则说明 MCP 连接已启用

如果失败：
- 检查 API 令牌是否有效且未过期
- 确认 MCP URL 格式正确
- 检查与 mcp.brightdata.com 的网络连接
- 尝试在设置 > 扩展中重新连接

## 文档

完整文档索引：https://docs.brightdata.com/llms.txt
