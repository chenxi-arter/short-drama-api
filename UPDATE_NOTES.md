# 📋 更新说明

## v2.1 更新 (2025年9月13日)

### 🎯 主要改进

#### 1. 播放地址接口返回结构优化
- **问题**: 前端期望直接获取播放数据对象，而不是嵌套在 `data.data` 中
- **解决方案**: 修改返回结构，播放数据直接放在 `data` 字段中
- **影响接口**: 
  - `POST /api/video/episode-url/query`
  - `GET /api/video/url/access/:accessKey`

#### 2. 搜索功能精确匹配优化
- **问题**: 搜索 "test1" 时返回 "test1999" 而不是完全匹配的 "test1"
- **解决方案**: 改进搜索优先级算法
- **优化内容**:
  - 完全匹配 (title = keyword) - 优先级 1
  - 前缀匹配 (title LIKE 'keyword%') - 优先级 2  
  - 包含匹配 (title LIKE '%keyword%') - 优先级 3
  - 添加标题长度排序，确保精确匹配优先

#### 3. Redis认证支持增强
- **新增功能**: 支持Redis 6.0+的用户名密码认证
- **支持的环境变量**:
  - 用户名: `REDIS_USERNAME` 或 `REDIS_USER`
  - 密码: `REDIS_PASSWORD` 或 `REDIS_PASS`
- **配置示例**:
  ```bash
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_USERNAME=your_username
  REDIS_PASSWORD=Drama@456
  REDIS_DB=0
  ```

### 🔧 技术细节

#### 修改的文件
- `src/video/services/url.service.ts` - 播放地址服务
- `src/video/services/filter.service.ts` - 搜索服务
- `src/video/services/play-count.service.ts` - 播放计数服务
- `src/cache/cache.module.ts` - 缓存模块
- `src/core/config/redis.config.ts` - Redis配置类
- `src/common/config/app-config.service.ts` - 应用配置服务
- `src/core/config/config.module.ts` - 配置模块

#### 向后兼容性
- ✅ 播放地址接口返回格式变更，但保持API路径不变
- ✅ Redis认证支持向后兼容，无认证信息时自动降级
- ✅ 搜索接口保持原有参数格式，仅优化排序逻辑

### 📚 相关文档
- [API变更文档](docs/api-changes-documentation.md) - 详细的接口变更说明
- [前端API指南](docs/frontend-api-guide.md) - 前端集成指南
- [Redis缓存指南](docs/redis-cache-guide.md) - Redis配置说明

### 🚀 部署建议
1. 更新代码后重新编译: `npm run build`
2. 重启应用服务
3. 如使用Redis认证，请更新环境变量配置
4. 前端需要相应调整播放地址接口的数据获取逻辑

---
*最后更新: 2025年9月13日*
