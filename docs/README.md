# 📚 短剧API文档中心

欢迎来到短剧API项目的文档中心！这里包含了项目的所有技术文档、API接口说明和开发指南。

## 🚀 快速开始

### 新手必读
1. 📖 [完整API文档](./complete-api-documentation.md) - 详细的接口说明和使用指南
2. ⚡ [API快速参考](./api-quick-reference.md) - 快速查找接口信息
3. 🔧 [OpenAPI规范](./apifox-openapi.json) - 标准化API接口定义

### 数据库相关
4. 🗄️ [数据库表结构](./mysql.md) - 完整的数据库设计文档
5. 📊 [实体关系图](./entity-relationship-diagram.svg) - 数据库ER图

## 🛠️ 技术指南

### 架构和优化
- 🏗️ [NestJS结构优化](./nestjs-structure-optimization.md) - 项目架构优化指南
- 📋 [健壮性实现指南](./robustness-implementation-guide.md) - 系统稳定性和容错机制
- ✅ [结构优化完成](./structure-optimization-completed.md) - 项目结构优化总结

### 缓存和性能
- ⚡ [Redis缓存指南](./redis-cache-guide.md) - 缓存策略、使用方法和主动失效机制

### 认证和安全
- 🔐 [Token刷新实现](./token-refresh-implementation.md) - JWT令牌刷新机制
- 🛡️ [防枚举攻击安全指南](./anti-enumeration-security-guide.md) - 安全防护措施和JWT Token管理

## 📋 文档分类

### 📖 API文档
| 文档 | 描述 | 适用人群 |
|------|------|----------|
| [完整API文档](./complete-api-documentation.md) | 详细的接口说明、参数、响应格式 | 所有开发者 |
| [API快速参考](./api-quick-reference.md) | 接口速查表和常用示例 | 有经验的开发者 |
| [API变更日志](./api-changelog.md) | API版本变更记录 | 所有开发者 |
| [API测试示例](./api-test-examples.md) | 接口测试用例和示例 | 测试人员、开发者 |
| [Apifox导入指南](./apifox-import-guide.md) | API文档导入工具使用指南 | 所有开发者 |
| [分类列表API](./category-list-api.md) | 分类相关接口 | 前端开发者 |
| [视频详情使用指南](./video-details-usage-guide.md) | 视频详情接口使用说明 | 前端开发者 |
| [UUID实现示例](./uuid-implementation-example.md) | UUID防枚举攻击实现 | 后端开发者 |
| [OpenAPI规范](./apifox-openapi.json) | 标准化API接口定义文件 | 工具集成、自动化测试 |

### 🗄️ 数据库文档
| 文档 | 描述 | 适用人群 |
|------|------|----------|
| [数据库表结构](./mysql.md) | 完整的数据库表设计和字段说明 | 后端开发者、DBA |
| [实体关系图](./entity-relationship-diagram.svg) | 可视化数据库关系图 | 架构师、开发者 |

### 🏗️ 架构文档
| 文档 | 描述 | 适用人群 |
|------|------|----------|
| [NestJS结构优化](./nestjs-structure-optimization.md) | 项目架构设计和优化方案 | 架构师、高级开发者 |

### ⚡ 性能文档
| 文档 | 描述 | 适用人群 |
|------|------|----------|
| [Redis缓存指南](./redis-cache-guide.md) | 缓存策略和Redis使用 | 后端开发者、运维人员 |

### 🔐 安全文档
| 文档 | 描述 | 适用人群 |
|------|------|----------|
| [Token刷新实现](./token-refresh-implementation.md) | JWT令牌管理机制 | 前端、后端开发者 |

## 🎯 使用场景

### 🆕 我是新开发者
1. 先阅读 [完整API文档](./complete-api-documentation.md) 了解整体架构
2. 查看 [API快速参考](./api-quick-reference.md) 快速上手
3. 了解 [数据库表结构](./mysql.md) 掌握数据模型
4. 查看 [实体关系图](./entity-relationship-diagram.svg) 理解数据关系

