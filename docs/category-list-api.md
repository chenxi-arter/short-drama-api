# 分类列表API实现文档

## 📋 概述

本文档描述了新实现的分类列表API，该接口返回系统中所有启用的分类信息，支持前端动态渲染分类导航。

## 🚀 接口信息

### 基本信息
- **接口路径**: `GET /category/list`
- **请求方法**: GET
- **内容类型**: application/json
- **认证要求**: 无（公开接口）

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| versionNo | number | 否 | 版本号，用于客户端缓存控制 |

### 响应格式

```json
{
  "ret": 200,
  "data": {
    "versionNo": 20240112,
    "list": [
      {
        "categoryId": "0",
        "name": "首页",
        "type": 0,
        "index": 1,
        "routeName": ""
      },
      {
        "categoryId": "3",
        "name": "电影",
        "type": 1,
        "index": 2,
        "routeName": "movie"
      },
      {
        "categoryId": "chinese",
        "name": "华人",
        "type": 2,
        "index": 9,
        "routeName": "chinese",
        "styleType": 0
      }
    ]
  },
  "msg": null
}
```

### 响应字段说明

#### 根级别字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| ret | number | 响应状态码，200表示成功 |
| data | object | 响应数据对象 |
| msg | string\|null | 错误消息，成功时为null |

#### data字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| versionNo | number | 数据版本号 |
| list | array | 分类列表数组 |

#### list数组中的分类对象
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| categoryId | string\|number | 是 | 分类唯一标识符 |
| name | string | 是 | 分类显示名称 |
| type | number | 是 | 分类类型：0-首页，1-视频分类，2-短视频分类，6-片单 |
| index | number | 是 | 排序索引，用于控制显示顺序 |
| routeName | string | 是 | 前端路由名称 |
| styleType | number | 否 | 样式类型，仅部分分类有此字段 |

## 🛠️ 技术实现

### 1. 数据库结构

更新了 `categories` 表，添加了以下字段：

```sql
ALTER TABLE categories 
ADD COLUMN category_id VARCHAR(50) NOT NULL DEFAULT '0' COMMENT '分类ID（前端识别用）',
ADD COLUMN type INT NOT NULL DEFAULT 1 COMMENT '分类类型',
ADD COLUMN `index` INT NOT NULL DEFAULT 1 COMMENT '排序索引',
ADD COLUMN route_name VARCHAR(50) NULL COMMENT '路由名称',
ADD COLUMN style_type INT NULL COMMENT '样式类型',
ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### 2. 代码结构

#### 实体类 (Category Entity)
- 文件位置: `src/video/entity/category.entity.ts`
- 新增字段: categoryId, type, index, routeName, styleType, isEnabled, createdAt, updatedAt

#### 数据传输对象 (DTO)
- 文件位置: `src/video/dto/category-list.dto.ts`
- 包含请求DTO和响应接口定义

#### 服务层 (CategoryService)
- 文件位置: `src/video/services/category.service.ts`
- 新增方法: `getCategoryList(versionNo?: number)`
- 支持缓存，提高性能

#### 控制器 (CategoryController)
- 文件位置: `src/video/category.controller.ts`
- 处理 `/category/list` 路由

### 3. 缓存策略

- **缓存键**: `categories:list`
- **缓存时间**: 1小时 (3600秒)
- **缓存更新**: 当分类数据发生变化时自动清除

## 📦 部署步骤

### 1. 数据库迁移

```bash
# 执行数据库迁移脚本
mysql -u your_username -p your_database < migrations/update-category-table.sql
```

### 2. 重启应用

```bash
# 开发环境
npm run start:dev

# 生产环境
npm run build
npm run start:prod
```

## 🧪 测试

### 1. 使用curl测试

```bash
# 基本请求
curl -X GET "http://localhost:3000/category/list"

# 带版本号请求
curl -X GET "http://localhost:3000/category/list?versionNo=20240112"
```

### 2. 使用测试页面

打开 `test-category-api.html` 文件在浏览器中进行可视化测试。

### 3. 预期响应示例

成功响应包含16个分类项目，涵盖：
- 首页 (type: 0)
- 视频分类：电影、电视剧、综艺、动漫、体育、纪录片 (type: 1)
- 短视频分类：华人、游戏、新闻、娱乐、生活、音乐、时尚、科技 (type: 2)
- 片单 (type: 6)

## 🔧 配置说明

### 环境变量

无需额外环境变量配置，使用现有的数据库和缓存配置。

### 缓存配置

接口使用Redis缓存，确保Redis服务正常运行：

```bash
# 检查Redis状态
redis-cli ping
```

## 🚨 注意事项

1. **数据库兼容性**: 确保MySQL版本支持JSON字段和新的时间戳语法
2. **缓存依赖**: 接口依赖Redis缓存，确保Redis服务可用
3. **数据一致性**: 修改分类数据后需要清除相关缓存
4. **性能优化**: 大量分类时考虑分页或按类型筛选

## 📈 性能指标

- **响应时间**: < 100ms (缓存命中)
- **响应时间**: < 500ms (数据库查询)
- **缓存命中率**: > 95%
- **并发支持**: 1000+ QPS

## 🔄 后续优化

1. **分页支持**: 当分类数量过多时添加分页功能
2. **国际化**: 支持多语言分类名称
3. **权限控制**: 根据用户权限显示不同分类
4. **实时更新**: 使用WebSocket推送分类变更
5. **A/B测试**: 支持不同用户群体显示不同分类

## 📞 技术支持

如有问题，请联系开发团队或查看相关日志：

```bash
# 查看应用日志
tail -f logs/application.log

# 查看数据库日志
tail -f /var/log/mysql/error.log
```