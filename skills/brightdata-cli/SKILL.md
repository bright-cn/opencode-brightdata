---
name: brightdata-cli
description: Guide for using the Bright Data CLI (`brightdata` / `bdata`) to scrape websites, search the web, extract structured data from 40+ platforms, manage proxy zones, and check account budget. Use this skill whenever the user wants to scrape a URL, search Google/Bing/Yandex, extract data from Amazon/LinkedIn/Instagram/TikTok/YouTube/Reddit or any other platform, check their Bright Data balance or zones, or do anything involving web data collection from the terminal. Also trigger when the user mentions brightdata, bdata, web scraping CLI, SERP API, or wants to install Bright Data skills into their coding agent.
---

# Bright Data CLI

Bright Data CLI（`brightdata` 或 `bdata`）让你能从终端完整访问 Bright Data 的网页数据平台。它会自动处理身份验证、代理区域、反机器人绕过、CAPTCHA 破解和 JavaScript 渲染：用户只需登录一次。

## 安装

如果尚未安装 CLI，请指导用户：

**macOS / Linux：**
```bash
curl -fsSL https://cli.brightdata.com/install.sh | bash
```

**Windows 或手动安装（任意平台）：**
```bash
npm install -g @brightdata/cli
```

**无需安装（一次性使用）：**
```bash
npx --yes --package @brightdata/cli brightdata <command>
```

需要 Node.js >= 20。安装后，`brightdata` 和 `bdata`（简写）均可使用。

## 首次设置

首先检查用户是否已通过身份验证。如果尚未登录，请引导他们完成一次性设置：

```bash
# One-time login — opens the browser for OAuth, then everything is automatic
bdata login
```

此命令将：
1. 打开浏览器进行安全的 OAuth 身份验证
2. 在本地保存 API 密钥（之后无需再次输入）
3. 自动创建所需的代理区域（`cli_unlocker`、`cli_browser`）
4. 设置默认配置

登录后，之后的每条命令都无需人工干预即可运行。

对于没有浏览器的无头／SSH 环境：
```bash
bdata login --device
```

直接使用 API 密钥进行身份验证（非交互式）：
```bash
bdata login --api-key <key>
```

要验证设置是否完成，请运行：
```bash
bdata config
```

## 命令参考

阅读 [references/commands.md](references/commands.md)，查看包含每条命令全部标志、选项和示例的完整命令参考。

阅读 [references/pipelines.md](references/pipelines.md)，查看 40 多种管道类型（Amazon、LinkedIn、Instagram、TikTok、YouTube、Reddit 等）及其特定参数的完整列表。

## 命令快速概览

`bdata` 是 `brightdata` 的简写。两者功能完全相同。

| 命令 | 用途 |
|---------|---------|
| `bdata scrape <url>` | 将任意 URL 抓取为 Markdown、HTML、JSON 或截图 |
| `bdata search "<query>"` | 搜索 Google/Bing/Yandex 并获取结构化结果 |
| `bdata pipelines <type> [params]` | 从 40 多个平台提取结构化数据 |
| `bdata pipelines list` | 列出全部 40 多种可用管道类型 |
| `bdata status <job-id>` | 检查异步作业状态 |
| `bdata zones` | 列出代理区域 |
| `bdata budget` | 查看账号余额和费用 |
| `bdata skill add` | 安装 AI 智能体技能 |
| `bdata skill list` | 列出可用技能 |
| `bdata config` | 查看／设置配置 |
| `bdata login` | 通过 Bright Data 进行身份验证 |
| `bdata version` | 显示 CLI 版本和系统信息 |

## 如何使用每条命令

### 抓取

抓取任意 URL，并自动绕过机器人检测、处理 CAPTCHA 和渲染 JS：

```bash
# Default: returns clean markdown
bdata scrape https://example.com

# Get raw HTML
bdata scrape https://example.com -f html

# Get structured JSON
bdata scrape https://example.com -f json

# Take a screenshot
bdata scrape https://example.com -f screenshot -o page.png

# Geo-targeted scrape from the US
bdata scrape https://amazon.com --country us

# Save to file
bdata scrape https://example.com -o page.md

# Async mode for heavy pages
bdata scrape https://example.com --async
```

### 搜索

搜索引擎提供结构化 JSON 输出（Google 返回解析后的自然搜索结果、广告、“其他用户还问了”和相关搜索）：

```bash
# Google search with formatted table
bdata search "web scraping best practices"

# Get raw JSON for piping
bdata search "typescript tutorials" --json

# Search Bing
bdata search "bright data pricing" --engine bing

# Localized search
bdata search "restaurants berlin" --country de --language de

# News search
bdata search "AI regulation" --type news

# Extract just URLs
bdata search "open source tools" --json | jq -r '.organic[].link'
```

