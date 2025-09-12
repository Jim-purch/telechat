# Docker 镜像离线部署指南

本指南将帮助您将 Docker 镜像打包并在没有网络连接的服务器上部署。

## 适用场景

- 服务器无法访问互联网
- 网络环境受限或不稳定
- 需要在多台服务器上快速部署
- 企业内网环境部署
- 避免重复下载基础镜像

## 步骤一：在本地构建并导出镜像

### 📦 方法一：使用自动化构建脚本（推荐）

#### 1. 一键构建离线部署包

项目提供了自动化构建脚本，可以一键生成完整的离线部署包：

```bash
# 运行构建脚本
./build-offline-package.sh
```

**脚本功能：**
- ✅ 自动构建 Docker 镜像
- ✅ 导出压缩的镜像文件
- ✅ 创建完整的部署包
- ✅ 包含一键部署脚本
- ✅ 自动生成说明文档
- ✅ 压缩打包便于传输

**生成的文件：**
```
ttelechat-offline-20240101_120000.tar.gz  # 完整部署包
├── telechat-bot.tar.gz                   # Docker镜像
├── docker-compose.yml                    # 容器编排配置
├── .env.example                          # 环境变量模板
├── offline-deploy.sh                     # 一键部署脚本
├── README.md                             # 项目说明
├── DOCKER_OFFLINE_DEPLOY.md              # 离线部署指南
└── README_OFFLINE.md                     # 离线包说明
```

#### 2. 传输部署包

```bash
# 上传到服务器
scp telechat-offline-*.tar.gz user@server:/path/to/deploy/

# 或使用其他传输方式（U盘、内网文件服务器等）
```

### 📦 方法二：手动构建并导出镜像

如果需要自定义构建过程，也可以手动操作：

#### 1. 构建 Docker 镜像

```bash
# 确保在项目根目录
cd /path/to/telechat

# 构建镜像
docker build -t telechat-bot:latest .

# 验证镜像构建成功
docker images | grep telechat-bot
```

#### 2. 导出 Docker 镜像

```bash
# 导出单个镜像
docker save -o telechat-bot.tar telechat-bot:latest

# 或者导出压缩镜像（推荐，文件更小）
docker save telechat-bot:latest | gzip > telechat-bot.tar.gz

# 查看导出文件大小
ls -lh telechat-bot.tar*
```

### 3. 导出所有相关镜像（可选）

如果需要包含基础镜像，可以一次性导出多个镜像：

```bash
# 查看所有相关镜像
docker images

# 导出多个镜像
docker save -o telechat-all-images.tar \
  telechat-bot:latest \
  node:18-alpine \
  alpine:latest

# 或者压缩导出
docker save telechat-bot:latest node:18-alpine alpine:latest | gzip > telechat-all-images.tar.gz
```

## 步骤二：传输镜像文件到服务器

### 方法一：使用 SCP

```bash
# 传输镜像文件
scp telechat-bot.tar.gz username@server-ip:/home/username/

# 传输项目配置文件
scp docker-compose.yml .env.example username@server-ip:/home/username/
```

### 方法二：使用 SFTP

```bash
# 连接到服务器
sftp username@server-ip

# 上传文件
put telechat-bot.tar.gz
put docker-compose.yml
put .env.example

# 退出
exit
```

### 方法三：使用 USB 或其他存储设备

将镜像文件复制到 USB 设备，然后在服务器上挂载并复制。

### 方法四：使用 rsync

```bash
# 同步文件到服务器
rsync -avz telechat-bot.tar.gz docker-compose.yml .env.example username@server-ip:/home/username/
```

## 步骤三：在服务器上导入并运行

### 1. 导入 Docker 镜像

```bash
# 登录到服务器
ssh username@server-ip

# 导入镜像
docker load -i telechat-bot.tar.gz
# 或者如果是未压缩的
docker load -i telechat-bot.tar

# 验证镜像导入成功
docker images | grep telechat-bot
```

### 2. 准备配置文件

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
# 或使用 vim
vim .env
```

### 3. 修改 docker-compose.yml（如果需要）

如果使用了自定义镜像名称，需要修改 docker-compose.yml：

```yaml
version: '3.8'

services:
  telechat-bot:
    image: telechat-bot:latest  # 确保镜像名称匹配
    container_name: telechat-bot
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - telechat-network
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Health check')"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  telechat-network:
    driver: bridge