### 🔍 我要查找特定接口
1. 使用 [API快速参考](./api-quick-reference.md) 快速定位
2. 在 [完整API文档](./complete-api-documentation.md) 中查看详细说明
3. 导入 [OpenAPI规范](./apifox-openapi.json) 到API工具中测试

### 🐛 我遇到了问题
1. 检查 [完整API文档](./complete-api-documentation.md) 确认接口使用方法
2. 参考 [NestJS结构优化](./nestjs-structure-optimization.md) 了解架构设计
3. 查看 [数据库表结构](./mysql.md) 确认数据模型

### 🚀 我要优化性能
1. 阅读 [Redis缓存指南](./redis-cache-guide.md) 了解缓存策略
2. 查看 [NestJS结构优化](./nestjs-structure-optimization.md) 了解架构优化
3. 分析 [数据库表结构](./mysql.md) 优化查询性能

### 🔐 我要处理认证问题
1. 查看 [Token刷新实现](./token-refresh-implementation.md) 了解令牌机制
2. 参考 [完整API文档](./complete-api-documentation.md) 中的认证部分

### 🛠️ 我要集成API
1. 下载 [OpenAPI规范](./apifox-openapi.json) 文件
2. 导入到 Postman、Apifox 等API工具中
3. 参考 [API快速参考](./api-quick-reference.md) 进行快速集成

## 📁 项目文件结构

### 📚 docs 目录（20个文件）

#### 📖 API文档类 (9个文件)
- `complete-api-documentation.md` - 完整API文档 (1645行)
- `api-quick-reference.md` - API快速参考手册
- `api-changelog.md` - API版本变更记录
- `api-test-examples.md` - API测试示例
- `apifox-import-guide.md` - Apifox导入指南
- `apifox-openapi.json` - OpenAPI规范文件
- `category-list-api.md` - 分类列表API文档
- `video-details-usage-guide.md` - 视频详情使用指南
- `uuid-implementation-example.md` - UUID实现示例

#### 🏗️ 技术架构类 (5个文件)
- `nestjs-structure-optimization.md` - NestJS结构优化
- `structure-optimization-completed.md` - 结构优化完成总结
- `robustness-implementation-guide.md` - 健壮性实现指南
- `file-organization-plan.md` - 文件整理计划
- `directory-optimization-summary.md` - 目录整理优化总结

#### 🔐 安全认证类 (2个文件)
- `anti-enumeration-security-guide.md` - 防枚举攻击安全指南
- `token-refresh-implementation.md` - Token刷新实现

#### ⚡ 性能优化类 (1个文件)
- `redis-cache-guide.md` - Redis缓存指南

#### 🗄️ 数据库类 (2个文件)
- `mysql.md` - 数据库表结构文档
- `entity-relationship-diagram.svg` - 实体关系图

#### 📋 索引文档 (1个文件)
- `README.md` - 文档中心索引

### 🗄️ migrations 目录（13个文件）

#### 🚀 完整初始化 (2个文件)
- `complete-setup.sql` - 完整数据库初始化脚本 (504行)
- `insert-test-data.sql` - 测试数据插入脚本

#### 🔧 功能增强 (4个文件)
- `add-uuid-fields.sql` - UUID字段添加脚本
- `add-series-filter-fields.sql` - 系列筛选字段脚本
- `add-actor-fields-to-series.sql` - 演员信息字段脚本
- `add-episode-fields.sql` - 剧集字段增强脚本

#### 📊 结构优化 (3个文件)
- `update-series-category-relation.sql` - 系列分类关系更新
- `update-category-table.sql` - 分类表结构更新
- `update-category-data.sql` - 分类数据更新

#### 🛠️ 数据管理 (1个文件)
- `check-data-stats.sql` - 数据统计检查脚本

#### 🔧 辅助工具 (2个文件)
- `run-test-data.sh` - 一键执行测试数据插入
- `README.md` - 迁移脚本说明文档