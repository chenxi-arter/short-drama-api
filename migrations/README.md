# 数据库迁移说明

## 迁移脚本说明

### 主要脚本

1. **complete-setup.sql** - 完整数据库初始化脚本
   - 包含所有表结构、索引、测试数据
   - 适用于新服务器一键部署
   - 包含refresh_tokens表和相关配置

2. **insert-test-data.sql** - 测试数据插入脚本
   - 包含用户、分类、系列、剧集等测试数据
   - 用于开发和测试环境

3. **add-uuid-fields.sql** - UUID字段添加脚本
   - 为主要实体添加UUID字段
   - 增强防枚举攻击能力

4. **add-series-filter-fields.sql** - 系列筛选字段脚本
   - 添加地区、语言、发布日期等筛选字段
   - 支持高级筛选功能

5. **add-actor-fields-to-series.sql** - 演员信息字段脚本
   - 为series表添加主演、演员、导演字段
   - 增强视频详情信息

6. **add-episode-fields.sql** - 剧集字段增强脚本
   - 为episode和episode_url表添加时间戳和续集字段
   - 添加防枚举攻击的加密索引

7. **update-series-category-relation.sql** - 系列分类关系更新脚本
   - 建立series与category的直接关联
   - 移除多对多关系，简化数据结构

8. **update-categories-complete.sql** - 完整分类表更新脚本 ⭐ **推荐使用**
   - 合并了表结构和数据更新功能
   - 一站式分类表初始化和数据填充
   - 包含性能优化索引

9. **update-category-data.sql** - 分类数据更新脚本 ⚠️ **已整合**
   - 更新分类表数据
   - 标准化分类信息
   - *建议使用 update-categories-complete.sql 替代*

10. **update-category-table.sql** - 分类表结构更新脚本 ⚠️ **已整合**
    - 更新分类表结构
    - 添加新字段和索引
    - *建议使用 update-categories-complete.sql 替代*

11. **check-data-stats.sql** - 数据统计检查脚本
    - 检查数据库数据完整性
    - 生成数据统计报告

### 辅助脚本
12. **run-test-data.sh** - 一键执行测试数据插入的Shell脚本

## 📋 脚本分类说明

### 🚀 完整初始化类
- `complete-setup.sql` - 适用于全新部署
- `insert-test-data.sql` - 开发测试环境数据

### 🔧 功能增强类
- `add-uuid-fields.sql` - 安全性增强
- `add-series-filter-fields.sql` - 筛选功能
- `add-actor-fields-to-series.sql` - 内容信息增强
- `add-episode-fields.sql` - 剧集功能增强

### 📊 结构优化类
- `update-categories-complete.sql` - ⭐ **推荐** 分类系统完整更新
- `update-series-category-relation.sql` - 关系优化
- `update-category-data.sql` - ⚠️ 已整合到 complete 版本
- `update-category-table.sql` - ⚠️ 已整合到 complete 版本

### 🛠️ 数据管理类
- `check-data-stats.sql` - 数据统计和验证

## 如何应用迁移

### 首次部署（全新数据库）

1. 连接到MySQL数据库

```bash
mysql -u [用户名] -p [数据库名]
```

2. 执行完整数据库初始化脚本

```bash
source /path/to/migrations/complete-setup.sql
```

或者使用以下命令直接执行SQL文件：

```bash
mysql -u [用户名] -p [数据库名] < /path/to/migrations/complete-setup.sql
```

**注意：** complete-setup.sql 包含了所有必要的表结构、索引和refresh_tokens表，适用于一键部署。

### 插入测试数据

在数据库初始化完成后，可以插入丰富的测试数据：

```bash
mysql -u [用户名] -p [数据库名] < /path/to/migrations/insert-test-data.sql
```

**注意：** 测试数据脚本包含了大量的示例数据，包括：
- 16个分类和25个标签
- 15个系列剧集
- 20个剧集和对应的播放地址
- 12个短视频
- 15个测试用户
- 24条评论（包括弹幕）
- 19条观看进度记录
- 系列和剧集的标签关联数据

### 使用辅助脚本

#### 一键插入测试数据
```bash
cd migrations
./run-test-data.sh [数据库名] [用户名]
```

示例：
```bash
./run-test-data.sh short_drama root
```

#### 查看数据统计
插入数据后，可以查看统计信息：
```bash
mysql -u [用户名] -p [数据库名] < check-data-stats.sql
```

这将显示：
- 各表的记录数统计
- 热门内容TOP5
- 用户活跃度统计
- 评论和观看进度分析

## 注意事项

- 在应用迁移前，请确保已备份数据库
- 迁移脚本会修改数据库结构，请在非高峰期执行
- 执行完迁移后，需要重启应用服务器以使新字段生效