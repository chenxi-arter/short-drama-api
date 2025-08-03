#!/bin/bash

# 短剧API项目文档清理脚本
# 用于删除重复和无用的文档文件

echo "🚀 开始清理 docs 和 migrations 目录..."
echo "📁 当前工作目录: $(pwd)"

# 检查是否在正确的目录
if [ ! -d "docs" ] || [ ! -d "migrations" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 创建备份目录（可选）
echo "📦 创建备份目录..."
mkdir -p backup/docs backup/migrations

# 备份要删除的文件（可选）
echo "💾 备份要删除的文件..."
# docs 目录备份
[ -f "docs/short_drama.sql" ] && cp "docs/short_drama.sql" "backup/docs/"
[ -f "docs/home-api.md" ] && cp "docs/home-api.md" "backup/docs/"
[ -f "docs/episode-enhancement-api.md" ] && cp "docs/episode-enhancement-api.md" "backup/docs/"
[ -f "docs/structure-optimization-completed.md" ] && cp "docs/structure-optimization-completed.md" "backup/docs/"
[ -f "docs/api-test-examples.md" ] && cp "docs/api-test-examples.md" "backup/docs/"
[ -f "docs/apifox-import-guide.md" ] && cp "docs/apifox-import-guide.md" "backup/docs/"
[ -f "docs/cache-invalidation-guide.md" ] && cp "docs/cache-invalidation-guide.md" "backup/docs/"
[ -f "docs/token-expiration-guide.md" ] && cp "docs/token-expiration-guide.md" "backup/docs/"
[ -f "docs/api-changelog.md" ] && cp "docs/api-changelog.md" "backup/docs/"
[ -f "docs/robustness-implementation-guide.md" ] && cp "docs/robustness-implementation-guide.md" "backup/docs/"

# migrations 目录备份
[ -f "migrations/API文档.md" ] && cp "migrations/API文档.md" "backup/migrations/"
[ -f "migrations/add-actor-fields-to-series.sql" ] && cp "migrations/add-actor-fields-to-series.sql" "backup/migrations/"
[ -f "migrations/add-episode-fields.sql" ] && cp "migrations/add-episode-fields.sql" "backup/migrations/"
[ -f "migrations/check-data-stats.sql" ] && cp "migrations/check-data-stats.sql" "backup/migrations/"

echo "🗑️  开始删除重复和无用文件..."

# 第一步：删除重复文件
echo "�� 步骤 1: 删除重复文件"
rm -f "docs/short_drama.sql" && echo "  ✅ 删除 docs/short_drama.sql"
rm -f "migrations/API文档.md" && echo "  ✅ 删除 migrations/API文档.md"

# 第二步：删除过时文档
echo "📋 步骤 2: 删除过时文档"
rm -f "docs/home-api.md" && echo "  ✅ 删除 docs/home-api.md"
rm -f "docs/episode-enhancement-api.md" && echo "  ✅ 删除 docs/episode-enhancement-api.md"
rm -f "docs/structure-optimization-completed.md" && echo "  ✅ 删除 docs/structure-optimization-completed.md"
rm -f "docs/api-test-examples.md" && echo "  ✅ 删除 docs/api-test-examples.md"
rm -f "docs/apifox-import-guide.md" && echo "  ✅ 删除 docs/apifox-import-guide.md"

# 第三步：删除已应用的迁移文件
echo "📋 步骤 3: 删除已应用的迁移文件"
rm -f "migrations/add-actor-fields-to-series.sql" && echo "  ✅ 删除 migrations/add-actor-fields-to-series.sql"
rm -f "migrations/add-episode-fields.sql" && echo "  ✅ 删除 migrations/add-episode-fields.sql"
rm -f "migrations/check-data-stats.sql" && echo "  ✅ 删除 migrations/check-data-stats.sql"

# 第四步：删除可选的重复指南文档
echo "📋 步骤 4: 删除重复的指南文档"
rm -f "docs/cache-invalidation-guide.md" && echo "  ✅ 删除 docs/cache-invalidation-guide.md"
rm -f "docs/token-expiration-guide.md" && echo "  ✅ 删除 docs/token-expiration-guide.md"
rm -f "docs/api-changelog.md" && echo "  ✅ 删除 docs/api-changelog.md"
rm -f "docs/robustness-implementation-guide.md" && echo "  ✅ 删除 docs/robustness-implementation-guide.md"

echo ""
echo "🎉 文件清理完成！"
echo "📊 整理效果："
echo "   - docs 目录：从 19 个文件减少到 9 个文件"
echo "   - migrations 目录：从 8 个文件减少到 4 个文件"
echo "💾 备份文件保存在 backup/ 目录中"
echo ""
echo "�� 保留的核心文件："
echo "docs 目录："
ls -la docs/ 2>/dev/null | grep -v "^total" | grep -v "^d" | awk '{print "  - " $9}'
echo "migrations 目录："
ls -la migrations/ 2>/dev/null | grep -v "^total" | grep -v "^d" | awk '{print "  - " $9}'

echo ""
echo "✨ 如需恢复文件，请查看 backup/ 目录"
