# TeleChat — Telegram AI 语音机器人

一个基于 Node.js + Docker 的 Telegram AI 机器人，支持 **DeepSeek** 与 **Moonshot (Kimi)** 多模型切换，并集成 **MiniMax TTS** 语音合成。机器人接收用户的**文本消息**，为每位用户维护独立会话记忆与个性化配置，并同时返回 **文本 + 语音** 双重回复。

> [!NOTE]
> 当前版本仅接收**文本消息**作为输入（非文本消息会被忽略），输出为**文本回复 + Telegram 语音消息**双重回复。

## 功能特性

- 🧠 **多模型切换**: 内置 **DeepSeek** (`deepseek-chat`，默认) 与 **Moonshot / Kimi** (`kimi-k2-0905-preview`)，支持用户按需实时切换
- 🎵 **MiniMax TTS 语音回复**: 使用 MiniMax T2A V2 (`speech-2.5-turbo-preview`) 将 AI 回复合成为语音并通过 Telegram 发送
- 💬 **文本 + 语音双重回复**: 发送文本消息后，机器人会依次返回文本回复和对应的语音消息
- 👤 **用户级配置持久化**: 按 Telegram 用户独立保存所选 AI 模型、语音 ID、系统提示词及上下文窗口大小（存储于 `data/userConfigs.json`）
- 🗂️ **独立会话记忆**: 按用户维护多轮对话上下文（存储于 `data/sessions.json`），支持随时调整上下文条数或清空历史
- 🧹 **自动清理与日志**: 自动清理临时音频文件，完整记录运行日志与错误日志
- 🐳 **Docker 与离线部署**: 提供 Docker Compose、一键部署脚本及离线打包方案

## 机器人命令

启动后机器人会自动注册以下 Telegram 命令菜单：

| 命令 | 说明 |
|------|------|
| `/start` | 开始使用机器人并查看欢迎信息与帮助 |
| `/config` | 查看当前用户的配置（AI 模型、语音 ID、系统提示词、上下文条数、语音模型） |
| `/models` | 查看可用的 AI 模型列表（`deepseek`、`moonshot`） |
| `/set_model <model>` | 切换当前用户的 AI 模型（`deepseek` 或 `moonshot`） |
| `/voices` | 查看可用语音列表（来自 `data/availableVoices.json`） |
| `/set_voice <voice_id>` | 设置语音 ID |
| `/set_prompt <prompt>` | 自定义系统提示词 |
| `/set_context <count>` | 设置上下文条数（范围：`1`–`20`） |
| `/clear_history` | 清除当前用户的对话历史 |
| `/reset_config` | 将当前用户配置重置为默认值 |

## 快速开始

### 1. 环境要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API 密钥：

```env
# Telegram Bot 配置（必填）
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# DeepSeek API 配置（必填，默认模型）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Moonshot (Kimi) API 配置（可选，启用 moonshot 模型切换时必填）
MOONSHOT_API_KEY=your_moonshot_api_key_here
MOONSHOT_BASE_URL=https://api.moonshot.cn

# MiniMax TTS API 配置（必填）
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
MINIMAX_BASE_URL=https://api.minimaxi.chat

# 其他配置
TEMP_DIR=./temp
MAX_AUDIO_DURATION=60
MAX_MESSAGE_LENGTH=4000
```

### 4. 获取 API 密钥

- **Telegram Bot Token**：在 Telegram 中联系 `@BotFather`，发送 `/newbot` 创建机器人并获取 Token
- **DeepSeek API Key**：前往 [DeepSeek 开放平台](https://www.deepseek.com/) 创建 API Key
- **Moonshot API Key（可选）**：前往 [Moonshot AI 开放平台](https://platform.moonshot.cn/) 创建 API Key，用于切换到 Kimi 模型
- **MiniMax API Key & Group ID**：前往 [MiniMax 开放平台](https://www.minimaxi.com/) 获取 API Key 与 Group ID

### 5. 启动机器人

```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

## 使用方法

1. 在 Telegram 中打开你的机器人并发送 `/start`
2. 可选：使用 `/models`、`/set_model` 切换 DeepSeek 或 Moonshot (Kimi)，使用 `/voices`、`/set_voice` 选择音色，或用 `/set_prompt` 与 `/set_context` 定制助手行为
3. 直接发送**文本消息**，机器人会：
   - 读取你的个人配置与历史对话上下文
   - 调用当前选择的 AI 模型（DeepSeek 或 Moonshot）生成回复
   - 调用 MiniMax TTS 将回复合成为语音文件
   - 同时发送**文本回复**与**语音消息**，并自动清理临时音频

## Docker 部署

### 使用 Docker Compose（推荐）

1. 复制并填写环境变量文件：

```bash
cp .env.example .env
```

2. 构建并启动容器：

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

3. 常用管理命令：

```bash
docker-compose restart
docker-compose ps
docker-compose exec telechat-bot sh
```

### 使用 Docker（手动）

```bash
docker build -t telechat-bot .

docker run -d \
  --name telechat-bot \
  --restart unless-stopped \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  telechat-bot
```

### 离线部署与服务器部署

- 离线打包部署：运行 `./build-offline-package.sh` 生成离线包，详见 [DOCKER_OFFLINE_DEPLOY.md](DOCKER_OFFLINE_DEPLOY.md)
- 服务器一键部署：运行 `./deploy.sh`，详细步骤见 [DEPLOY.md](DEPLOY.md)

## 项目结构

```text
telechat/
├── index.js                 # 主入口与 Telegram 命令/消息处理
├── package.json             # 项目配置与依赖
├── .env.example             # 环境变量模板
├── Dockerfile               # Docker 镜像构建文件
├── docker-compose.yml       # Docker Compose 编排配置
├── data/
│   ├── availableVoices.json # 可用语音列表（供 /voices 命令读取）
│   ├── userConfigs.json     # 用户个性化配置（运行时更新）
│   └── sessions.json        # 用户对话历史（运行时生成）
├── services/
│   ├── deepseek.js          # DeepSeek 对话服务
│   ├── moonshot.js          # Moonshot (Kimi) 对话服务
│   ├── minimax.js           # MiniMax T2A V2 语音合成服务
│   ├── userConfig.js        # 用户级配置管理
│   └── sessionManager.js    # 用户级会话记忆管理
├── utils/
│   ├── fileManager.js       # 临时音频文件管理与清理
│   └── logger.js            # 日志记录器
├── temp/                    # 临时音频目录
└── logs/                    # 运行与错误日志目录
```

## 故障排除

1. **机器人无响应**：检查 `TELEGRAM_BOT_TOKEN`、网络连通性以及 `logs/` 中的日志输出
2. **AI 回复失败**：检查 `DEEPSEEK_API_KEY`（或切换至 Moonshot 时的 `MOONSHOT_API_KEY`）是否有效及配额是否充足
3. **语音生成失败**：检查 `MINIMAX_API_KEY`、`MINIMAX_GROUP_ID` 与 `MINIMAX_BASE_URL` 配置，并确认 `temp/` 目录具备读写权限

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
