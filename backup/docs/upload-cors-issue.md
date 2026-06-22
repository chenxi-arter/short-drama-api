# 图片上传 CORS 错误问题

## 🐛 问题描述

前端在上传图片（Banner、Series 封面等）时，所有上传请求都失败，浏览器显示 CORS 错误。

---

## 📊 错误现象

### 1. Network 标签显示
- ❌ 所有上传相关的请求都显示红色错误
- ❌ 请求状态显示 **"Provisional headers are shown"**（临时请求头）
- ❌ 请求没有真正发送到服务器

### 2. 涉及的接口
```
GET /api/admin/banners/{id}/presigned-upload-url
GET /api/admin/series/{id}/presigned-upload-url
GET /api/admin/episodes/{id}/presigned-upload-url
PUT https://[R2-URL]  (直接上传到 R2)
```

### 3. 错误截图
见附件截图，Network 中显示多个红色的 `presigned-upload-url` 请求失败。

---

## 🔍 技术分析

### 问题根源
这是一个 **CORS 预检请求（OPTIONS）失败** 的问题。

当浏览器发起跨域请求时，会先发送一个 OPTIONS 预检请求，询问服务器是否允许该跨域请求。如果预检失败，真正的请求就不会发送。

### 触发条件
1. 前端地址：`http://localhost:5173`
2. 后端地址：`http://localhost:9090`
3. R2 地址：`https://0d5622368be0547ffbf1909c86bec606.r2.cloudflarestorage.com`

由于端口不同（5173 vs 9090）和域名不同（localhost vs R2），触发了 CORS 限制。

---

## ✅ 需要后端修复的内容

### 1. 后端 API 的 CORS 配置

#### 问题
后端接口（如 `/api/admin/banners/{id}/presigned-upload-url`）没有正确处理 CORS 预检请求。

#### 解决方案

**NestJS 示例：**
```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],  // 允许的前端地址
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'X-Requested-With',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 3600,  // 预检请求缓存时间（秒）
});
```

**Express 示例：**
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'X-Requested-With',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 3600,
}));
```

**关键点：**
- ✅ 必须包含 `OPTIONS` 方法
- ✅ `origin` 必须包含前端地址 `http://localhost:5173`
- ✅ `allowedHeaders` 必须包含前端使用的所有请求头

---

### 2. R2 存储桶的 CORS 配置

#### 问题
前端直接上传文件到 R2 时，R2 存储桶没有配置 CORS，导致浏览器阻止上传。

#### 解决方案

在 **Cloudflare R2 控制台** 配置 CORS：

1. 登录 Cloudflare Dashboard
2. 进入 R2 → 选择存储桶（如 `static-storage`）
3. 点击 **Settings** → **CORS Policy**
4. 添加以下配置：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**关键点：**
- ✅ `AllowedOrigins` 必须包含前端地址
- ✅ `AllowedMethods` 必须包含 `PUT`（用于上传文件）
- ✅ `AllowedHeaders` 设置为 `["*"]` 允许所有请求头

---

## 🧪 验证方法

### 1. 测试后端 CORS
在浏览器控制台运行：
```javascript
fetch('http://localhost:9090/api/admin/banners/2456/presigned-upload-url?filename=test.jpg&contentType=image/jpeg')
  .then(r => r.json())
  .then(data => console.log('成功:', data))
  .catch(err => console.error('失败:', err));
```

**预期结果：**
```json
{
  "uploadUrl": "https://...",
  "fileKey": "banners/2456/...",
  "publicUrl": "https://static.656932.com/..."
}
```

### 2. 测试 R2 上传
```javascript
// 假设已获取到 uploadUrl
const file = new Blob(['test'], { type: 'image/jpeg' });
fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'image/jpeg' }
})
  .then(r => console.log('上传成功:', r.status))
  .catch(err => console.error('上传失败:', err));
```

**预期结果：**
- 状态码：200 OK
- 没有 CORS 错误

---

## 📋 检查清单

请后端开发人员确认以下内容：

### 后端 API
- [ ] CORS 中间件已启用
- [ ] `origin` 包含 `http://localhost:5173`
- [ ] `methods` 包含 `OPTIONS`
- [ ] `allowedHeaders` 包含必要的请求头
- [ ] 预检请求返回 200 或 204 状态码

### R2 存储桶
- [ ] CORS 策略已配置
- [ ] `AllowedOrigins` 包含前端地址
- [ ] `AllowedMethods` 包含 `PUT`
- [ ] `AllowedHeaders` 设置为 `["*"]`

---

## 🔧 临时调试方法

### 查看预检请求
在 Network 标签中：
1. 勾选 **"Preserve log"**（保留日志）
2. 筛选 **"XHR"** 或 **"Fetch/XHR"**
3. 查找 **OPTIONS** 方法的请求
4. 检查响应头是否包含：
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization, ...
   ```

### 查看错误详情
在 Console 标签中，查看具体的 CORS 错误信息，通常是：
```
Access to fetch at 'http://localhost:9090/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Response to preflight request doesn't pass 
access control check: No 'Access-Control-Allow-Origin' header is present on 
the requested resource.
```

---

## 📞 联系方式

如有疑问，请联系前端团队。

**问题优先级：** P0（高）- 阻塞上传功能  
**期望解决时间：** 今天内

---

## 附录：完整的上传流程

### 正常流程
1. 前端调用 `GET /api/admin/banners/{id}/presigned-upload-url`
2. 后端返回预签名 URL
3. 前端使用 `PUT` 方法直接上传文件到 R2
4. 上传成功后，前端调用 `POST /api/admin/banners/{id}/upload-complete` 通知后端

### 当前问题
- ❌ 第 1 步失败：CORS 预检请求被阻止
- ❌ 第 3 步失败：R2 CORS 未配置

### 需要修复
- ✅ 后端 API 的 CORS 配置
- ✅ R2 存储桶的 CORS 配置
