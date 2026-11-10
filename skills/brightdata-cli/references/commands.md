# Bright Data CLI：完整命令参考

**软件包：** `@brightdata/cli` | **命令：** `brightdata` / `bdata`（简写）| **要求：** Node.js >= 20

## 安装

```bash
# macOS / Linux
curl -fsSL https://cli.brightdata.com/install.sh | bash

# Any platform
npm install -g @brightdata/cli

# Without installing
npx --yes --package @brightdata/cli brightdata <command>
```

---

## 全局选项

这些标志适用于任何命令：

| 标志 | 说明 |
|------|-------------|
| `-k, --api-key <key>` | 覆盖本次请求的 API 密钥 |
| `--timing` | 显示请求计时信息 |
| `-v, --version` | 显示 CLI 版本 |

---

## `bdata login`

通过 Bright Data 进行身份验证。默认打开浏览器进行 OAuth。

| 标志 | 说明 |
|------|-------------|
| `-k, --api-key <key>` | 直接使用 API 密钥（跳过浏览器） |
| `-c, --customer-id <id>` | Bright Data 账号 ID（可选） |
| `-d, --device` | 为 SSH／无头环境使用设备流程 |

**登录时会发生什么：**
1. 打开浏览器进行 OAuth（或使用设备流程／直接使用 API 密钥）
2. 验证 API 密钥
3. 在本地保存凭据（`~/.config/brightdata-cli/credentials.json`）
4. 检查所需区域（`cli_unlocker`、`cli_browser`）
5. 自动创建缺失的区域
6. 如果尚未配置默认区域，则将 `cli_unlocker` 设为默认区域

```bash
bdata login                        # Browser OAuth (recommended)
bdata login --device               # Headless/SSH environments
bdata login --api-key <key>        # Direct API key
```

---

## `bdata logout`

清除已保存的凭据。

```bash
bdata logout
```

---

## `bdata scrape <url>`

使用 Bright Data 的网络解锁器抓取任意 URL。自动处理 CAPTCHA、JavaScript 渲染和反机器人防护。

| 标志 | 说明 |
|------|-------------|
| `-f, --format <fmt>` | `markdown`（默认）、`html`、`screenshot`、`json` |
| `--country <code>` | 用于地理定位的 ISO 国家／地区代码（例如 `us`、`de`、`jp`） |
| `--zone <name>` | 网络解锁器区域名称 |
| `--mobile` | 使用移动端 User-Agent |
| `--async` | 异步提交并返回快照 ID |
| `-o, --output <path>` | 将输出写入文件 |
| `--json` | 强制输出 JSON |
| `--pretty` | 美化 JSON 输出 |

```bash
bdata scrape https://news.ycombinator.com
bdata scrape https://example.com -f html
bdata scrape https://amazon.com -f json --country us -o product.json
bdata scrape https://example.com -f screenshot -o page.png
bdata scrape https://example.com --async
bdata scrape https://docs.github.com | glow -
```

---

## `bdata search <query>`

通过 Bright Data 的搜索引擎 API 搜索 Google、Bing 或 Yandex。

Google 返回包含以下内容的结构化 JSON：自然搜索结果、广告、“其他用户还问了”、相关搜索。Bing/Yandex 默认返回 Markdown。

| 标志 | 说明 |
|------|-------------|
| `--engine <name>` | `google`（默认）、`bing`、`yandex` |
| `--country <code>` | 本地化结果（例如 `us`、`de`） |
| `--language <code>` | 语言代码（例如 `en`、`fr`） |
| `--page <n>` | 页码，从 0 开始（默认：`0`） |
| `--type <type>` | `web`（默认）、`news`、`images`、`shopping` |
| `--device <type>` | `desktop`, `mobile` |
| `--zone <name>` | SERP 区域名称 |
| `-o, --output <path>` | 将输出写入文件 |
| `--json` | 强制输出 JSON |
| `--pretty` | 美化 JSON 输出 |

```bash
bdata search "typescript best practices"
bdata search "restaurants berlin" --country de --language de
bdata search "AI regulation" --type news
bdata search "web scraping" --page 1
bdata search "open source scraping" --json | jq -r '.organic[].link'
bdata search "bright data pricing" --engine bing
```

---

## `bdata pipelines <type> [params...] [options]`

从 40 多个平台提取结构化数据。触发异步采集作业，轮询到就绪后返回结果。

