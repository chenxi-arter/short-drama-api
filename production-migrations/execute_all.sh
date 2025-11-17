#!/bin/bash

# 生产环境数据库迁移执行脚本
# 使用方法: ./execute_all.sh [数据库名] [用户名]

# 检查参数
if [ $# -lt 2 ]; then
    echo "使用方法: $0 <数据库名> <用户名>"
    echo "示例: $0 short_drama root"
    exit 1
fi

DB_NAME=$1
DB_USER=$2

echo "🚀 开始执行生产环境数据库迁移..."
echo "数据库: $DB_NAME"
echo "用户: $DB_USER"
echo ""

# 提示用户确认
read -p "⚠️  请确认已备份数据库，是否继续? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ 迁移已取消"
    exit 0
fi

echo ""
echo "📋 执行迁移文件..."

# 1. 创建广告系统
echo "1️⃣  执行广告系统迁移..."
mysql -u $DB_USER -p $DB_NAME < 01_advertising_system.sql
if [ $? -eq 0 ]; then
    echo "✅ 广告系统迁移完成"
else
    echo "❌ 广告系统迁移失败"
    exit 1
fi

# 2. 修复Episode外键约束
echo "2️⃣  修复Episode外键约束..."
mysql -u $DB_USER -p $DB_NAME < 02_fix_episode_cascade_delete.sql
if [ $? -eq 0 ]; then
    echo "✅ Episode外键约束修复完成"
else
    echo "❌ Episode外键约束修复失败"
    exit 1
fi

# 3. 修复WatchProgress外键约束
echo "3️⃣  修复WatchProgress外键约束..."
mysql -u $DB_USER -p $DB_NAME < 03_fix_watch_progress_cascade.sql
if [ $? -eq 0 ]; then
    echo "✅ WatchProgress外键约束修复完成"
else
    echo "❌ WatchProgress外键约束修复失败"
    exit 1
fi

echo ""
echo "🎉 所有迁移执行完成！"
echo ""
echo "📊 验证结果:"
echo "检查广告平台数据..."
mysql -u $DB_USER -p $DB_NAME -e "SELECT COUNT(*) as platform_count FROM advertising_platforms;"

echo ""
echo "检查外键约束..."
mysql -u $DB_USER -p $DB_NAME -e "SELECT TABLE_NAME, CONSTRAINT_NAME, DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE REFERENCED_TABLE_NAME = 'episodes';"

echo ""
echo "✅ 迁移验证完成！"
