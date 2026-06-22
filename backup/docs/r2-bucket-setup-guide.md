# Cloudflare R2 存储桶配置指南

本文档详细说明如何配置 Cloudflare R2 存储桶用于文件上传功能。

---

## 📋 配置步骤概览

1. ✅ 创建 R2 存储桶（已完成）
2. ⚙️ 配置 CORS 策略
3. 🔑 创建 API 令牌
4. 🌐 配置自定义域名（可选但推荐）
5. 🔧 配置后端环境变量
6. 🧪 测试配置

---

## 1️⃣ 创建 R2 存储桶 ✅

你已经创建了 `admin` 存储桶，可以跳过此步骤。

---

## 2️⃣ 配置 CORS 策略

### 在 Cloudflare 控制台操作：

1. 进入 R2 存储桶 `admin`
2. 点击 **"设置"** 标签
3. 找到 **"CORS 策略"** 部分
4. 点击编辑，粘贴以下配置：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:9090",
      "http://localhost:3000",
      "http://localhost:8080"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. 点击 **"保存"** 按钮

### 配置说明：

- `AllowedOrigins`: 允许的前端源
  - `http://localhost:5173` - Vite 开发服务器（前端）
  - `http://localhost:9090` - 后端 Admin API
  - `http://localhost:3000` - 后端 Client API
  - `http://localhost:8080` - 备用端口
  
- `AllowedMethods`: 
  - `PUT` - 上传文件（核心）
  - `GET` - 读取文件
  - `HEAD` - 检查文件
  
- `AllowedHeaders`: 允许的请求头
- `ExposeHeaders`: 暴露给前端的响应头
- `MaxAgeSeconds`: CORS 预检请求缓存时间（1小时）

---

## 3️⃣ 创建 API 令牌

### 在 Cloudflare 控制台操作：

1. 进入 **Cloudflare 控制台首页**
2. 点击左侧菜单 **"R2"**
3. 点击右上角 **"管理 R2 API 令牌"**
4. 点击 **"创建 API 令牌"**
5. 配置令牌权限：
   - **令牌名称**: `short-drama-api-dev`
   - **权限**: 
     - 对象读写（Read & Write）
   - **TTL**: 永久（Forever）或根据需要设置
   - **指定存储桶**: 选择 `admin`（或选择"所有存储桶"）
6. 点击 **"创建 API 令牌"**

### 保存以下信息：

创建成功后，你会看到：

```
Access Key ID: <your_access_key_id>
Secret Access Key: <your_secret_access_key>
```

⚠️ **重要**: `Secret Access Key` 只会显示一次，请立即保存！

同时记录：

```
Account ID: <your_account_id>
Bucket Name: admin
```

---

## 4️⃣ 获取 R2 端点 URL

### 在存储桶详情页面：

1. 进入 R2 存储桶 `admin`
2. 在 **"设置"** 标签中找到：
   - **S3 API 端点**: 类似 `https://<account_id>.r2.cloudflarestorage.com`
   - **公共存储桶 URL** (如果已配置公共访问): 例如 `https://pub-xxxxx.r2.dev`

记录这些信息：

```
R2 Endpoint: https://<account_id>.r2.cloudflarestorage.com
Public URL: https://pub-xxxxx.r2.dev (或自定义域名)
```

---

## 5️⃣ 配置自定义域名（推荐）

### 为什么需要自定义域名？

- 更专业的访问 URL
- 更好的 SEO
- 避免使用 Cloudflare 的默认域名

### 配置步骤：

1. 在 R2 存储桶 `admin` 的 **"设置"** 中
2. 找到 **"公共开发 URL"** 或 **"自定义域"**
3. 点击 **"连接域"**
4. 输入你的域名，例如：`static.yourdomain.com`
5. 按照提示添加 DNS 记录（Cloudflare 会自动配置）
6. 等待 DNS 生效（通常几分钟）

如果你还没有域名，可以暂时使用 Cloudflare 提供的 `pub-xxxxx.r2.dev` 域名。

---

## 6️⃣ 配置后端环境变量

