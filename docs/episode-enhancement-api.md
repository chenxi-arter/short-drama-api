# 剧集功能增强 API 文档

本文档描述了为 `episode` 和 `episode_url` 表新增的功能，包括更新时间字段、续集判断字段和防枚举攻击的加密索引功能。

## 数据库结构变更

### Episodes 表新增字段

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `created_at` | TIMESTAMP | 创建时间 | CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新时间 | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| `has_sequel` | TINYINT(1) | 是否有续集 | 0 |

### Episode_urls 表新增字段

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `access_key` | VARCHAR(64) | 加密索引键（唯一） | - |
| `created_at` | TIMESTAMP | 创建时间 | CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | 更新时间 | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

## API 接口

### 1. 创建剧集播放地址

**接口地址：** `POST /api/video/episode-url`

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求参数：**
```json
{
  "episodeId": 1,
  "quality": "1080p",
  "ossUrl": "https://oss.example.com/video.mp4",
  "cdnUrl": "https://cdn.example.com/video.mp4",
  "subtitleUrl": "https://cdn.example.com/subtitle.srt" // 可选
}
```

**响应示例：**
```json
{
  "id": 123,
  "episodeId": 1,
  "quality": "1080p",
  "ossUrl": "https://oss.example.com/video.mp4",
  "cdnUrl": "https://cdn.example.com/video.mp4",
  "subtitleUrl": "https://cdn.example.com/subtitle.srt",
  "accessKey": "a1b2c3d4e5f6789012345678901234ab",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 2. 通过访问密钥获取播放地址

**接口地址：** `GET /api/video/episode-url/:accessKey`

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
```

**路径参数：**
- `accessKey`: 32位十六进制访问密钥

**响应示例：**
```json
{
  "id": 123,
  "episodeId": 1,
  "quality": "1080p",
  "ossUrl": "https://oss.example.com/video.mp4",
  "cdnUrl": "https://cdn.example.com/video.mp4",
  "subtitleUrl": "https://cdn.example.com/subtitle.srt",
  "accessKey": "a1b2c3d4e5f6789012345678901234ab",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "episode": {
    "id": 1,
    "title": "第一集",
    "series": {
      "id": 1,
      "title": "示例剧集"
    }
  }
}
```

### 3. 更新剧集续集状态

**接口地址：** `POST /api/video/episode-sequel`

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求参数：**
```json
{
  "episodeId": 1,
  "hasSequel": true
}
```

**响应示例：**
```json
{
  "ok": true
}
```

### 4. 批量生成访问密钥

**接口地址：** `POST /api/video/generate-access-keys`

**说明：** 为现有的空 `access_key` 字段批量生成随机密钥

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
```

**响应示例：**
```json
{
  "updated": 25
}
```

## 访问密钥工具类

### AccessKeyUtil 类方法

#### 1. generateAccessKey(length?: number)
生成随机访问密钥
- `length`: 密钥长度，默认32字符
- 返回：随机生成的十六进制字符串

#### 2. generateDeterministicKey(id: number, salt?: string)
基于ID生成确定性访问密钥
- `id`: 实体ID
- `salt`: 盐值，默认使用当前时间戳
- 返回：基于SHA256的32位十六进制字符串

#### 3. isValidAccessKey(key: string)
验证访问密钥格式
- `key`: 待验证的访问密钥
- 返回：是否为有效的32位十六进制格式

#### 4. generateUuidKey()
生成UUID格式的访问密钥（去除连字符）
- 返回：UUID格式的32位十六进制字符串

#### 5. generateBatch(count: number, length?: number)
批量生成访问密钥
- `count`: 生成数量
- `length`: 密钥长度，默认32字符
- 返回：不重复的访问密钥数组

## 安全特性

### 防枚举攻击

1. **随机访问密钥**：每个播放地址都有唯一的32位随机十六进制密钥
2. **密钥验证**：API会验证密钥格式的有效性
3. **唯一性约束**：数据库层面保证访问密钥的唯一性
4. **缓存清理**：相关操作会自动清理缓存，防止数据不一致

### 使用建议

1. **客户端集成**：使用 `accessKey` 替代直接的 `episode_url_id` 来请求播放地址
2. **密钥轮换**：定期更新访问密钥以提高安全性
3. **日志监控**：监控异常的密钥访问模式
4. **缓存策略**：合理设置缓存过期时间，平衡性能和数据一致性

## 错误处理

### 常见错误码

- `400`: 请求参数错误
- `401`: 未授权访问
- `404`: 资源不存在（无效的访问密钥）
- `500`: 服务器内部错误

### 错误响应示例

```json
{
  "statusCode": 404,
  "message": "播放地址不存在",
  "error": "Not Found"
}
```

## 测试

使用提供的测试脚本 `test-episode-features.js` 来验证功能：

```bash
# 安装依赖
npm install axios

# 运行测试
node test-episode-features.js
```

**注意：** 运行API测试前需要设置有效的JWT token。