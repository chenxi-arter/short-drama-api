# 剧集视频上传后端实现文档

## 概述

本文档说明如何实现剧集视频的前端直传 R2 功能。前端会直接上传视频到 Cloudflare R2，不经过后端服务器，避免后端拦截和性能瓶颈。

## 工作流程

1. **前端请求预签名 URL**：前端调用接口获取预签名上传 URL
2. **前端直传 R2**：前端使用预签名 URL 直接上传视频到 R2（不经过后端）
3. **通知后端保存**：上传成功后，前端通知后端保存文件信息到数据库

## 需要实现的接口

### 1. 获取预签名上传 URL

**接口路径：** `GET /api/admin/episodes/:id/presigned-upload-url`

**查询参数：**
- `filename`（必填）：文件名，如 `video.mp4`
- `contentType`（必填）：文件 MIME 类型，如 `video/mp4`
- `quality`（可选）：清晰度标识，如 `360p`、`480p`、`720p`、`1080p`

**响应格式：**
```json
{
  "uploadUrl": "https://0d5622368be0547ffbf1909c86bec606.r2.cloudflarestorage.com/static-storage/episodes/123/video_720p_abc123.mp4?X-Amz-Algorithm=...",
  "fileKey": "episodes/123/video_720p_abc123.mp4",
  "publicUrl": "https://static.656932.com/episodes/123/video_720p_abc123.mp4"
}
```

**实现步骤：**

1. **验证文件类型**
   ```javascript
   // 验证 contentType 是否为允许的视频类型
   const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
   if (!allowedVideoTypes.includes(contentType)) {
     return res.status(400).json({ error: 'Invalid video type. Allowed: MP4, MPEG, MOV, AVI, WebM' });
   }
   
   // 验证文件扩展名
   const extension = filename.split('.').pop()?.toLowerCase();
   const allowedExtensions = ['mp4', 'mpeg', 'mpg', 'mov', 'avi', 'webm'];
   if (!extension || !allowedExtensions.includes(extension)) {
     return res.status(400).json({ error: 'Invalid file extension' });
   }
   
   // 验证清晰度参数
   const allowedQualities = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];
   if (quality && !allowedQualities.includes(quality)) {
     return res.status(400).json({ error: 'Invalid quality parameter' });
   }
   ```

2. **生成文件路径**
   ```javascript
   // 示例：生成唯一的文件路径（使用 UUID 更安全）
   import { randomUUID } from 'crypto';
   
   const episodeId = req.params.id;
   const quality = req.query.quality || '720p';
   const extension = filename.split('.').pop()?.toLowerCase();
   const fileKey = `episodes/${episodeId}/video_${quality}_${randomUUID()}.${extension}`;
   ```

3. **生成预签名 URL**
   
   使用 AWS SDK（R2 兼容 S3 API）生成预签名 PUT URL：
   
   ```javascript
   // Node.js 示例（使用 @aws-sdk/client-s3）
   const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
   const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
   
   const s3Client = new S3Client({
     region: 'auto',
     endpoint: process.env.R2_ENDPOINT_URL,
     credentials: {
       accessKeyId: process.env.R2_ACCESS_KEY_ID,
       secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
     },
   });
   
   const command = new PutObjectCommand({
     Bucket: process.env.R2_BUCKET_NAME,
     Key: fileKey,
     ContentType: contentType,
     // 添加文件大小限制（可选，视频文件建议设置更大的限制）
     // ContentLength: 524288000, // 500MB
   });
   
   const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1小时有效期
   ```

