# 🚀 API快速参考手册

## 📋 接口概览

### 🔐 认证相关
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| 刷新令牌 | POST | `/auth/refresh` | 获取新的access_token | ❌ |
| 验证令牌 | POST | `/auth/verify-refresh-token` | 验证refresh_token | ❌ |
| 设备列表 | GET | `/auth/devices` | 获取活跃设备 | ✅ |
| 撤销设备 | DELETE | `/auth/devices/:id` | 撤销设备令牌 | ✅ |

### 👤 用户相关
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| Telegram登录 | POST/GET | `/user/telegram-login` | Telegram OAuth登录 | ❌ |
| 用户信息 | GET | `/user/me` | 获取当前用户信息 | ✅ |

### 🏠 首页相关
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| 首页视频 | GET | `/api/home/getvideos` | 获取首页推荐内容 | ❌ |

### 📋 列表相关
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| 筛选标签 | GET | `/api/list/getfilterstags` | 获取筛选器标签 | ❌ |
| 筛选数据 | GET | `/api/list/getfiltersdata` | 根据条件筛选视频 | ❌ |

### 🎬 视频相关
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| 保存进度 | POST | `/api/video/progress` | 保存观看进度 | ✅ |
| 获取进度 | GET | `/api/video/progress` | 获取观看进度 | ✅ |
| 发表评论 | POST | `/api/video/comment` | 发表评论/弹幕 | ✅ |
| 视频详情 | GET | `/api/video/details` | 获取视频详情 | ✅ |
| 媒体列表 | GET | `/api/video/media` | 获取用户媒体列表 | ✅ |

### 🌐 公共视频
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| 分类列表 | GET | `/api/public/video/categories` | 获取视频分类 | ❌ |
| 系列列表 | GET | `/api/public/video/series/list` | 获取系列列表 | ❌ |
| 系列详情 | GET | `/api/public/video/series/:id` | 获取系列详情 | ❌ |
| 公共媒体 | GET | `/api/public/video/media` | 获取公共媒体列表 | ❌ |

### 🧪 测试相关
| 接口 | 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|------|
| 测试认证 | GET | `/test/me` | 测试JWT认证 | ✅ |

## 🔧 常用参数

### 分页参数
```typescript
interface PaginationParams {
  page?: number;    // 页码，默认1
  size?: number;    // 每页数量，默认20，最大100
}
```

### 筛选参数
```typescript
interface FilterParams {
  channeid?: string;  // 频道ID，默认"1"
  ids?: string;       // 筛选ID组合，默认"0,0,0,0,0"
}
```

### 媒体查询参数
```typescript
interface MediaParams {
  categoryId?: number;              // 分类ID
  type?: 'short' | 'series';       // 媒体类型
  sort?: 'latest' | 'like' | 'play'; // 排序方式
}
```

## 📝 快速示例

### 获取访问令牌
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your_refresh_token"}'
```

### 获取用户信息
```bash
curl -X GET http://localhost:3000/user/me \
  -H "Authorization: Bearer your_access_token"
```

### 获取首页视频
```bash
curl -X GET "http://localhost:3000/api/home/getvideos?channeid=1&page=1"
```

### 保存观看进度
```bash
curl -X POST http://localhost:3000/api/video/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{"episodeId": 1, "stopAtSecond": 1200}'
```

### 发表评论
```bash
curl -X POST http://localhost:3000/api/video/comment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{"episodeId": 1, "content": "精彩！", "appearSecond": 300}'
```

## ⚠️ 注意事项

### 认证要求
- ✅ 需要认证：需要在请求头中包含 `Authorization: Bearer <token>`
- ❌ 无需认证：可以直接访问

### 请求限制
- 每分钟最多100次请求
- 单次请求超时时间：30秒
- 最大请求体大小：10MB

### 响应格式
- 成功响应：`{"code": 200, "data": {...}, "message": "success"}`
- 错误响应：`{"statusCode": 400, "message": "错误信息", "error": "Bad Request"}`

### 状态码
- `200` - 成功
- `400` - 请求参数错误
- `401` - 未授权（Token无效）
- `403` - 禁止访问
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器错误

---

*📚 详细文档: [complete-api-documentation.md](./complete-api-documentation.md)*  
*🔄 最后更新: 2024-01-01*