| 标志 | 说明 |
|------|-------------|
| `--format <fmt>` | `json`（默认）、`csv`、`ndjson`、`jsonl` |
| `--timeout <seconds>` | 轮询超时（默认：`600`） |
| `-o, --output <path>` | 将输出写入文件 |
| `--json` | 强制输出 JSON |
| `--pretty` | 美化 JSON 输出 |

```bash
bdata pipelines list                                           # List all types
bdata pipelines linkedin_person_profile "https://linkedin.com/in/username"
bdata pipelines amazon_product "https://amazon.com/dp/B09V3KXJPB" --format csv -o product.csv
bdata pipelines instagram_profiles "https://instagram.com/username"
bdata pipelines amazon_product_search "laptop" "https://amazon.com"
bdata pipelines google_maps_reviews "https://maps.google.com/..." 7
bdata pipelines youtube_comments "https://youtube.com/watch?v=..." 50
```

有关类型及其参数的完整列表，请参阅 [pipelines.md](pipelines.md)。

---

## `bdata status <job-id>`

检查异步快照作业的状态。

| 标志 | 说明 |
|------|-------------|
| `--wait` | 轮询到作业完成 |
| `--timeout <seconds>` | 轮询超时（默认：`600`） |
| `-o, --output <path>` | 将输出写入文件 |
| `--json` / `--pretty` | JSON 输出 |

```bash
bdata status s_abc123xyz
bdata status s_abc123xyz --wait --pretty
bdata status s_abc123xyz --wait --timeout 300
```

---

## `bdata zones`

列出并检查 Bright Data 代理区域。

```bash
bdata zones                        # List all active zones
bdata zones info <name>            # Full details for a zone
bdata zones --json -o zones.json   # Export as JSON
bdata zones info my_zone --pretty  # Pretty-print zone info
```

---

## `bdata budget`

查看账号余额以及各区域的费用／带宽。只读。

| 子命令 | 说明 |
|------------|-------------|
| *（无）* | 快速查看账号余额 |
| `balance` | 余额 + 待处理费用 |
| `zones` | 所有区域的费用和带宽表 |
| `zone <name>` | 一个区域的详细费用和带宽 |

| 标志 | 说明 |
|------|-------------|
| `--from <datetime>` | 日期范围开始时间（例如 `2024-01-01T00:00:00`） |
| `--to <datetime>` | 日期范围结束时间 |
| `--json` / `--pretty` | JSON 输出 |

```bash
bdata budget
bdata budget balance
bdata budget zones
bdata budget zone my_zone
bdata budget zones --from 2024-01-01T00:00:00 --to 2024-02-01T00:00:00
```

---

## `bdata config`

查看和管理 CLI 配置。

| 子命令 | 说明 |
|------------|-------------|
| *（无）* | 显示所有配置 |
| `get <key>` | 获取单个值 |
| `set <key> <value>` | 设置值 |

| 配置键 | 说明 |
|------------|-------------|
| `default_zone_unlocker` | `scrape` 和 `search` 的默认区域 |
| `default_zone_serp` | 仅覆盖 `search` 的区域 |
| `default_format` | 默认输出格式：`markdown` 或 `json` |
| `api_url` | 覆盖 API 基础 URL |

```bash
bdata config
bdata config set default_zone_unlocker my_zone
bdata config set default_format json
bdata config get default_zone_unlocker
```

---

## `bdata init`

交互式设置向导。引导完成身份验证、区域选择和默认配置。

| 标志 | 说明 |
|------|-------------|
| `--skip-auth` | 跳过身份验证步骤 |
| `-k, --api-key <key>` | 直接提供 API 密钥 |

```bash
bdata init
```

---

## `bdata skill`

将 Bright Data AI 智能体技能安装到编程智能体中（Claude Code、Cursor、Copilot 等）。

| 子命令 | 说明 |
|------------|-------------|
| `add` | 交互式选择器：选择技能和目标智能体 |
| `add <name>` | 直接安装特定技能 |
| `list` | 列出所有可用技能 |

可用技能：`search`、`scrape`、`data-feeds`、`bright-data-mcp`、`bright-data-best-practices`

```bash
bdata skill add              # Interactive
bdata skill add scrape       # Direct install
bdata skill list             # See what's available
```

---

## 配置存储

| 操作系统 | 路径 |
|----|------|
| macOS | `~/Library/Application Support/brightdata-cli/` |
| Linux | `~/.config/brightdata-cli/` |
| Windows | `%APPDATA%\brightdata-cli\` |

两个文件：
- `credentials.json`：API 密钥（模式 0o600）
- `config.json`：区域、输出格式、偏好设置

优先级顺序：CLI 标志 > 环境变量 > config.json > 默认值