### 创建或编辑 `.env` 文件

在项目根目录创建 `.env` 文件：

```bash
# ===========================================
# Cloudflare R2 存储配置
# ===========================================

# R2 S3 兼容端点
R2_ENDPOINT_URL=https://<your_account_id>.r2.cloudflarestorage.com

# R2 访问凭证
R2_ACCESS_KEY_ID=<your_access_key_id>
R2_SECRET_ACCESS_KEY=<your_secret_access_key>

# R2 存储桶名称
R2_BUCKET_NAME=admin

# R2 公开访问 URL（用户访问文件时使用）
# 选项 1: 使用自定义域名（推荐）
R2_PUBLIC_BASE_URL=https://static.yourdomain.com

# 选项 2: 使用 Cloudflare 提供的公共 URL
# R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev

# 选项 3: 如果不配置，会使用 S3 端点 URL（不推荐用于生产环境）
# R2_PUBLIC_BASE_URL=
```

### 环境变量说明：

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `R2_ENDPOINT_URL` | ✅ | R2 S3 兼容 API 端点 | `https://xxx.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | ✅ | API 令牌的 Access Key ID | `abc123...` |
| `R2_SECRET_ACCESS_KEY` | ✅ | API 令牌的 Secret Access Key | `xyz789...` |
| `R2_BUCKET_NAME` | ✅ | 存储桶名称 | `admin` |
| `R2_PUBLIC_BASE_URL` | 推荐 | 公开访问 URL | `https://static.yourdomain.com` |

---

## 7️⃣ 配置示例（完整）

### 开发环境配置示例

```bash
# ===========================================
# Cloudflare R2 存储配置 (开发环境)
# ===========================================

# R2 端点（替换为你的 Account ID）
R2_ENDPOINT_URL=https://a1b2c3d4e5f6.r2.cloudflarestorage.com

# R2 API 令牌（从 Cloudflare 控制台获取）
R2_ACCESS_KEY_ID=1234567890abcdef
R2_SECRET_ACCESS_KEY=abcdefghijklmnopqrstuvwxyz123456

# 存储桶名称
R2_BUCKET_NAME=admin

# 公开访问 URL（使用 Cloudflare 提供的公共 URL）
R2_PUBLIC_BASE_URL=https://pub-1234567890abcdef.r2.dev
```

### 生产环境配置示例

```bash
# ===========================================
# Cloudflare R2 存储配置 (生产环境)
# ===========================================

# R2 端点
R2_ENDPOINT_URL=https://a1b2c3d4e5f6.r2.cloudflarestorage.com

# R2 API 令牌
R2_ACCESS_KEY_ID=prod_1234567890abcdef
R2_SECRET_ACCESS_KEY=prod_abcdefghijklmnopqrstuvwxyz123456

# 存储桶名称
R2_BUCKET_NAME=static-storage

# 公开访问 URL（使用自定义域名）
R2_PUBLIC_BASE_URL=https://static.656932.com
```

---

## 8️⃣ 测试配置

### 方法 1: 使用测试脚本

```bash
# 给脚本添加执行权限
chmod +x test-r2-direct-upload.sh

# 运行测试
./test-r2-direct-upload.sh
```

### 方法 2: 手动测试

1. **启动后端服务**

```bash
npm run start:dev
```

2. **测试 Banner 图片上传接口**

```bash
curl "http://localhost:9090/api/admin/banners/1/presigned-upload-url?filename=test.jpg&contentType=image/jpeg"
```

预期响应：

```json
{
  "uploadUrl": "https://xxx.r2.cloudflarestorage.com/admin/banners/1/image_uuid.jpg?X-Amz-Algorithm=...",
  "fileKey": "banners/1/image_uuid.jpg",
  "publicUrl": "https://static.yourdomain.com/banners/1/image_uuid.jpg"
}
```

3. **测试 Episode 视频上传接口**

```bash
curl "http://localhost:9090/api/admin/episodes/1/presigned-upload-url?filename=test.mp4&contentType=video/mp4&quality=720p"
```

