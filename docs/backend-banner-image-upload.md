# Banner 图片上传后端实现文档

## 概述

本文档说明如何实现 Banner 图片的前端直传 R2 功能。前端会直接上传图片到 Cloudflare R2，不经过后端服务器，避免后端拦截和性能瓶颈。

## 工作流程

1. **前端请求预签名 URL**：前端调用接口获取预签名上传 URL
2. **前端直传 R2**：前端使用预签名 URL 直接上传图片到 R2（不经过后端）
3. **通知后端保存**：上传成功后，前端通知后端更新 Banner 的 `imageUrl` 字段

## 需要实现的接口

### 1. 获取预签名上传 URL

**接口路径：** `GET /api/admin/banners/:id/presigned-upload-url`

**查询参数：**
- `filename`（必填）：文件名，如 `banner.jpg`
- `contentType`（必填）：文件 MIME 类型，如 `image/jpeg`、`image/png`

**响应格式：**
```json
{
  "uploadUrl": "https://0d5622368be0547ffbf1909c86bec606.r2.cloudflarestorage.com/static-storage/banners/123/image_abc123.jpg?X-Amz-Algorithm=...",
  "fileKey": "banners/123/image_abc123.jpg",
  "publicUrl": "https://static.656932.com/banners/123/image_abc123.jpg"
}
```

**实现步骤：**

1. **验证文件类型**
   ```javascript
   // 验证 contentType 是否为允许的图片类型
   const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
   if (!allowedImageTypes.includes(contentType)) {
     return res.status(400).json({ error: 'Invalid image type. Allowed: JPEG, PNG, WebP, GIF' });
   }
   
   // 验证文件扩展名
   const extension = filename.split('.').pop()?.toLowerCase();
   const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
   if (!extension || !allowedExtensions.includes(extension)) {
     return res.status(400).json({ error: 'Invalid file extension' });
   }
   ```

2. **生成文件路径**
   ```javascript
   // 示例：生成唯一的文件路径（使用 UUID 更安全）
   import { randomUUID } from 'crypto';
   
   const bannerId = req.params.id;
   const extension = filename.split('.').pop()?.toLowerCase();
   const fileKey = `banners/${bannerId}/image_${randomUUID()}.${extension}`;
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
     // 添加文件大小限制（可选）
     // ContentLength: 10485760, // 10MB
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

**接口路径：** `POST /api/admin/banners/:id/upload-complete`

**请求体：**
```json
{
  "fileKey": "banners/123/image_abc123.jpg",
  "publicUrl": "https://static.656932.com/banners/123/image_abc123.jpg",
  "fileSize": 524288
}
```

**实现步骤：**

1. **验证参数**
   ```javascript
   const { fileKey, publicUrl, fileSize } = req.body;
   const bannerId = req.params.id;
   
   // 验证必填字段
   if (!fileKey || !publicUrl) {
     return res.status(400).json({ error: 'fileKey and publicUrl are required' });
   }
   
   // 验证 Banner 是否存在
   const banner = await Banner.findByPk(bannerId);
   if (!banner) {
     return res.status(404).json({ error: 'Banner not found' });
   }
   ```

2. **更新 Banner 的 imageUrl**
   ```javascript
   // 示例：使用 Sequelize/TypeORM 等 ORM
   await banner.update({
     imageUrl: publicUrl,
     updatedAt: new Date(),
   });
   ```

3. **返回成功响应**
   ```javascript
   res.json({
     success: true,
     message: 'Image upload completed',
     imageUrl: publicUrl,
   });
   ```

## R2 CORS 配置（重要）

为了让前端能够直接上传到 R2，必须配置 CORS 规则。在 Cloudflare R2 控制台中配置：

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

1. **预签名 URL 有效期**：建议设置为 1 小时（3600 秒），避免 URL 泄露后被长期滥用

2. **文件大小限制**：可以在生成预签名 URL 时添加 `ContentLength` 限制（建议图片不超过 10MB）
   ```javascript
   // 在 PutObjectCommand 中添加
   ContentLength: 10485760, // 10MB
   ```

3. **文件类型验证**：验证 `contentType` 是否为允许的图片类型（`image/jpeg`、`image/png`、`image/webp` 等）

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

6. **环境变量安全**：
   - 不要将 R2 密钥提交到代码仓库
   - 使用 `.env` 文件并添加到 `.gitignore`
   - 生产环境使用环境变量或密钥管理服务

## 错误处理

- **400 Bad Request**：参数缺失或格式错误
- **404 Not Found**：Banner 不存在
- **403 Forbidden**：用户无权限
- **500 Internal Server Error**：服务器错误（R2 连接失败等）

## 测试示例

```bash
# 1. 获取预签名 URL
curl -X GET "http://localhost:8080/api/admin/banners/123/presigned-upload-url?filename=banner.jpg&contentType=image/jpeg"

# 2. 使用预签名 URL 上传（前端执行）
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @banner.jpg

# 3. 通知后端上传完成
curl -X POST "http://localhost:8080/api/admin/banners/123/upload-complete" \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "banners/123/image_abc123.jpg",
    "publicUrl": "https://static.656932.com/banners/123/image_abc123.jpg",
    "fileSize": 524288
  }'
```

## 与旧接口的兼容性

如果之前有实现 `POST /api/admin/banners/:id/image` 接口（通过后端上传），可以保留该接口作为备用方案，但建议迁移到新的预签名 URL 方式，以获得更好的性能和用户体验。

