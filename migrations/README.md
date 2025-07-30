# 数据库迁移说明

## 迁移文件列表

### SQL脚本
1. **complete-setup.sql** - 完整数据库初始化脚本，包含所有表结构、索引和refresh_tokens表（推荐用于新部署）
2. **insert-test-data.sql** - 插入丰富的测试数据，包括更多系列、剧集、短视频、用户、评论等
3. **check-data-stats.sql** - 数据统计查询脚本，用于检查插入的数据统计信息

### 辅助脚本
4. **run-test-data.sh** - 一键执行测试数据插入的Shell脚本

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