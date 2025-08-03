# 📋 API变更日志

本文档记录了短剧API的所有版本变更和更新历史。

## 版本规范

我们遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：
- **主版本号**：不兼容的API修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

---

## v1.0.1 (2024-12-19) - 演员信息增强

### ✨ 新增功能

#### 🎭 演员信息字段
- **数据模型增强**: 为 `series` 表添加演员相关字段
  - `starring`: 主演名单，多个演员用逗号分隔
  - `actor`: 完整演员名单，多个演员用逗号分隔  
  - `director`: 导演信息，多个导演用逗号分隔
- **API响应更新**: `GET /api/video/details` 接口现在返回完整的演员和导演信息
- **数据库迁移**: 提供 `add-actor-fields-to-series.sql` 迁移脚本

### 🔧 改进
- 完善了视频详情接口的响应数据结构
- 更新了API文档，添加了演员字段的详细说明
- 新增测试脚本 `test-actor-fields.js` 用于验证演员字段功能

### 📝 文档更新
- 更新了 `complete-api-documentation.md` 中的视频详情接口说明
- 添加了演员字段的使用示例和字段说明

---

## v1.0.0 (2024-01-01) - 初始版本

### ✨ 新增功能

#### 🔐 认证模块
- 新增 `POST /auth/refresh` - 刷新访问令牌
- 新增 `POST /auth/verify-refresh-token` - 验证刷新令牌
- 新增 `GET /auth/devices` - 获取活跃设备列表
- 新增 `DELETE /auth/devices/:deviceId` - 撤销设备令牌

#### 👤 用户模块
- 新增 `POST /user/telegram-login` - Telegram OAuth登录
- 新增 `GET /user/telegram-login` - Telegram OAuth登录（GET方式）
- 新增 `GET /user/me` - 获取当前用户信息

#### 🏠 首页模块
- 新增 `GET /api/home/getvideos` - 获取首页推荐内容
  - 支持轮播图、过滤器、推荐视频
  - 支持分页和频道筛选

#### 📋 列表模块
- 新增 `GET /api/list/getfilterstags` - 获取筛选器标签
- 新增 `GET /api/list/getfiltersdata` - 根据筛选条件获取视频列表

#### 🎬 视频模块
- 新增 `POST /api/video/progress` - 保存观看进度
- 新增 `GET /api/video/progress` - 获取观看进度
- 新增 `POST /api/video/comment` - 发表评论或弹幕
- 新增 `GET /api/video/details` - 获取视频详情
- 新增 `GET /api/video/media` - 获取用户媒体列表

#### 🌐 公共视频模块
- 新增 `GET /api/public/video/categories` - 获取视频分类
- 新增 `GET /api/public/video/series/list` - 获取系列列表
- 新增 `GET /api/public/video/series/:id` - 获取系列详情
- 新增 `GET /api/public/video/media` - 获取公共媒体列表

#### 🧪 测试模块
- 新增 `GET /test/me` - 测试JWT认证

### 🔧 技术特性
- JWT认证机制
- Bearer Token授权
- 统一的JSON响应格式
- 分页查询支持
- 错误处理机制
- 请求参数验证

### 📊 数据模型
- 用户实体（User）
- 视频系列实体（Series）
- 剧集实体（Episode）
- 观看进度实体（WatchProgress）
- 评论实体（Comment）
- 分类实体（Category）
- 标签实体（Tag）

---

## 🔮 计划中的版本

### v1.1.0 - 增强功能版本（计划中）

#### 🎯 计划新增
- [ ] 用户收藏功能
- [ ] 点赞/评分系统
- [ ] 搜索功能增强
- [ ] 推荐算法优化
- [ ] 社交功能（关注/粉丝）

#### 🛠️ 计划改进
- [ ] 统一错误处理机制
- [ ] 请求参数验证增强
- [ ] 响应格式标准化
- [ ] 性能优化
- [ ] 缓存策略改进

### v1.2.0 - 安全增强版本（计划中）

#### 🔒 安全改进
- [ ] 请求频率限制
- [ ] IP白名单机制
- [ ] 敏感信息保护
- [ ] 审计日志
- [ ] 权限管理系统

#### 📊 监控功能
- [ ] 性能监控
- [ ] 错误追踪
- [ ] 用户行为分析
- [ ] 系统健康检查

---

## 🔄 迁移指南

### 从 v0.x 到 v1.0.0

由于这是初始正式版本，没有向后兼容性问题。

#### 🚀 开始使用
1. 获取API访问权限
2. 实现Telegram OAuth登录
3. 使用JWT Token进行API调用
4. 参考[API快速参考](./api-quick-reference.md)开始开发

---

## 📝 变更类型说明

- ✨ **新增功能** - 新的API接口或功能
- 🔧 **功能改进** - 现有功能的增强
- 🐛 **问题修复** - Bug修复
- 🔒 **安全更新** - 安全相关的改进
- 📊 **性能优化** - 性能相关的改进
- 📝 **文档更新** - 文档相关的更新
- ⚠️ **重大变更** - 不向后兼容的变更
- 🗑️ **废弃功能** - 标记为废弃的功能
- ❌ **移除功能** - 已移除的功能

---

## 📞 联系我们

如果您在使用过程中遇到问题或有建议，请通过以下方式联系我们：

- 📧 邮箱：dev@example.com
- 🐛 问题反馈：[GitHub Issues](https://github.com/your-repo/issues)
- 💬 讨论：[GitHub Discussions](https://github.com/your-repo/discussions)

---

*📅 最后更新: 2024-01-01*  
*📋 维护者: 开发团队*