```

### 4. 启动服务

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 步骤四：创建离线部署脚本

为了简化部署过程，可以创建一个自动化脚本：

```bash
# 创建部署脚本
cat > offline-deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 开始离线部署 Telechat Bot..."

# 检查文件是否存在
if [[ ! -f "telechat-bot.tar.gz" ]]; then
    echo "❌ 错误：未找到 telechat-bot.tar.gz 文件"
    exit 1
fi

if [[ ! -f "docker-compose.yml" ]]; then
    echo "❌ 错误：未找到 docker-compose.yml 文件"
    exit 1
fi

# 导入镜像
echo "📦 导入 Docker 镜像..."
docker load -i telechat-bot.tar.gz

# 检查环境变量文件
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        echo "⚠️  请编辑 .env 文件并填入您的 API 密钥"
        echo "按回车键继续编辑..."
        read
        nano .env || vim .env || vi .env
    else
        echo "❌ 错误：未找到环境变量文件"
        exit 1
    fi
fi

# 创建必要的目录
mkdir -p data logs

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if docker-compose ps | grep -q "Up"; then
    echo "✅ 部署成功！服务正在运行"
    echo ""
    echo "管理命令："
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
else
    echo "❌ 部署失败，请查看日志："
    docker-compose logs
fi
EOF

# 添加执行权限
chmod +x offline-deploy.sh
```

## 高级功能

### 1. 批量部署脚本

创建一个脚本来同时部署到多台服务器：

```bash
#!/bin/bash
# batch-deploy.sh

SERVERS=("server1-ip" "server2-ip" "server3-ip")
USERNAME="your-username"

for server in "${SERVERS[@]}"; do
    echo "部署到服务器: $server"
    
    # 传输文件
    scp telechat-bot.tar.gz docker-compose.yml .env.example offline-deploy.sh $USERNAME@$server:/home/$USERNAME/
    
    # 远程执行部署
    ssh $USERNAME@$server 'cd /home/'$USERNAME' && ./offline-deploy.sh'
    
    echo "服务器 $server 部署完成"
done
```

### 2. 镜像版本管理

```bash
# 为镜像添加版本标签
docker tag telechat-bot:latest telechat-bot:v1.0.0

# 导出特定版本
docker save telechat-bot:v1.0.0 | gzip > telechat-bot-v1.0.0.tar.gz

# 在服务器上导入并使用特定版本
docker load -i telechat-bot-v1.0.0.tar.gz
```

### 3. 镜像清理

```bash
# 清理旧镜像
docker image prune -f

# 清理未使用的镜像
docker system prune -a -f
```

## 故障排除

### 常见问题

1. **镜像导入失败**
   ```bash
   # 检查文件完整性
   file telechat-bot.tar.gz
   
   # 重新导入
   gunzip telechat-bot.tar.gz
   docker load -i telechat-bot.tar
   ```

2. **容器启动失败**
   ```bash
   # 查看详细错误
   docker-compose logs
   
   # 检查镜像是否存在
   docker images
   
   # 手动运行容器测试
   docker run --rm telechat-bot:latest node --version
   ```

3. **权限问题**
   ```bash
   # 修复目录权限
   sudo chown -R $USER:$USER data/ logs/
   chmod 755 data/ logs/
   ```

4. **磁盘空间不足**
   ```bash
   # 检查磁盘空间
   df -h
   
   # 清理 Docker 缓存
   docker system prune -a -f
   ```

## 性能优化

### 1. 镜像大小优化

```dockerfile
# 在 Dockerfile 中使用多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. 压缩优化

```bash
# 使用更高的压缩比
docker save telechat-bot:latest | gzip -9 > telechat-bot.tar.gz

# 或使用 xz 压缩（更小但更慢）
docker save telechat-bot:latest | xz -9 > telechat-bot.tar.xz
```

## 安全建议

1. **镜像扫描**
   ```bash
   # 扫描镜像漏洞（如果有 Docker Scout）
   docker scout cves telechat-bot:latest
   ```

2. **文件传输安全**
   - 使用 SSH 密钥认证
   - 验证文件完整性（MD5/SHA256）
   - 加密敏感配置文件

3. **运行时安全**
   ```bash
   # 以非 root 用户运行
   docker run --user 1001:1001 telechat-bot:latest
   ```

---

通过这种离线部署方式，您可以在任何环境中快速部署 Telegram AI 机器人，无需依赖网络连接！