### 管道（结构化数据提取）

从 40 多个平台提取结构化数据。这些操作会触发异步作业，并轮询到结果就绪：

```bash
# LinkedIn profile
bdata pipelines linkedin_person_profile "https://linkedin.com/in/username"

# Amazon product
bdata pipelines amazon_product "https://amazon.com/dp/B09V3KXJPB"

# Instagram profile
bdata pipelines instagram_profiles "https://instagram.com/username"

# Amazon search
bdata pipelines amazon_product_search "laptop" "https://amazon.com"

# YouTube comments (top 50)
bdata pipelines youtube_comments "https://youtube.com/watch?v=..." 50

# Google Maps reviews (last 7 days)
bdata pipelines google_maps_reviews "https://maps.google.com/..." 7

# Output as CSV
bdata pipelines amazon_product "https://amazon.com/dp/..." --format csv -o product.csv

# List all available pipeline types
bdata pipelines list
```

### 检查状态

对于异步作业（来自 `--async` 抓取或管道）：

```bash
# Quick status check
bdata status <job-id>

# Wait until complete
bdata status <job-id> --wait

# With custom timeout
bdata status <job-id> --wait --timeout 300
```

### 预算和区域

```bash
# Quick account balance
bdata budget

# Detailed balance with pending charges
bdata budget balance

# All zones cost/bandwidth
bdata budget zones

# Specific zone costs
bdata budget zone my_zone

# Date range filter
bdata budget zones --from 2024-01-01T00:00:00 --to 2024-02-01T00:00:00

# List all zones
bdata zones

# Zone details
bdata zones info cli_unlocker
```

### 配置

```bash
# View all config
bdata config

# Set defaults
bdata config set default_zone_unlocker my_zone
bdata config set default_format json
```

### 安装 AI 智能体技能

```bash
# Interactive picker — choose skills and target agents
bdata skill add

# Install a specific skill
bdata skill add scrape

# List available skills
bdata skill list
```

## 输出模式

每条命令都支持多种输出格式：

| 标志 | 效果 |
|------|--------|
| *（无）* | 带颜色、便于阅读的格式化输出 |
| `--json` | 向 stdout 输出紧凑 JSON |
| `--pretty` | 向 stdout 输出缩进 JSON |
| `-o <path>` | 写入文件（根据扩展名自动检测格式） |

通过管道传输时（stdout 不是 TTY），颜色和进度动画会自动禁用。

## 命令串联

CLI 适合通过管道串联：

```bash
# Search → extract first URL → scrape it
bdata search "top open source projects" --json \
  | jq -r '.organic[0].link' \
  | xargs bdata scrape

# Scrape and view with markdown reader
bdata scrape https://docs.github.com | glow -

# Amazon product data to CSV
bdata pipelines amazon_product "https://amazon.com/dp/xxx" --format csv > product.csv
```

## 环境变量

这些选项会覆盖已保存的配置：

| 变量 | 用途 |
|----------|---------|
| `BRIGHTDATA_API_KEY` | API 密钥（完全跳过登录） |
| `BRIGHTDATA_UNLOCKER_ZONE` | 默认网络解锁器区域 |
| `BRIGHTDATA_SERP_ZONE` | 默认 SERP 区域 |
| `BRIGHTDATA_POLLING_TIMEOUT` | 轮询超时时间（秒） |

## 故障排除

| 错误 | 修复方法 |
|-------|-----|
| 找不到 CLI | 使用 `npm i -g @brightdata/cli` 或 `curl -fsSL https://cli.brightdata.com/install.sh \| bash` 安装 |
| “未指定网络解锁器区域” | 运行 `bdata config set default_zone_unlocker <zone>` 或重新运行 `bdata login` |
| “API 密钥无效或已过期” | `bdata login` |
| “访问被拒绝” | 检查 Bright Data 控制面板中的区域权限 |
| “超出速率限制” | 等待并重试，或对大型作业使用 `--async` |
| 异步作业超时 | 使用 `--timeout 1200` 或 `BRIGHTDATA_POLLING_TIMEOUT=1200` 延长超时时间 |

## 核心设计原则

- **一次性身份验证**：执行 `bdata login` 后，一切都会自动完成。无需管理令牌，也无需传递密钥。
- **自动创建区域**：登录时自动创建 `cli_unlocker` 和 `cli_browser` 区域。
- **智能默认设置**：默认输出 Markdown、根据文件扩展名自动检测格式、仅在 TTY 中显示颜色。
- **适合管道处理**：JSON 输出 + jq 可用于自动化。管道中禁用颜色和进度动画。
- **支持异步**：大型作业可通过 `--async` + `status --wait` 在后台运行。
- **npm 软件包**：`@brightdata/cli`，可全局安装或通过 `npx` 使用。