### 方法 3: 查看日志

启动服务后，如果配置正确，你会看到：

```
✅ R2 Storage initialized
```

如果配置错误，会看到类似的错误：

```
R2 storage not configured. Required environment variables: R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
```

---

## 9️⃣ 验证 CORS 配置

### 在浏览器中测试

1. 打开浏览器开发者工具（F12）
2. 在 Console 中运行：

```javascript
// 替换为你的实际 URL
const testUrl = 'https://pub-xxxxx.r2.dev/test.txt';

fetch(testUrl, {
  method: 'HEAD',
  mode: 'cors'
})
.then(response => console.log('✅ CORS 配置正确', response))
.catch(error => console.error('❌ CORS 配置错误', error));
```

如果看到 CORS 错误，说明 CORS 配置有问题。

---

## 🔒 安全建议

### 1. 生产环境配置

- ✅ 使用独立的生产环境存储桶
- ✅ 使用独立的生产环境 API 令牌
- ✅ 配置自定义域名（而非 `.r2.dev`）
- ✅ 定期轮换 API 密钥
- ✅ 限制 CORS 到具体的生产域名

### 2. CORS 策略

生产环境的 CORS 配置：

```json
[
  {
    "AllowedOrigins": [
      "https://admin.yourdomain.com",
      "https://app.yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. 环境变量保护

- ❌ 不要将 `.env` 文件提交到 Git
- ✅ 将 `.env` 添加到 `.gitignore`
- ✅ 使用 `.env.example` 作为模板
- ✅ 生产环境使用密钥管理服务（如 AWS Secrets Manager）

---

## 🚨 故障排除

### 问题 1: CORS 错误

**错误信息**:
```
Access to fetch at 'https://...' has been blocked by CORS policy
```

**解决方案**:
- 检查 CORS 配置格式（必须是数组）
- 确保 `AllowedOrigins` 包含你的前端域名
- 检查 `AllowedMethods` 包含 `PUT`
- 确保配置已保存

### 问题 2: 认证失败

**错误信息**:
```
SignatureDoesNotMatch: The request signature we calculated does not match
```

**解决方案**:
- 检查 `R2_ACCESS_KEY_ID` 是否正确
- 检查 `R2_SECRET_ACCESS_KEY` 是否正确
- 确保 API 令牌权限包含"对象读写"
- 重新创建 API 令牌

### 问题 3: 存储桶不存在

**错误信息**:
```
NoSuchBucket: The specified bucket does not exist
```

**解决方案**:
- 检查 `R2_BUCKET_NAME` 是否正确
- 确保存储桶名称与控制台中的一致
- 区分大小写

### 问题 4: 端点 URL 错误

**错误信息**:
```
Cannot resolve hostname
```

**解决方案**:
- 检查 `R2_ENDPOINT_URL` 格式
- 确保包含正确的 Account ID
- 格式应为: `https://<account_id>.r2.cloudflarestorage.com`

---

## 📚 相关文档

- [前端集成指南](./frontend-r2-upload-integration.md)
- [后端 Banner 上传实现](./backend-banner-image-upload.md)
- [后端 Episode 上传实现](./backend-episode-video-upload.md)
- [测试报告](./r2-direct-upload-test-report.md)

---

## ✅ 配置检查清单

使用此清单确保所有配置完成：

- [ ] R2 存储桶已创建
- [ ] CORS 策略已配置
- [ ] API 令牌已创建
- [ ] 环境变量已配置
  - [ ] `R2_ENDPOINT_URL`
  - [ ] `R2_ACCESS_KEY_ID`
  - [ ] `R2_SECRET_ACCESS_KEY`
  - [ ] `R2_BUCKET_NAME`
  - [ ] `R2_PUBLIC_BASE_URL` (可选)
- [ ] 后端服务可以启动
- [ ] 预签名 URL 接口测试通过
- [ ] CORS 测试通过
- [ ] 文件上传测试通过

---

**文档版本**: 1.0  
**最后更新**: 2025-11-08  
**适用环境**: 开发环境、测试环境、生产环境