4. **构建响应**
   ```javascript
   const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${fileKey}`;
   
   res.json({
     uploadUrl,
     fileKey,
     publicUrl,
   });
   ```

### 2. 上传完成通知接口

**接口路径：** `POST /api/admin/episodes/:id/upload-complete`

**请求体：**
```json
{
  "fileKey": "episodes/123/video_720p_abc123.mp4",
  "publicUrl": "https://static.656932.com/episodes/123/video_720p_abc123.mp4",
  "quality": "720p",
  "fileSize": 10485760
}
```

**实现步骤：**

1. **验证参数**
   ```javascript
   const { fileKey, publicUrl, quality, fileSize } = req.body;
   const episodeId = req.params.id;
   
   // 验证必填字段
   if (!fileKey || !publicUrl) {
     return res.status(400).json({ error: 'fileKey and publicUrl are required' });
   }
   ```

2. **保存到数据库**
   
   创建或更新 `EpisodeUrl` 记录：
   
   ```javascript
   // 示例：使用 Sequelize/TypeORM 等 ORM
   const episodeUrl = await EpisodeUrl.findOne({
     where: {
       episodeId,
       quality: quality || null,
     },
   });
   
   if (episodeUrl) {
     // 更新现有记录
     await episodeUrl.update({
       cdnUrl: publicUrl,
       ossUrl: publicUrl,
       originUrl: publicUrl,
       updatedAt: new Date(),
     });
   } else {
     // 创建新记录
     await EpisodeUrl.create({
       episodeId,
       quality: quality || null,
       cdnUrl: publicUrl,
       ossUrl: publicUrl,
       originUrl: publicUrl,
       accessKey: generateAccessKey(), // 如果需要生成访问密钥
     });
   }
   ```

3. **返回成功响应**
   ```javascript
   res.json({
     success: true,
     message: 'Video upload completed',
   });
   ```

## R2 CORS 配置（重要）

为了让前端能够直接上传视频到 R2，必须配置 CORS 规则。在 Cloudflare R2 控制台中配置：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**配置步骤：**
1. 登录 Cloudflare Dashboard
2. 进入 R2 → 选择你的 Bucket (`static-storage`)
3. 点击 "Settings" → "CORS Policy"
4. 添加上述 CORS 规则

## 环境变量配置

确保后端环境变量中包含以下 R2 配置：

```bash
R2_ENDPOINT_URL=https://0d5622368be0547ffbf1909c86bec606.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=505fa24e50ff930000ef20c1907f46c4
R2_SECRET_ACCESS_KEY=349840b0bf94bc4ce2dee9eaa533df0c10f4f9c943bcda75499c6c5e349db879
R2_BUCKET_NAME=static-storage
R2_PUBLIC_BASE_URL=https://static.656932.com
```

## 依赖安装

### Node.js (使用 AWS SDK v3)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Python (使用 boto3)

```bash
pip install boto3
```

```python
import boto3
from botocore.config import Config

s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('R2_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    config=Config(signature_version='s3v4'),
    region_name='auto',
)

# 生成预签名 URL
presigned_url = s3_client.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': os.getenv('R2_BUCKET_NAME'),
        'Key': file_key,
        'ContentType': content_type,
    },
    ExpiresIn=3600,
)
```

## 安全注意事项

1. **预签名 URL 有效期**：建议设置为 1-2 小时（3600-7200 秒），大文件上传需要更长时间

2. **文件大小限制**：可以在生成预签名 URL 时添加 `ContentLength` 限制
   ```javascript
   // 在 PutObjectCommand 中添加
   ContentLength: 524288000, // 500MB
   // 或根据清晰度动态设置：
   // 720p: 200MB, 1080p: 500MB, 4K: 2GB
   ```

3. **文件类型验证**：验证 `contentType` 是否为允许的视频类型（`video/mp4`、`video/webm` 等）

4. **路径安全**：防止路径遍历攻击
   ```javascript
   // 验证文件名不包含危险字符
   if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
     return res.status(400).json({ error: 'Invalid filename' });
   }
   ```

5. **权限验证**：确保只有授权的管理员用户可以获取预签名 URL 和通知上传完成
   - 使用 JWT 或 Session 验证
   - 检查用户角色/权限
   - 验证用户是否有权限管理该剧集

6. **环境变量安全**：
   - 不要将 R2 密钥提交到代码仓库
   - 使用 `.env` 文件并添加到 `.gitignore`
   - 生产环境使用环境变量或密钥管理服务

7. **上传进度监控**：
   - 建议前端实现上传进度条
   - 支持断点续传（可使用分片上传）
   - 大文件建议使用 Multipart Upload API

## 错误处理

- **400 Bad Request**：参数缺失或格式错误
- **404 Not Found**：剧集不存在
- **403 Forbidden**：用户无权限
- **500 Internal Server Error**：服务器错误（R2 连接失败等）

## 测试示例

```bash
# 1. 获取预签名 URL
curl -X GET "http://localhost:8080/api/admin/episodes/123/presigned-upload-url?filename=video.mp4&contentType=video/mp4&quality=720p"

# 2. 使用预签名 URL 上传（前端执行）
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: video/mp4" \
  --data-binary @video.mp4

# 3. 通知后端上传完成
curl -X POST "http://localhost:8080/api/admin/episodes/123/upload-complete" \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "episodes/123/video_720p_abc123.mp4",
    "publicUrl": "https://static.656932.com/episodes/123/video_720p_abc123.mp4",
    "quality": "720p",
    "fileSize": 10485760
  }'
```

## 大文件分片上传（高级）

对于超大视频文件（> 500MB），建议使用 S3 Multipart Upload API：

### 优势
- 支持断点续传
- 提高上传成功率
- 可并行上传分片

### 实现流程
1. **初始化分片上传**：`POST /api/admin/episodes/:id/multipart-upload/init`
2. **获取分片预签名 URL**：`GET /api/admin/episodes/:id/multipart-upload/part-url`
3. **完成分片上传**：`POST /api/admin/episodes/:id/multipart-upload/complete`
4. **取消上传**：`DELETE /api/admin/episodes/:id/multipart-upload/:uploadId`

这部分实现较复杂，如有需要可以单独提供详细文档。

