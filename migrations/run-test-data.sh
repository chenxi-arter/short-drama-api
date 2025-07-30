#!/bin/bash

# 插入测试数据的快速执行脚本
# 使用方法: ./run-test-data.sh [数据库名] [用户名]

# 设置默认值
DB_NAME=${1:-"short_drama"}
DB_USER=${2:-"root"}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 短剧API测试数据插入脚本 ===${NC}"
echo -e "数据库名: ${GREEN}$DB_NAME${NC}"
echo -e "用户名: ${GREEN}$DB_USER${NC}"
echo ""

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}错误: 未找到mysql命令，请确保MySQL客户端已安装${NC}"
    exit 1
fi

# 检查文件是否存在
if [ ! -f "insert-test-data.sql" ]; then
    echo -e "${RED}错误: 未找到insert-test-data.sql文件${NC}"
    echo "请确保在migrations目录下执行此脚本"
    exit 1
fi

echo -e "${YELLOW}正在插入测试数据...${NC}"

# 执行SQL脚本
if mysql -u "$DB_USER" -p "$DB_NAME" < insert-test-data.sql; then
    echo -e "${GREEN}✅ 测试数据插入成功！${NC}"
    echo ""
    echo -e "${YELLOW}插入的数据包括:${NC}"
    echo "📁 16个视频分类"
    echo "🏷️  25个内容标签"
    echo "🎬 15个系列剧集"
    echo "📺 20个剧集和播放地址"
    echo "📱 12个短视频"
    echo "👥 15个测试用户"
    echo "💬 24条评论和弹幕"
    echo "⏯️  19条观看进度记录"
    echo "🔗 标签关联数据"
    echo ""
    echo -e "${GREEN}现在可以测试/home/getvideos接口了！${NC}"
else
    echo -e "${RED}❌ 测试数据插入失败${NC}"
    echo "请检查数据库连接和权限设置"
    exit 1
fi