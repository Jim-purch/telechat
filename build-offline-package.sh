#!/bin/bash

# Telechat Bot 离线部署包构建脚本
# 此脚本将构建 Docker 镜像并创建完整的离线部署包

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色信息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
IMAGE_NAME="telechat-bot"
IMAGE_TAG="latest"
PACKAGE_DIR="telechat-offline-package"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="telechat-offline-${TIMESTAMP}"

echo "🚀 Telechat Bot 离线部署包构建工具"
echo "===================================="
echo ""

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行，请启动 Docker"
        exit 1
    fi
    
    print_success "Docker 环境检查通过"
}

# 检查项目文件
check_project_files() {
    local required_files=("Dockerfile" "docker-compose.yml" "package.json" ".env.example")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_error "缺少必需文件: $file"
            exit 1
        fi
    done
    
    print_success "项目文件检查通过"
}

# 构建 Docker 镜像
build_image() {
    print_info "开始构建 Docker 镜像..."
    
    # 构建镜像
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" . || {
        print_error "Docker 镜像构建失败"
        exit 1
    }
    
    # 验证镜像
    if docker images | grep -q "${IMAGE_NAME}"; then
        print_success "Docker 镜像构建成功"
        docker images | grep "${IMAGE_NAME}"
    else
        print_error "Docker 镜像验证失败"
        exit 1
    fi
}

# 导出镜像
export_image() {
    print_info "导出 Docker 镜像..."
    
    # 创建临时目录
    mkdir -p "temp_export"
    
    # 导出镜像（压缩）
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "temp_export/${IMAGE_NAME}.tar.gz" || {
        print_error "镜像导出失败"
        exit 1
    }
    
    # 检查文件大小
    local file_size=$(du -h "temp_export/${IMAGE_NAME}.tar.gz" | cut -f1)
    print_success "镜像导出成功，文件大小: $file_size"
}

# 创建部署包
create_package() {
    print_info "创建离线部署包..."
    
    # 创建包目录
    rm -rf "$PACKAGE_NAME"
    mkdir -p "$PACKAGE_NAME"
    
    # 复制镜像文件
    cp "temp_export/${IMAGE_NAME}.tar.gz" "$PACKAGE_NAME/"
    
    # 复制配置文件
    cp docker-compose.yml "$PACKAGE_NAME/"
    cp .env.example "$PACKAGE_NAME/"
    
    # 复制文档
    cp README.md "$PACKAGE_NAME/" 2>/dev/null || true
    cp DOCKER_OFFLINE_DEPLOY.md "$PACKAGE_NAME/" 2>/dev/null || true
    
    # 创建离线部署脚本
    cat > "$PACKAGE_NAME/offline-deploy.sh" << 'EOF'
#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Telechat Bot 离线部署脚本"
echo "============================="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker 服务未运行，请启动 Docker"
    exit 1
fi

# 检查文件
if [[ ! -f "telechat-bot.tar.gz" ]]; then
    print_error "未找到 telechat-bot.tar.gz 文件"
    exit 1
fi

if [[ ! -f "docker-compose.yml" ]]; then
    print_error "未找到 docker-compose.yml 文件"
    exit 1
fi

# 导入镜像
print_info "导入 Docker 镜像..."
docker load -i telechat-bot.tar.gz

# 检查环境变量文件
if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        print_warning "请编辑 .env 文件并填入您的 API 密钥"
        echo "需要配置的密钥:"
        echo "  - TELEGRAM_BOT_TOKEN"
        echo "  - DEEPSEEK_API_KEY"
        echo "  - MINIMAX_API_KEY"
        echo "  - MINIMAX_GROUP_ID"
        echo ""
        read -p "按回车键继续编辑 .env 文件..."
        
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        elif command -v vi &> /dev/null; then
            vi .env
        else
            print_error "未找到可用的文本编辑器，请手动编辑 .env 文件"
            exit 1
        fi
    else
        print_error "未找到环境变量文件"
        exit 1
    fi
fi

# 创建必要的目录
print_info "创建数据目录..."
mkdir -p data logs

# 启动服务
print_info "启动服务..."
docker-compose up -d

# 等待服务启动
print_info "等待服务启动..."
sleep 10

# 检查服务状态
if docker-compose ps | grep -q "Up"; then
    print_success "✅ 部署成功！服务正在运行"
    echo ""
    print_info "管理命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
else
    print_error "❌ 部署失败，请查看日志:"
    docker-compose logs
    exit 1
fi
EOF
    
    # 添加执行权限
    chmod +x "$PACKAGE_NAME/offline-deploy.sh"
    
    # 创建说明文件
    cat > "$PACKAGE_NAME/README_OFFLINE.md" << EOF
# Telechat Bot 离线部署包

## 包含文件

- \`telechat-bot.tar.gz\` - Docker 镜像文件
- \`docker-compose.yml\` - Docker Compose 配置
- \`.env.example\` - 环境变量模板
- \`offline-deploy.sh\` - 一键部署脚本
- \`README.md\` - 项目说明文档
- \`DOCKER_OFFLINE_DEPLOY.md\` - 详细部署指南

## 快速部署

1. 将整个文件夹上传到服务器
2. 进入文件夹: \`cd $PACKAGE_NAME\`
3. 运行部署脚本: \`./offline-deploy.sh\`
4. 按提示配置环境变量

## 系统要求

- Linux 操作系统
- Docker 和 Docker Compose
- 至少 1GB 可用内存
- 至少 2GB 可用磁盘空间

## 部署时间

生成时间: $(date)
镜像版本: ${IMAGE_TAG}
包大小: $(du -h temp_export/${IMAGE_NAME}.tar.gz | cut -f1)

EOF
    
    print_success "离线部署包创建完成: $PACKAGE_NAME"
}

# 打包压缩
compress_package() {
    print_info "压缩部署包..."
    
    # 创建压缩包
    tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME" || {
        print_error "压缩失败"
        exit 1
    }
    
    # 显示文件信息
    local package_size=$(du -h "${PACKAGE_NAME}.tar.gz" | cut -f1)
    print_success "压缩包创建成功: ${PACKAGE_NAME}.tar.gz (${package_size})"
}

# 清理临时文件
cleanup() {
    print_info "清理临时文件..."
    rm -rf "temp_export"
    rm -rf "$PACKAGE_NAME"
    print_success "清理完成"
}

# 显示结果
show_result() {
    echo ""
    print_success "🎉 离线部署包构建完成！"
    echo ""
    print_info "生成的文件:"
    echo "  📦 ${PACKAGE_NAME}.tar.gz"
    echo ""
    print_info "部署步骤:"
    echo "  1. 将 ${PACKAGE_NAME}.tar.gz 上传到目标服务器"
    echo "  2. 解压: tar -xzf ${PACKAGE_NAME}.tar.gz"
    echo "  3. 进入目录: cd $PACKAGE_NAME"
    echo "  4. 运行部署: ./offline-deploy.sh"
    echo ""
    print_info "详细说明请查看 DOCKER_OFFLINE_DEPLOY.md 文件"
}

# 主函数
main() {
    # 检查环境
    check_docker
    check_project_files
    
    # 构建和导出
    build_image
    export_image
    
    # 创建部署包
    create_package
    compress_package
    
    # 清理和显示结果
    cleanup
    show_result
}

# 错误处理
trap 'print_error "构建过程中发生错误，正在清理..." && rm -rf temp_export "$PACKAGE_NAME" 2>/dev/null || true' ERR

# 运行主函数
main "$@"