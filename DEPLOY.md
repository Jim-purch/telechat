# 服务器部署指南

本指南将帮助您将 Telegram AI 机器人部署到您的服务器上。

## 前置要求

### 服务器环境
- Linux 服务器（推荐 Ubuntu 20.04+ 或 CentOS 8+）
- 至少 1GB RAM
- 至少 2GB 可用磁盘空间
- 稳定的网络连接

### 必需软件
- Docker
- Docker Compose
- Git（可选，用于代码更新）

## 步骤一：准备服务器环境

### 1. 安装 Docker

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt update

# 安装必要的包
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

**CentOS/RHEL:**
```bash
# 安装必要的包
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install docker-ce docker-ce-cli containerd.io

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 配置用户权限（可选）

```bash
# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行以下命令使权限生效
newgrp docker
```

## 私有仓库特别说明

如果您的项目是私有仓库，需要进行额外的认证配置：

### 1. 生成 GitHub 个人访问令牌

1. 登录 GitHub，进入 Settings > Developer settings > Personal access tokens
2. 点击 "Generate new token (classic)"
3. 设置令牌名称和过期时间
4. 选择权限范围（至少需要 `repo` 权限）
5. 生成并保存令牌（只显示一次）

### 2. 配置 SSH 密钥（推荐）

```bash
# 生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 启动 SSH 代理
eval "$(ssh-agent -s)"

# 添加私钥到 SSH 代理
ssh-add ~/.ssh/id_rsa

# 显示公钥内容
cat ~/.ssh/id_rsa.pub
```

然后将公钥添加到 GitHub：
1. 复制公钥内容
2. 进入 GitHub Settings > SSH and GPG keys
3. 点击 "New SSH key"
4. 粘贴公钥并保存

### 3. 测试连接

```bash
# 测试 SSH 连接
ssh -T git@github.com

# 应该看到类似输出：
# Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

## 步骤二：上传项目文件

### 方法一：使用 Git（推荐）

#### 公开仓库
```bash
# 在服务器上克隆项目
git clone https://github.com/Jim-purch/telechat.git
cd telechat
```

#### 私有仓库

**选项 1：使用 SSH 密钥（推荐）**
```bash
# 首先配置 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 将公钥添加到 GitHub SSH Keys
cat ~/.ssh/id_rsa.pub

# 克隆私有仓库
git clone git@github.com:Jim-purch/telechat.git
cd telechat
```

**选项 2：使用个人访问令牌**
```bash
# 使用个人访问令牌克隆
git clone https://your-token@github.com/Jim-purch/telechat.git
cd telechat
```

**选项 3：使用用户名和密码（不推荐）**
```bash
# GitHub 已不支持密码认证，请使用上述方法
```

### 方法二：使用 SCP 上传

**在本地机器上执行：**
```bash
# 打包项目文件
tar -czf telechat.tar.gz --exclude=node_modules --exclude=.git --exclude=logs --exclude=temp .

# 上传到服务器
scp telechat.tar.gz username@your-server-ip:/home/username/
```

**在服务器上执行：**
```bash
# 解压文件
tar -xzf telechat.tar.gz
cd telechat

# 检查并修复主机目录权限
sudo chown -R 1001:1001 ./data ./logs
sudo chmod -R 777 ./data ./logs
```

### 方法三：使用 SFTP

使用 FileZilla、WinSCP 等工具将项目文件夹上传到服务器。

## 步骤三：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
nano .env
# 或使用 vim
vim .env
```

**填入您的 API 密钥：**
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

# Moonshot API配置（可选）
MOONSHOT_API_KEY=your_moonshot_api_key_here
MOONSHOT_BASE_URL=https://api.moonshot.cn
```

## 步骤四：部署应用

### 1. 构建并启动服务

```bash
# 构建并启动容器
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 验证部署

```bash
# 检查容器是否正在运行
docker ps

# 查看应用日志
docker-compose logs telechat-bot

# 检查健康状态
docker-compose exec telechat-bot node -e "console.log('Health check')"
```

## 步骤五：配置系统服务（可选）

为了确保服务器重启后自动启动，可以创建系统服务：

```bash
# 创建服务文件
sudo nano /etc/systemd/system/telechat.service
```

**服务文件内容：**
```ini
[Unit]
Description=Telechat Bot Docker Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/your/telechat
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
sudo systemctl enable telechat.service
sudo systemctl start telechat.service

# 检查服务状态
sudo systemctl status telechat.service
```

## 常用管理命令

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec telechat-bot sh
```

### 更新应用
```bash
# 拉取最新代码（如果使用 Git）
git pull origin main

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像
docker image prune -f
```

### 数据备份
```bash
# 备份数据目录
tar -czf telechat-backup-$(date +%Y%m%d).tar.gz data/ logs/

# 恢复数据
tar -xzf telechat-backup-YYYYMMDD.tar.gz
```

## 安全建议

### 1. 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 定期更新
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
sudo yum update -y                       # CentOS/RHEL

# 更新 Docker 镜像
docker-compose pull
docker-compose up -d
```

### 3. 监控和日志
```bash
# 设置日志轮转
sudo nano /etc/logrotate.d/telechat
```

**日志轮转配置：**
```
/path/to/telechat/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## 故障排除

### 常见问题

1. **容器无法启动**
   ```bash
   # 检查 Docker 服务状态
   sudo systemctl status docker
   
   # 查看详细错误信息
   docker-compose logs
   ```

2. **API 连接失败**
   ```bash
   # 检查网络连接
   docker-compose exec telechat-bot ping api.deepseek.com
   
   # 检查环境变量
   docker-compose exec telechat-bot env | grep API
   ```

3. **权限问题**
   ```bash
   # 检查文件权限
   ls -la data/ logs/
   
   # 修复权限
   sudo chown -R 1001:1001 data/ logs/
   ```

4. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   docker stats
   
   # 清理不用的容器和镜像
   docker system prune -f
   ```

## 监控和维护

### 1. 设置监控脚本
```bash
#!/bin/bash
# monitor.sh
if ! docker-compose ps | grep -q "Up"; then
    echo "Telechat service is down, restarting..."
    docker-compose restart
    echo "Service restarted at $(date)" >> /var/log/telechat-monitor.log
fi
```

### 2. 添加到定时任务
```bash
# 编辑 crontab
crontab -e

# 添加监控任务（每5分钟检查一次）
*/5 * * * * /path/to/monitor.sh
```

## 性能优化

### 1. Docker 配置优化
```bash
# 编辑 Docker 配置
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

### 2. 系统优化
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

---

部署完成后，您的 Telegram AI 机器人就可以在服务器上稳定运行了！如果遇到问题，请查看日志文件或参考故障排除部分。