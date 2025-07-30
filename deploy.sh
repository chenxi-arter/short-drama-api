#!/bin/bash

# =====================================================
# 短剧API项目快速部署脚本
# 适用于新服务器一键部署
# =====================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查Node.js版本
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js version: $(node -v)"
        else
            print_error "Node.js version must be >= 18.0.0, current: $(node -v)"
            exit 1
        fi
    else
        print_error "Node.js is not installed"
        exit 1
    fi
}

# 检查MySQL连接
check_mysql_connection() {
    if [ -f ".env" ]; then
        source .env
        if command_exists mysql; then
            print_info "Testing MySQL connection..."
            if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
                print_success "MySQL connection successful"
            else
                print_error "MySQL connection failed. Please check your database configuration."
                exit 1
            fi
        else
            print_warning "MySQL client not found. Skipping connection test."
        fi
    else
        print_warning ".env file not found. Skipping MySQL connection test."
    fi
}

# 安装依赖
install_dependencies() {
    print_info "Installing dependencies..."
    if command_exists npm; then
        npm install
        print_success "Dependencies installed successfully"
    else
        print_error "npm is not installed"
        exit 1
    fi
}

# 构建项目
build_project() {
    print_info "Building project..."
    npm run build
    print_success "Project built successfully"
}

# 初始化数据库
init_database() {
    if [ -f ".env" ]; then
        source .env
        print_info "Initializing database..."
        
        if command_exists mysql; then
            # 检查数据库是否存在
            DB_EXISTS=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || true)
            
            if [ "$DB_EXISTS" -eq 0 ]; then
                print_info "Creating database: $DB_NAME"
                mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            fi
            
            # 执行完整初始化脚本
            print_info "Executing database initialization script..."
            mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < migrations/complete-setup.sql
            print_success "Database initialized successfully"
        else
            print_warning "MySQL client not found. Please manually execute: migrations/complete-setup.sql"
        fi
    else
        print_error ".env file not found. Please create it first."
        exit 1
    fi
}

# 启动应用
start_application() {
    print_info "Starting application..."
    
    if command_exists pm2; then
        print_info "Using PM2 to start application..."
        pm2 start ecosystem.config.js
        pm2 save
        print_success "Application started with PM2"
    else
        print_info "PM2 not found. Starting with npm..."
        print_warning "For production, consider installing PM2: npm install -g pm2"
        npm run start:prod &
        print_success "Application started in background"
    fi
}

# 显示帮助信息
show_help() {
    echo "短剧API项目部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h          显示此帮助信息"
    echo "  --check-only        仅检查环境，不执行部署"
    echo "  --skip-db           跳过数据库初始化"
    echo "  --dev               开发模式部署"
    echo ""
    echo "完整部署步骤:"
    echo "  1. 检查系统环境"
    echo "  2. 安装项目依赖"
    echo "  3. 构建项目"
    echo "  4. 初始化数据库"
    echo "  5. 启动应用"
    echo ""
    echo "部署前请确保:"
    echo "  - 已创建 .env 文件并配置正确的数据库连接信息"
    echo "  - MySQL 服务正在运行"
    echo "  - Node.js >= 18.0.0"
}

# 主函数
main() {
    echo "======================================================"
    echo "           短剧API项目快速部署脚本"
    echo "======================================================"
    echo ""
    
    # 解析命令行参数
    CHECK_ONLY=false
    SKIP_DB=false
    DEV_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --check-only)
                CHECK_ONLY=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查环境
    print_info "检查系统环境..."
    check_node_version
    
    if [ "$CHECK_ONLY" = true ]; then
        check_mysql_connection
        print_success "环境检查完成"
        exit 0
    fi
    
    # 检查.env文件
    if [ ! -f ".env" ]; then
        print_error ".env 文件不存在"
        print_info "请复制 .env.example 为 .env 并配置正确的参数"
        print_info "cp .env.example .env"
        exit 1
    fi
    
    # 执行部署步骤
    install_dependencies
    
    if [ "$DEV_MODE" = false ]; then
        build_project
    fi
    
    if [ "$SKIP_DB" = false ]; then
        check_mysql_connection
        init_database
    fi
    
    if [ "$DEV_MODE" = true ]; then
        print_info "启动开发模式..."
        npm run start:dev
    else
        start_application
        
        # 显示部署结果
        echo ""
        print_success "部署完成！"
        echo ""
        print_info "应用信息:"
        echo "  - 访问地址: http://localhost:$(grep PORT .env | cut -d'=' -f2 || echo '3000')"
        echo "  - 环境配置: .env"
        echo "  - 日志查看: pm2 logs (如果使用PM2)"
        echo ""
        print_info "常用命令:"
        echo "  - 查看状态: pm2 status"
        echo "  - 重启应用: pm2 restart all"
        echo "  - 停止应用: pm2 stop all"
        echo "  - 查看日志: pm2 logs"
        echo ""
        print_info "API文档: docs/ 目录"
        print_info "数据库文档: migrations/API文档.md"
    fi
}

# 执行主函数
main "$@"