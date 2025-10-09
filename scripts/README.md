# 测试脚本说明

本目录包含了用于测试各个功能模块的脚本。

## 📁 文件列表

### 核心功能测试

#### `test-download-urls.js` - 测试剧集下载地址接口
- **用途**: 测试获取剧集下载地址的 Admin API
- **接口**: `GET /api/admin/episodes/:id/download-urls`
- **使用方法**:
  ```bash
  # 测试指定剧集ID的下载地址
  node scripts/test-download-urls.js [episodeId]
  
  # 示例：测试剧集ID为2136的下载地址
  node scripts/test-download-urls.js 2136
  ```
- **环境变量**:
  - `ADMIN_API_URL`: Admin API 基础地址（默认: `http://localhost:8080/api`）
- **输出内容**:
  - 剧集基本信息（系列名、标题、集数、时长等）
  - 所有清晰度的下载地址（CDN、OSS、原始地址、字幕）
  - AccessKey 信息

#### `download-episode.js` - 下载剧集视频 ⭐ 新增
- **用途**: 直接下载剧集视频文件到本地
- **功能**:
  - 自动获取下载地址
  - 支持选择清晰度
  - 自动下载字幕（如果有）
  - 智能文件命名
- **使用方法**:
  ```bash
  # 下载剧集（使用第一个可用清晰度）
  node scripts/download-episode.js <episodeId>
  
  # 下载指定清晰度
  node scripts/download-episode.js <episodeId> <quality>
  
  # 下载到指定目录
  node scripts/download-episode.js <episodeId> <quality> <outputDir>
  
  # 示例
  node scripts/download-episode.js 28808                    # 下载剧集28808
  node scripts/download-episode.js 28808 1080p            # 下载1080p清晰度
  node scripts/download-episode.js 28808 720p ./videos    # 下载到./videos目录
  ```
- **环境变量**:
  - `ADMIN_API_URL`: Admin API 基础地址（默认: `http://localhost:8080/api`）
- **输出文件命名格式**: `系列名_EP集数_清晰度.mp4`

#### `test-ingest-api.js` - 测试内容入库接口
- **用途**: 测试系列和剧集的批量入库功能
- **功能**:
  - 单个系列入库
  - 批量系列入库
  - 增量更新
  - 错误情况处理
- **使用方法**:
  ```bash
  node scripts/test-ingest-api.js
  ```
- 详细说明见 [README-ingest-test.md](./README-ingest-test.md)

#### `test-recommend.js` - 测试推荐功能
- **用途**: 测试视频推荐算法
- **使用方法**:
  ```bash
  node scripts/test-recommend.js
  ```

#### `test-access-key.js` - 测试访问密钥
- **用途**: 测试剧集和URL的访问密钥功能
- **使用方法**:
  ```bash
  node scripts/test-access-key.js
  ```

### 认证相关测试

#### `test-telegram-login.js` - 测试 Telegram 登录
- **用途**: 测试 Telegram 第三方登录功能
- **使用方法**:
  ```bash
  node scripts/test-telegram-login.js
  ```

#### `test-email-telegram-flow.js` - 测试邮箱与 Telegram 绑定
- **用途**: 测试邮箱登录和 Telegram 账号绑定流程
- **使用方法**:
  ```bash
  node scripts/test-email-telegram-flow.js
  ```

#### `test-account-merge.js` - 测试账号合并
- **用途**: 测试账号合并功能
- **使用方法**:
  ```bash
  node scripts/test-account-merge.js
  ```

#### `test-native-multi-login.js` - 测试多设备登录
- **用途**: 测试原生多设备登录功能
- **使用方法**:
  ```bash
  node scripts/test-native-multi-login.js
  ```

### 数据处理

#### `test-browse-history-optimization.js` - 测试浏览历史优化
- **用途**: 测试浏览历史记录优化功能
- **使用方法**:
  ```bash
  node scripts/test-browse-history-optimization.js
  ```

#### `test-ingest-isVertical.js` - 测试视频方向字段
- **用途**: 测试剧集的横竖屏方向字段
- **使用方法**:
  ```bash
  node scripts/test-ingest-isVertical.js
  ```

### 数据生成

#### `generate-test-data.js` - 生成测试数据
- **用途**: 生成用于测试的模拟数据
- **使用方法**:
  ```bash
  node scripts/generate-test-data.js
  ```

#### `generate-token.js` - 生成测试 Token
- **用途**: 生成用于 API 测试的 JWT Token
- **使用方法**:
  ```bash
  node scripts/generate-token.js [userId]
  ```

#### `insert-test-data.js` - 插入测试数据
- **用途**: 向数据库插入测试数据
- **使用方法**:
  ```bash
  node scripts/insert-test-data.js
  ```

### 批量操作

#### `ingest-bulk-insert.js` - 批量入库
- **用途**: 批量导入系列和剧集数据
- **使用方法**:
  ```bash
  node scripts/ingest-bulk-insert.js
  ```

#### `ingest-insert-sample.js` - 插入样例数据
- **用途**: 插入单个样例系列数据
- **使用方法**:
  ```bash
  node scripts/ingest-insert-sample.js
  ```

### 数据迁移

#### `migrate-to-short-id.ts` - 迁移到 ShortID
- **用途**: 将旧数据迁移到使用 ShortID 的新格式
- **使用方法**:
  ```bash
  ts-node scripts/migrate-to-short-id.ts
  ```

## 🔧 环境变量

大部分测试脚本支持以下环境变量：

- `API_URL` 或 `CLIENT_API_URL`: 客户端 API 基础地址（默认: `http://localhost:3000/api`）
- `ADMIN_API_URL`: 管理端 API 基础地址（默认: `http://localhost:8080/api`）
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: 数据库连接信息

## 📝 使用建议

1. **运行前准备**
   - 确保服务已启动（客户端和管理端）
   - 确认数据库连接正常
   - 检查必要的环境变量已设置

2. **测试顺序**
   - 先运行数据生成/插入脚本准备测试数据
   - 再运行具体功能的测试脚本
   - 最后运行清理脚本（如果有）

3. **调试技巧**
   - 使用 `DEBUG=*` 环境变量查看详细日志
   - 检查测试脚本的输出信息
   - 查看服务端日志排查问题

## 📚 相关文档

- [API 文档](../docs/README.md)
- [Ingest API 详细说明](./README-ingest-test.md)
- [开发指南](../docs/development-guide.md)

