# Ingest API 测试数据说明

本目录包含了用于测试 Ingest API 的完整测试数据文件和测试脚本。

## 文件说明

### 1. 测试数据文件

#### `ingest-test-data.json` - 批量测试数据
- **用途**: 测试批量系列入库接口 `/api/admin/ingest/series/batch`
- **内容**: 包含5个不同类别的系列，涵盖各种状态和配置
- **特点**: 
  - 包含已完结和更新中的系列
  - 不同质量级别的视频URL (360p, 480p, 720p, 1080p, 4K)
  - 部分剧集包含字幕，部分没有
  - 不同的剧集状态 (published, draft)

#### `ingest-single-series.json` - 单个系列测试数据
- **用途**: 测试单个系列入库接口 `/api/admin/ingest/series`
- **内容**: 一个完整的系列数据，包含3个剧集
- **特点**: 
  - 包含所有必填字段
  - 多种视频质量
  - 不同的字幕配置

#### `ingest-update-test.json` - 增量更新测试数据
- **用途**: 测试增量更新接口 `/api/admin/ingest/series/update`
- **内容**: 基于 `ingest-single-series.json` 的更新数据
- **特点**: 
  - 只更新部分字段
  - 新增剧集
  - 更新现有剧集的URL

### 2. 测试脚本

#### `test-ingest-api.js` - 自动化测试脚本
- **功能**: 自动测试所有 Ingest API 接口
- **测试项目**:
  - 单个系列入库
  - 批量系列入库
  - 增量更新
  - 错误情况处理
- **输出**: 彩色控制台输出，清晰显示测试结果

## 使用方法

### 前置条件

1. 确保你的 API 服务正在运行
2. 确保数据库中有必要的分类和选项数据
3. 确保使用 Node.js 18+ 或安装了 `node-fetch`

### 运行测试

#### 方法1: 直接运行测试脚本
```bash
cd scripts
node test-ingest-api.js
```

#### 方法2: 手动测试单个接口

**测试单个系列入库:**
```bash
curl -X POST http://localhost:3000/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -d @ingest-single-series.json
```

**测试批量系列入库:**
```bash
curl -X POST http://localhost:3000/api/admin/ingest/series/batch \
  -H "Content-Type: application/json" \
  -d @ingest-test-data.json
```

**测试增量更新:**
```bash
curl -X POST http://localhost:3000/api/admin/ingest/series/update \
  -H "Content-Type: application/json" \
  -d @ingest-update-test.json
```

### 测试流程建议

1. **首次测试**: 先运行单个系列入库测试
2. **验证数据**: 检查数据库中是否正确创建了系列和剧集
3. **批量测试**: 运行批量入库测试
4. **更新测试**: 运行增量更新测试
5. **错误测试**: 运行错误情况测试

## 数据字段说明

### 必填字段
- `externalId`: 外部唯一标识符
- `title`: 系列标题
- `description`: 系列描述
- `coverUrl`: 封面图片URL
- `categoryId`: 分类ID
- `status`: 系列状态 (on-going/completed)
- `releaseDate`: 发布日期 (ISO格式)
- `isCompleted`: 是否完结
- `score`: 评分 (0-10)
- `playCount`: 播放次数
- `upStatus`: 更新状态
- `upCount`: 更新次数
- `starring`: 主演 (逗号分隔)
- `actor`: 全演员 (逗号分隔)
- `director`: 导演
- `regionOptionId`: 地区选项ID
- `languageOptionId`: 语言选项ID
- `statusOptionId`: 状态选项ID
- `yearOptionId`: 年份选项ID

### 剧集字段
- `episodeNumber`: 剧集编号
- `title`: 剧集标题
- `duration`: 时长 (秒)
- `status`: 剧集状态 (published/hidden/draft)

### URL字段
- `quality`: 视频质量 (360p/480p/720p/1080p/4K)
- `ossUrl`: OSS存储URL
- `cdnUrl`: CDN加速URL
- `subtitleUrl`: 字幕文件URL (可选)
- `originUrl`: 原始来源URL

## 注意事项

1. **分类ID**: 确保 `categoryId` 对应的分类在数据库中存在
2. **选项ID**: 确保各种 `*OptionId` 在 `filter_options` 表中存在
3. **URL格式**: 所有URL应该是有效的HTTP/HTTPS链接
4. **数据一致性**: `externalId` 用于幂等性，相同ID会更新现有记录
5. **文件大小**: 批量数据建议控制在100条以内，避免超时

## 故障排除

### 常见错误

1. **400 Bad Request**: 检查必填字段是否完整
2. **404 Not Found**: 检查API路径是否正确
3. **500 Internal Server Error**: 检查数据库连接和表结构
4. **超时错误**: 减少批量数据量或增加超时时间

### 调试建议

1. 使用 `console.log` 或日志查看详细的错误信息
2. 检查数据库表结构和约束
3. 验证分类和选项数据的完整性
4. 确认API服务的运行状态

## 扩展测试

你可以基于这些测试数据创建更多的测试场景：

1. **边界值测试**: 测试字段长度限制
2. **特殊字符测试**: 测试包含特殊字符的文本
3. **并发测试**: 测试同时处理多个请求
4. **性能测试**: 测试大量数据的处理性能
5. **安全测试**: 测试SQL注入等安全问题
