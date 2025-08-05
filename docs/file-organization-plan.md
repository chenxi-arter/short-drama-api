# 文档和迁移文件整理方案

## 整理目标

1. **消除重复文件**：合并功能相似的文件
2. **统一文档结构**：建立清晰的文档层次
3. **优化迁移脚本**：整合相关的数据库迁移
4. **提升可维护性**：减少文件碎片化

## 当前文件分析

### 📁 docs 目录
- ✅ `README.md` - 文档中心索引
- ✅ `complete-api-documentation.md` - 完整API文档 (1645行)
- ✅ `security-guide.md` - 安全指南
- ✅ `cache-guide.md` - 缓存指南
- ✅ `entity-relationship-diagram.svg` - 实体关系图
- ✅ `database-schema.md` - 数据库架构
- ✅ `deployment-guide.md` - 部署指南

### 📁 migrations 目录
- ✅ `README.md` - 迁移脚本说明
- ✅ `complete-setup.sql` - 完整数据库初始化 (504行)
- ✅ `add-series-filter-fields.sql` - 添加筛选字段
- ✅ `add-uuid-fields.sql` - 添加UUID字段
- ✅ `insert-test-data.sql` - 测试数据
- ✅ `run-test-data.sh` - 测试脚本
- ✅ `update-category-data.sql` - 更新分类数据
- ✅ `update-category-table.sql` - 更新分类表

### 📁 backup/docs 目录 (需要整理)
- 🔄 `api-changelog.md` - API变更日志 (170行) **→ 移动到主docs**
- 🔄 `episode-enhancement-api.md` - 剧集增强API (216行) **→ 合并到主API文档**
- 🔄 `home-api.md` - 首页API (123行) **→ 合并到主API文档**
- 🔄 `cache-invalidation-guide.md` - 缓存失效指南 (215行) **→ 合并到缓存指南**
- ❌ `short_drama.sql` - 数据库导出 (654行) **→ 删除，已有complete-setup.sql**
- 🔄 `api-test-examples.md` - API测试示例 **→ 移动到主docs**
- 🔄 `apifox-import-guide.md` - Apifox导入指南 **→ 移动到主docs**
- 🔄 `robustness-implementation-guide.md` - 健壮性实现指南 **→ 移动到主docs**
- 🔄 `structure-optimization-completed.md` - 结构优化完成 **→ 移动到主docs**
- 🔄 `token-expiration-guide.md` - Token过期指南 **→ 合并到安全指南**

### 📁 backup/migrations 目录 (需要整理)
- ❌ `API文档.md` - 旧API文档 **→ 删除，已有完整API文档**
- 🔄 `add-actor-fields-to-series.sql` - 添加演员字段 **→ 移动到主migrations**
- 🔄 `add-episode-fields.sql` - 添加剧集字段 **→ 移动到主migrations**
- 🔄 `check-data-stats.sql` - 数据统计检查 **→ 移动到主migrations**

### 📁 src/database/migrations 目录
- 🔄 `update-series-category-relation.sql` - 更新系列分类关系 **→ 移动到主migrations**

## 整理计划

### 阶段1：移动有价值的文档
1. 将 `backup/docs/api-changelog.md` 移动到 `docs/`
2. 将 `backup/docs/api-test-examples.md` 移动到 `docs/`
3. 将 `backup/docs/apifox-import-guide.md` 移动到 `docs/`
4. 将 `backup/docs/robustness-implementation-guide.md` 移动到 `docs/`
5. 将 `backup/docs/structure-optimization-completed.md` 移动到 `docs/`

### 阶段2：合并相关文档
1. 将 `backup/docs/cache-invalidation-guide.md` 内容合并到 `docs/cache-guide.md`
2. 将 `backup/docs/token-expiration-guide.md` 内容合并到 `docs/security-guide.md`
3. 将 `backup/docs/episode-enhancement-api.md` 和 `home-api.md` 的独特内容合并到 `complete-api-documentation.md`

### 阶段3：整合迁移脚本
1. 将 `backup/migrations/add-actor-fields-to-series.sql` 移动到 `migrations/`
2. 将 `backup/migrations/add-episode-fields.sql` 移动到 `migrations/`
3. 将 `backup/migrations/check-data-stats.sql` 移动到 `migrations/`
4. 将 `src/database/migrations/update-series-category-relation.sql` 移动到 `migrations/`

### 阶段4：删除重复和过时文件
1. 删除 `backup/docs/short_drama.sql` (已有complete-setup.sql)
2. 删除 `backup/migrations/API文档.md` (已有完整API文档)
3. 删除已合并的文档文件

### 阶段5：更新索引文档
1. 更新 `docs/README.md` 添加新移动的文档
2. 更新 `migrations/README.md` 添加新的迁移脚本说明

## 实际完成效果

### 整理前
- docs: 7个文件
- migrations: 8个文件
- backup/docs: 10个文件
- backup/migrations: 4个文件
- src/database/migrations: 1个文件
- **总计**: 30个文件

### 整理后
- docs: 12个文件 (+5个有价值文档)
- migrations: 12个文件 (+4个迁移脚本)
- backup目录: ✅ 已完全删除
- src/database/migrations: ✅ 已删除
- **总计**: 24个文件 (-6个重复/过时文件)

### ✅ 已完成的工作

#### 文档整理
1. ✅ 移动了5个有价值文档到主docs目录
2. ✅ 合并了缓存失效指南到Redis缓存指南
3. ✅ 合并了Token过期指南到安全指南
4. ✅ 删除了4个重复/过时文档
5. ✅ 更新了docs/README.md索引

#### 迁移脚本整理
1. ✅ 移动了4个迁移脚本到主migrations目录
2. ✅ 更新了migrations/README.md说明
3. ✅ 删除了src/database/migrations目录

#### 目录清理
1. ✅ 完全删除了backup目录
2. ✅ 统一了文档和迁移脚本的存放位置

## 文件质量评估

### 高质量文件 (保留)
- `complete-api-documentation.md` - 1645行完整API文档
- `complete-setup.sql` - 504行完整数据库初始化
- `api-changelog.md` - 170行详细变更记录
- `episode-enhancement-api.md` - 216行剧集增强功能
- `cache-invalidation-guide.md` - 215行缓存机制指南

### 重复文件 (删除)
- `short_drama.sql` - 与complete-setup.sql重复
- `API文档.md` - 与complete-api-documentation.md重复

### 碎片文件 (合并)
- `home-api.md` - 123行，可合并到主API文档
- `token-expiration-guide.md` - 可合并到安全指南

## 实施建议

1. **备份重要文件**：在删除前确保重要内容已合并
2. **逐步实施**：分阶段执行，避免一次性大量变更
3. **更新引用**：检查代码中的文档引用路径
4. **团队通知**：通知团队成员文档结构变更