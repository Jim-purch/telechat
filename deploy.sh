#!/bin/bash

# Telegram AI Bot 一键部署脚本
# 适用于 Ubuntu/Debian 系统

set -e

echo "🚀 开始部署 Telegram AI Bot..."

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

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "检测到 root 用户，建议使用普通用户运行此脚本"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 检查系统类型
check_system() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "无法检测系统类型"
        exit 1
    fi
    
    print_info "检测到系统: $OS $VER"
}

# 更新系统包
update_system() {
    print_info "更新系统包..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get upgrade -y
    elif command -v yum &> /dev/null; then
        sudo yum update -y
    else
        print_error "不支持的包管理器"
        exit 1
    fi
    print_success "系统包更新完成"
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_info "Docker 已安装，版本: $(docker --version)"
        return
    fi
    
    print_info "安装 Docker..."
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
    fi
    
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # 添加用户到 docker 组
    sudo usermod -aG docker $USER
    
    print_success "Docker 安装完成"
}

# 安装 Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_info "Docker Compose 已安装，版本: $(docker-compose --version)"
        return
    fi
    
    print_info "安装 Docker Compose..."
    
    # 获取最新版本
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
    
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose 安装完成"
}

# 安装 Git
install_git() {
    if command -v git &> /dev/null; then
        print_info "Git 已安装，版本: $(git --version)"
        return
    fi
    
    print_info "安装 Git..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y git
    elif command -v yum &> /dev/null; then
        sudo yum install -y git
    fi
    
    print_success "Git 安装完成"
}

# 克隆项目
clone_project() {
    PROJECT_DIR="$HOME/telechat"
    
    if [[ -d "$PROJECT_DIR" ]]; then
        print_warning "项目目录已存在: $PROJECT_DIR"
        read -p "是否删除并重新克隆？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
        else
            cd "$PROJECT_DIR"
            git pull origin main
            print_success "项目代码已更新"
            return
        fi
    fi
    
    print_info "克隆项目代码..."
    git clone https://github.com/Jim-purch/telechat.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    print_success "项目代码克隆完成"
}

# 配置环境变量
setup_env() {
    print_info "配置环境变量..."
    
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        print_warning "请编辑 .env 文件并填入您的 API 密钥"
        print_info "需要配置的密钥:"
        echo "  - TELEGRAM_BOT_TOKEN (Telegram Bot Token)"
        echo "  - DEEPSEEK_API_KEY (DeepSeek API Key)"
        echo "  - MINIMAX_API_KEY (MiniMax API Key)"
        echo "  - MINIMAX_GROUP_ID (MiniMax Group ID)"
        echo ""
        read -p "按回车键继续编辑 .env 文件..."
        
        # 尝试使用不同的编辑器
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        elif command -v vi &> /dev/null; then
            vi .env
        else
            print_error "未找到可用的文本编辑器，请手动编辑 .env 文件"
        fi
    else
        print_info ".env 文件已存在"
    fi
}

# 部署应用
deploy_app() {
    print_info "构建并启动应用..."
    
    # 确保用户在 docker 组中
    if ! groups $USER | grep -q docker; then
        print_warning "用户不在 docker 组中，需要重新登录或执行 newgrp docker"
        print_info "尝试使用 sudo 运行 docker-compose..."
        sudo docker-compose up -d --build
    else
        docker-compose up -d --build
    fi
    
    print_success "应用部署完成"
}

# 检查部署状态
check_deployment() {
    print_info "检查部署状态..."
    
    sleep 5
    
    if docker-compose ps | grep -q "Up"; then
        print_success "✅ 应用正在运行"
        echo ""
        print_info "查看日志: docker-compose logs -f"
        print_info "停止服务: docker-compose down"
        print_info "重启服务: docker-compose restart"
    else
        print_error "❌ 应用启动失败"
        print_info "查看错误日志: docker-compose logs"
        exit 1
    fi
}

# 创建系统服务（可选）
setup_systemd_service() {
    read -p "是否创建系统服务以便开机自启？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    print_info "创建系统服务..."
    
    SERVICE_FILE="/etc/systemd/system/telechat.service"
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Telechat Bot Docker Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable telechat.service
    
    print_success "系统服务创建完成"
    print_info "服务管理命令:"
    echo "  启动: sudo systemctl start telechat"
    echo "  停止: sudo systemctl stop telechat"
    echo "  状态: sudo systemctl status telechat"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    print_success "🎉 部署完成！"
    echo ""
    print_info "项目目录: $(pwd)"
    print_info "配置文件: $(pwd)/.env"
    echo ""
    print_info "常用命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  更新代码: git pull && docker-compose up -d --build"
    echo ""
    print_info "如需帮助，请查看 DEPLOY.md 文件"
}

# 主函数
main() {
    echo "🤖 Telegram AI Bot 一键部署脚本"
    echo "================================="
    echo ""
    
    check_root
    check_system
    
    print_info "开始安装依赖..."
    update_system
    install_docker
    install_docker_compose
    install_git
    
    clone_project
    setup_env
    deploy_app
    check_deployment
    setup_systemd_service
    show_deployment_info
    
    print_success "🚀 部署完成！您的 Telegram AI Bot 现在正在运行。"
}

# 错误处理
trap 'print_error "部署过程中发生错误，请检查上面的错误信息"' ERR

# 运行主函数
main "$@"