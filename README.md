# opencode-brightdata

适用于 [Bright Data](https://www.bright.cn/) 的 OpenCode 插件：通过 [Bright Data CLI](https://github.com/nichochar/brightdata-cli)，为你的 AI 智能体提供可靠的网页爬虫、搜索及来自 40 多个平台的结构化数据提取功能。

**免费套餐：每月 5,000 次请求**，适用于搜索、抓取、管道等所有命令。无需信用卡。

## 安装

将插件添加到你的 `opencode.json`（或全局 `~/.config/opencode/opencode.json`）：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@brightdata/opencode-brightdata"]
}
```

然后安装 Bright Data CLI：

```bash
# macOS / Linux
curl -fsSL https://cli.brightdata.com/install.sh | bash

# Or via npm (any platform)
npm install -g @brightdata/cli
```

## 身份验证

首次使用时，智能体会提示你进行身份验证。你也可以提前设置：

```bash
# Browser login (recommended)
bdata login

# Or set an API key
export BRIGHTDATA_API_KEY=your-api-key
```

在 [brightdata.com](https://www.bright.cn/cp) 获取 API 密钥。

如果你的环境中设置了 `BRIGHTDATA_API_KEY`，插件会自动将其传递给 shell 命令。

## 功能

此插件会在 OpenCode 中注册 Bright Data 技能。安装后，智能体可以：

- **搜索** Google、Bing 和 Yandex，并返回结构化 JSON 结果
- **抓取**任意网页，获取整洁的 Markdown、HTML、JSON 或屏幕截图，并自动绕过机器人检测和破解验证码
- **管道**：从 Amazon、LinkedIn、Instagram、TikTok、YouTube、Reddit 等 40 多个平台提取结构化数据
- **构建爬虫工具**：通过引导式六阶段工作流创建生产就绪型抓取工具
- **MCP 集成**：提供 60 多种工具，用于抓取、搜索、电商、社交媒体和浏览器自动化
- **设计镜像**：复刻任意网站的视觉设计系统
- **最佳实践**：编写 Bright Data 代码时自动加载 API 参考
- **Python SDK**：提供 `brightdata-sdk` 软件包的使用指南

所有输出都会写入 `.brightdata/` 目录，以避免上下文被大量内容淹没。

## 链接

- [Bright Data CLI 文档](https://docs.brightdata.com/toolkits/brightdata-cli)
- [Bright Data CLI GitHub](https://github.com/nichochar/brightdata-cli)
- [OpenCode 插件文档](https://opencode.ai/docs/plugins)

## 许可证

MIT
