# Telegram AI 语音机器人

一个集成了 DeepSeek AI 和 MiniMax 语音合成的 Telegram 机器人，能够接收文本消息并回复智能文本和语音。

## 功能特性

- 🤖 **智能对话**: 使用 DeepSeek API 提供智能回复
- 🎵 **语音合成**: 使用 MiniMax TTS 将回复转换为语音
- 📱 **Telegram 集成**: 完整的 Telegram Bot 功能
- 🗂️ **文件管理**: 自动管理临时音频文件
- 📝 **日志记录**: 完整的操作日志和错误追踪
- ⚡ **异步处理**: 高效的消息处理流程

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
# Telegram Bot配置
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# MiniMax API配置
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
MINIMAX_BASE_URL=https://api.minimax.chat

# 其他配置
TEMP_DIR=./temp
MAX_AUDIO_DURATION=60
MAX_MESSAGE_LENGTH=4000
```

### 4. 获取 API 密钥

#### Telegram Bot Token
1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 命令创建新机器人
3. 按照提示设置机器人名称和用户名
4. 获取 Bot Token

#### DeepSeek API Key
1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册账号并登录
3. 在 API 管理页面创建 API Key

#### MiniMax API Key
1. 访问 [MiniMax 官网](https://www.minimax.chat/)
2. 注册账号并登录
3. 在 API 管理页面获取 API Key 和 Group ID

### 5. 启动机器人

```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

## Docker 部署

### 使用 Docker Compose（推荐）

1. **配置环境变量**
   
   复制并编辑环境变量文件：
   ```bash
   cp .env.example .env
   ```
   
   填入你的 API 密钥到 `.env` 文件中。

2. **构建并启动容器**
   
   ```bash
   # 构建并启动服务
   docker-compose up -d
   
   # 查看日志
   docker-compose logs -f
   
   # 停止服务
   docker-compose down
   ```

3. **管理容器**
   
   ```bash
   # 重启服务
   docker-compose restart
   
   # 查看服务状态
   docker-compose ps
   
   # 进入容器
   docker-compose exec telechat-bot sh
   ```

### 使用 Docker（手动）

1. **构建镜像**
   
   ```bash
   docker build -t telechat-bot .
   ```

2. **运行容器**
   
   ```bash
   docker run -d \
     --name telechat-bot \
     --restart unless-stopped \
     -v $(pwd)/data:/app/data \
     -v $(pwd)/logs:/app/logs \
     --env-file .env \
     telechat-bot
   ```

3. **查看日志**
   
   ```bash
   docker logs -f telechat-bot
   ```

### Docker 优势

- ✅ **环境一致性**: 确保在任何环境中都能正常运行
- ✅ **快速部署**: 一键启动，无需配置 Node.js 环境
- ✅ **资源隔离**: 容器化运行，不影响宿主机
- ✅ **数据持久化**: 自动挂载数据和日志目录
- ✅ **自动重启**: 服务异常时自动重启

## 服务器部署

### 🚀 一键部署（推荐）

我们提供了一键部署脚本，适用于 Ubuntu/Debian 系统：

```bash
# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/Jim-purch/telechat/main/deploy.sh | bash
```

或者手动下载后运行：

```bash
# 克隆项目
git clone https://github.com/Jim-purch/telechat.git
cd telechat

# 运行部署脚本
./deploy.sh
```

**一键部署脚本功能：**
- ✅ 自动检测系统环境
- ✅ 安装 Docker 和 Docker Compose
- ✅ 克隆项目代码
- ✅ 配置环境变量
- ✅ 构建并启动服务
- ✅ 创建系统服务（可选）
- ✅ 提供管理命令说明

### 📖 详细部署指南

如果您需要更详细的部署说明或遇到问题，请参考完整的服务器部署指南：

📖 **[服务器部署指南](DEPLOY.md)**

该指南包含：
- 🖥️ 服务器环境准备（Ubuntu/CentOS）
- 🐳 Docker 和 Docker Compose 安装
- 📁 项目文件上传方法
- ⚙️ 环境配置和部署步骤
- 🔧 系统服务配置
- 📊 监控和维护建议
- 🛡️ 安全配置指南
- 🚨 故障排除方案

## 使用方法

1. 在 Telegram 中找到你的机器人
2. 发送 `/start` 命令开始对话
3. 发送任何文本消息，机器人会：
   - 使用 DeepSeek AI 生成智能回复
   - 将回复转换为语音文件
   - 同时发送文本和语音回复

## 项目结构

```
telechat/
├── index.js                 # 主入口文件
├── package.json             # 项目配置和依赖
├── .env.example             # 环境变量模板
├── .gitignore              # Git 忽略文件
├── README.md               # 项目说明
├── services/               # 服务层
│   ├── deepseek.js         # DeepSeek API 服务
│   └── minimax.js          # MiniMax TTS 服务
├── utils/                  # 工具类
│   ├── fileManager.js      # 文件管理器
│   └── logger.js           # 日志记录器
├── temp/                   # 临时文件目录
└── logs/                   # 日志文件目录
```

## API 配置说明

### DeepSeek 配置

- `DEEPSEEK_API_KEY`: DeepSeek API 密钥
- `DEEPSEEK_BASE_URL`: API 基础 URL（默认：https://api.deepseek.com）

### MiniMax 配置

- `MINIMAX_API_KEY`: MiniMax API 密钥
- `MINIMAX_GROUP_ID`: MiniMax 组 ID
- `MINIMAX_BASE_URL`: API 基础 URL（默认：https://api.minimax.chat）

### 其他配置

- `TEMP_DIR`: 临时文件目录（默认：./temp）
- `MAX_AUDIO_DURATION`: 最大音频时长（秒）
- `MAX_MESSAGE_LENGTH`: 最大消息长度（字符）

## 可用的语音类型

MiniMax 支持多种语音类型：

- `female-shaonv`: 少女音（默认）
- `female-yujie`: 御姐音
- `male-qingshu`: 青叔音
- `male-laotie`: 老铁音
- `female-tianmei`: 甜美音
- `male-chunhou`: 醇厚音

## 故障排除

### 常见问题

1. **机器人无响应**
   - 检查 Telegram Bot Token 是否正确
   - 确认机器人已启动并正在运行
   - 查看控制台日志了解错误信息

2. **AI 回复失败**
   - 检查 DeepSeek API Key 是否有效
   - 确认 API 配额是否充足
   - 检查网络连接

3. **语音生成失败**
   - 检查 MiniMax API Key 和 Group ID
   - 确认 API 配额是否充足
   - 检查临时目录权限

### 日志查看

日志文件位于 `logs/` 目录：
- `bot.log`: 所有日志
- `error.log`: 错误日志

## 开发说明

### 添加新功能

1. 在相应的服务文件中添加新方法
2. 在 `index.js` 中集成新功能
3. 更新环境变量配置（如需要）
4. 添加相应的错误处理

### 代码规范

- 使用 ES6+ 语法
- 添加适当的注释
- 遵循异步/等待模式
- 实现完整的错误处理

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如果你觉得这个项目有用，请给它一个 ⭐️！