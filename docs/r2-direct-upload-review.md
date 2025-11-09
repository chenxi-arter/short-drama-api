# R2 直传实现方案评估报告

## 📋 评估结论

**前端直传 R2 的实现方案是完全可行的！** ✅

前端提供的技术方案基于 AWS S3 预签名 URL 机制，Cloudflare R2 完全兼容该 API，实现起来没有技术障碍。

## 🔧 已进行的文档改进

### 1. **安全性增强**

#### 原方案问题：
```javascript
// 使用 Math.random() 生成文件名（不够安全）
const randomStr = Math.random().toString(36).substring(2, 8);
```

#### 改进后：
```javascript
// 使用 crypto.randomUUID() 生成唯一文件名
import { randomUUID } from 'crypto';
const fileKey = `banners/${bannerId}/image_${randomUUID()}.${extension}`;
```

### 2. **添加文件类型验证**

原文档缺少详细的文件类型验证代码，现已添加：

**图片上传验证：**
```javascript
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
```

**视频上传验证：**
```javascript
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const allowedExtensions = ['mp4', 'mpeg', 'mpg', 'mov', 'avi', 'webm'];
```

### 3. **添加 CORS 配置说明（重要！）**

原文档缺少 CORS 配置，这会导致前端上传失败。已添加详细配置步骤：

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**⚠️ 必须在 Cloudflare R2 控制台配置 CORS，否则前端上传会被浏览器拦截！**

### 4. **添加路径遍历攻击防护**

```javascript
// 验证文件名不包含危险字符
if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
  return res.status(400).json({ error: 'Invalid filename' });
}
```

### 5. **完善安全注意事项**

- 添加了环境变量安全提醒
- 添加了权限验证要求
- 添加了文件大小限制建议
- 添加了大文件分片上传说明

## 📦 需要安装的依赖

项目中**缺少一个必需的包**：

```bash
npm install @aws-sdk/s3-request-presigner
```

现有依赖检查：
- ✅ `@aws-sdk/client-s3` (已安装 v3.676.0)
- ❌ `@aws-sdk/s3-request-presigner` (未安装，需要安装)

## 🔨 实施步骤

### 1. 安装缺失的依赖

```bash
cd /Users/mac/work/short-drama-api
npm install @aws-sdk/s3-request-presigner
```

### 2. 配置 R2 CORS（必须！）

1. 登录 Cloudflare Dashboard
2. 进入 R2 → 选择 `static-storage` bucket
3. 点击 "Settings" → "CORS Policy"
4. 添加以下 CORS 规则：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. 扩展 R2StorageService

当前的 `R2StorageService` 只有 `uploadBuffer()` 方法，需要添加生成预签名 URL 的方法。

**建议添加以下方法：**

```typescript
// src/core/storage/r2-storage.service.ts

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

async generatePresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  this.ensureInitialized();

  const command = new PutObjectCommand({
    Bucket: this.bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  return await getSignedUrl(this.s3, command, { expiresIn });
}

getPublicUrl(fileKey: string): string {
  const base = (this.publicBaseUrl ?? this.endpointBucketBase).replace(/\/$/, '');
  return `${base}/${fileKey}`;
}
```

### 4. 实现 Banner 图片上传接口

在 `AdminBannersController` 中添加：

```typescript
// GET /api/admin/banners/:id/presigned-upload-url
@Get(':id/presigned-upload-url')
async getPresignedUploadUrl(
  @Param('id') id: string,
  @Query('filename') filename: string,
  @Query('contentType') contentType: string,
) {
  // 验证 Banner 存在
  const banner = await this.bannerRepo.findOne({ where: { id: Number(id) } });
  if (!banner) {
    throw new NotFoundException('Banner not found');
  }

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(contentType)) {
    throw new BadRequestException('Invalid image type');
  }

  // 验证文件名
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new BadRequestException('Invalid filename');
  }

  // 生成文件路径
  const extension = filename.split('.').pop()?.toLowerCase();
  const fileKey = `banners/${id}/image_${randomUUID()}.${extension}`;

  // 生成预签名 URL
  const uploadUrl = await this.storage.generatePresignedUploadUrl(fileKey, contentType, 3600);
  const publicUrl = this.storage.getPublicUrl(fileKey);

  return { uploadUrl, fileKey, publicUrl };
}

// POST /api/admin/banners/:id/upload-complete
@Post(':id/upload-complete')
async uploadComplete(
  @Param('id') id: string,
  @Body() body: { fileKey: string; publicUrl: string; fileSize?: number },
) {
  const { fileKey, publicUrl } = body;

  if (!fileKey || !publicUrl) {
    throw new BadRequestException('fileKey and publicUrl are required');
  }

  await this.bannerRepo.update(
    { id: Number(id) },
    { imageUrl: publicUrl, updatedAt: new Date() }
  );

  return {
    success: true,
    message: 'Image upload completed',
    imageUrl: publicUrl,
  };
}
```

