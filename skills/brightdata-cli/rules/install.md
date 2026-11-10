---
name: brightdata-cli-installation
description: |
  Install the Bright Data CLI and handle authentication errors.
---

# Bright Data CLI 安装

## 快速安装

**macOS / Linux：**
```bash
curl -fsSL https://cli.brightdata.com/install.sh | bash
```

**任意平台（需要 Node.js >= 20）：**
```bash
npm install -g @brightdata/cli
```

**无需安装（一次性使用）：**
```bash
npx --yes --package @brightdata/cli brightdata <command>
```

## 验证安装

检查是否已安装并通过身份验证：

```bash
bdata config
```

## 身份验证

如果尚未通过身份验证，请运行：

```bash
bdata login
```

这将打开浏览器进行安全的 OAuth 身份验证。登录后：
1. API 密钥保存在本地（之后无需再次输入）
2. 自动创建所需的代理区域（`cli_unlocker`、`cli_browser`）
3. 设置默认配置

对于没有浏览器的无头／SSH 环境：
```bash
bdata login --device
```

直接使用 API 密钥进行身份验证（非交互式）：
```bash
bdata login --api-key <key>
```

## 如果身份验证失败，请按以下错误处理说明操作：

如果运行 `bdata login` 后，任何命令返回身份验证错误（例如“未通过身份验证”“未授权”“API 密钥”），请使用提问工具（如果可用）：

**问题：**“你希望如何通过 Bright Data 进行身份验证？”

**选项：**

1. **通过浏览器登录（推荐）**：打开浏览器通过 Bright Data 进行身份验证
2. **通过设备流程登录**：适用于 SSH／无头环境
3. **手动输入 API 密钥**：粘贴来自 brightdata.com 的现有 API 密钥

### 如果用户选择浏览器登录：

运行 `bdata login` 自动打开浏览器。等待用户确认已完成身份验证，然后重试原始命令。

### 如果用户选择设备流程：

运行 `bdata login --device`，并引导用户完成设备代码流程。

### 如果用户选择手动输入 API 密钥：

询问其 API 密钥，然后运行：

```bash
bdata login --api-key "<their-key>"
```

或者设置环境变量：

```bash
export BRIGHTDATA_API_KEY="<their-key>"
```

告诉用户将此 export 添加到 `~/.zshrc` 或 `~/.bashrc` 以永久保存，然后重试原始命令。

## 故障排除

### 找不到命令

如果安装后找不到 `bdata` 命令：

1. 确保 npm 全局 bin 目录位于 PATH 中
2. 尝试：`npx --yes --package @brightdata/cli brightdata --version`
3. 或重新安装：`npm install -g @brightdata/cli`

### 权限错误

如果安装期间出现权限错误：

```bash
# Option 1: Use the curl installer (recommended)
curl -fsSL https://cli.brightdata.com/install.sh | bash

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
# Add the export to your shell profile
```

### 区域错误

如果出现“未指定网络解锁器区域”：

```bash
bdata config set default_zone_unlocker <zone>
# Or re-run login to auto-create zones:
bdata login
```