### 5. 实现 Episode 视频上传接口

在 `AdminEpisodesController` 中添加类似的接口（参考文档）。

## ⚠️ 重要注意事项

### 1. 环境变量安全

文档中的 R2 密钥是明文，请确认：
- ✅ 这些密钥已添加到 `.env` 文件
- ✅ `.env` 文件已添加到 `.gitignore`
- ❌ 不要将密钥提交到 Git 仓库

### 2. CORS 配置

**这是最容易被忽略但最重要的一步！**

如果不配置 CORS，前端上传会报错：
```
Access to fetch at 'https://xxx.r2.cloudflarestorage.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### 3. 权限验证

建议在所有上传相关接口上添加：
- JWT 认证
- 管理员角色验证
- 资源所有权验证

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get(':id/presigned-upload-url')
```

### 4. 文件大小限制

建议设置合理的文件大小限制：
- **图片**：10MB 以内
- **720p 视频**：200MB 以内
- **1080p 视频**：500MB 以内
- **4K 视频**：2GB 以内

### 5. 超大文件处理

对于超过 500MB 的视频，建议实现 S3 Multipart Upload API（分片上传），支持：
- 断点续传
- 上传进度展示
- 更高的成功率

## 📝 前端实现示例

### Banner 图片上传

```typescript
async function uploadBannerImage(bannerId: number, file: File) {
  // 1. 获取预签名 URL
  const { uploadUrl, publicUrl } = await fetch(
    `/api/admin/banners/${bannerId}/presigned-upload-url?filename=${file.name}&contentType=${file.type}`
  ).then(r => r.json());

  // 2. 直接上传到 R2
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // 3. 通知后端
  await fetch(`/api/admin/banners/${bannerId}/upload-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileKey: 'banners/...',
      publicUrl,
      fileSize: file.size,
    }),
  });

  return publicUrl;
}
```

### Episode 视频上传（带进度）

```typescript
async function uploadEpisodeVideo(episodeId: number, file: File, quality: string, onProgress: (percent: number) => void) {
  // 1. 获取预签名 URL
  const { uploadUrl, publicUrl, fileKey } = await fetch(
    `/api/admin/episodes/${episodeId}/presigned-upload-url?filename=${file.name}&contentType=${file.type}&quality=${quality}`
  ).then(r => r.json());

  // 2. 使用 XMLHttpRequest 上传并监听进度
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) resolve(xhr.response);
      else reject(new Error(`Upload failed: ${xhr.status}`));
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });

  // 3. 通知后端
  await fetch(`/api/admin/episodes/${episodeId}/upload-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileKey,
      publicUrl,
      quality,
      fileSize: file.size,
    }),
  });

  return publicUrl;
}
```

## ✅ 总结

| 项目 | 状态 | 说明 |
|------|------|------|
| 技术方案 | ✅ 可行 | R2 完全兼容 S3 API |
| 文档质量 | ⚠️ 需改进 | 已优化安全性和完整性 |
| 缺失依赖 | ❌ 需安装 | `@aws-sdk/s3-request-presigner` |
| CORS 配置 | ❌ 必须配置 | 否则前端上传会失败 |
| 代码实现 | 📝 待实现 | 需要添加控制器方法 |

## 🚀 下一步行动

1. ✅ 文档已优化完成
2. ⏳ 安装 `@aws-sdk/s3-request-presigner`
3. ⏳ 配置 R2 CORS
4. ⏳ 扩展 `R2StorageService`
5. ⏳ 实现 Banner 上传接口
6. ⏳ 实现 Episode 上传接口
7. ⏳ 前端集成测试

**如需帮助实现后端代码，请随时告诉我！** 🎯

