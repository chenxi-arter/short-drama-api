# 🚀 前端API接口文档

## 📋 文档说明

本文档专为前端开发者设计，按照用户使用流程和业务逻辑组织，包含完整的接口说明、代码示例和集成建议。

**技术栈**: NestJS + TypeORM + MySQL + Redis + JWT  
**基础URL**: `http://localhost:8080` (开发环境)  
**文档版本**: v1.1
**最后更新**: 2025年9月12日

---


### 🎯 重要更新内容（2025-09-12）

#### **1. 接口字段扩展**
**VideoItem 接口新增字段：**
- `url`: string - 访问URL（通常为系列ID字符串）
- `cidMapper`: string - 分类映射ID
- `isRecommend`: boolean - 是否推荐
- `createdAt`: string - 创建时间（ISO格式）

**SeriesInfo 接口新增字段：**
- `starring`: string - 主演
- `id`: number - 系列ID
- `channeName`: string - 频道名称
- `channeID`: number - 频道ID
- `mediaUrl`: string - 媒体URL
- `fileName`: string - 文件名
- `mediaId`: string - 媒体ID
- `postTime`: string - 发布时间
- `contentType`: string - 内容类型
- `actor`: string - 演员
- `shareCount`: number - 分享次数
- `comments`: number - 评论数
- `updateStatus`: string - 更新状态
- `watch_progress`: number - 观看进度
- `tags`: string[] - 系列标签（题材/地区/语言/年份/状态）

**EpisodeItem 接口新增字段：**
- `status`: string - 剧集状态
- `isVertical`: boolean - **是否竖屏播放（false=横屏，true=竖屏）** ⭐ 新增
- `createdAt`: string - 创建时间
- `updatedAt`: string - 更新时间
- `seriesId`: number - 所属系列ID
- `seriesTitle`: string - 所属系列标题
- `seriesShortId`: string - 所属系列ShortID
- `likeCount`: number - 点赞数
- `dislikeCount`: number - 点踩数
- `favoriteCount`: number - 收藏数
- `lastWatchTime`: string - 最后观看时间

> **💡 `isVertical` 字段说明**：
> - 用于前端播放器自动适配播放方向
> - `false`（默认）：横屏播放，适用于 16:9 比例视频
> - `true`：竖屏播放，适用于 9:16 比例视频（如短视频、竖屏剧）
> - 所有剧集列表接口（`/api/video/episodes` 和 `/api/public/video/episodes`）均返回此字段

#### **2. API路径修正**
- ❌ **旧路径**：`/api/video/episode-url/query` 和 `/api/video/episode-url/:accessKey`
- ✅ **新路径**：`/api/video/url/query` 和 `/api/video/url/access/:accessKey`
- ❌ **旧路径**：`/api/list/getfilterstags?channeid=1`
- ✅ **新路径**：`/api/list/getfilterstags?channeid=1`

#### **3. 请求参数格式更新**
- ❌ **旧格式**：`ids=1,2,0,0,0`（5位）
- ✅ **新格式**：`ids=1,2,0,0,0,0`（6位）
- **参数顺序**：`sort,genre,region,language,year,status`

#### **4. 筛选语法增强**
- **题材多选**：`ids=0,1-3-5,0,0,0,0`（同时具备题材1、3、5）
- **AND逻辑**：多选题材使用连字符连接，筛选结果需同时满足所有条件

#### **5. 响应数据优化**
- `tags` 字段现在包含题材标签（优先显示）
- 所有接口返回的数据结构更加完整和一致

#### **6. 新增交互功能**
- 新增统一交互接口：`POST /api/video/episode/activity`
- 参数 `type` 支持：`play` | `like` | `dislike` | `favorite`
- 使用 `shortId` 指定剧集；计数实时反映在 `playCount`、`likeCount`、`dislikeCount`、`favoriteCount`

#### **7. 新增收藏管理功能**
- 收藏接口：`POST /api/video/episode/activity`（type: 'favorite'）
- 收藏列表：`GET /api/user/favorites`（按系列聚合显示）
- 取消收藏：`POST /api/user/favorites/remove`
- 收藏统计：`GET /api/user/favorites/stats`
- 特色功能：支持按系列聚合，显示 `upCount` 更新角标

#### **8. 新增认证和账号绑定功能**
- 新增邮箱注册接口：`POST /api/auth/register`
- 新增邮箱登录接口：`POST /api/auth/email-login`
- 新增Telegram WebApp登录：`POST /api/auth/telegram/webapp-login`
- 新增Telegram Bot登录：`POST /api/auth/telegram/bot-login`
- 新增账号绑定功能：`POST /api/user/bind-telegram` 和 `POST /api/user/bind-email`
- 支持邮箱和Telegram双登录方式，用户信息完全共享

#### **9. 文档导航**
- 📖 [VideoItem 接口定义](#videoitem)
- 📖 [SeriesInfo 接口定义](#seriesinfo)
- 📖 [EpisodeItem 接口定义](#episodeitem)
- 📖 [筛选参数说明](#筛选参数)
- 📖 [剧集交互接口](#剧集交互)
- 📖 [收藏管理功能](#7-收藏管理流程)

### 🔄 迁移指南

#### **立即需要处理的**
1. **更新TypeScript接口定义** - 添加新增的字段类型
2. **修改API调用路径** - 使用新的API路径
3. **调整请求参数** - `ids`参数统一为6位格式
4. **更新数据处理逻辑** - 处理新增的响应字段

#### **推荐的更新步骤**
```typescript
// 1. 更新接口定义
interface VideoItem {
  // 原有字段...
  url: string;              // 新增
  cidMapper: string;        // 新增
  isRecommend: boolean;     // 新增
  createdAt: string;        // 新增
}

// 2. 更新API调用
// 旧的
fetch('/api/video/episode-url/query', {...})
// 新的
fetch('/api/video/url/query', {...})

// 3. 更新参数格式
// 旧的
const params = 'ids=1,2,0,0,0';
// 新的
const params = 'ids=1,2,0,0,0,0';
```

### ❓ 有疑问？

如果在对接过程中遇到问题，请：
1. 检查浏览器开发者工具的网络请求
2. 确认API路径是否正确
3. 验证请求参数格式
4. 查看接口返回的数据结构

### 🎯 重要提醒

**请务必仔细阅读以上更新内容！** 这些更新会影响：
- 前端TypeScript接口定义
- API调用的URL路径
- 请求参数的格式
- 响应数据的处理逻辑

如果不及时更新，可能会导致：
- 接口调用失败（路径错误）
- 数据解析错误（字段缺失）
- 筛选功能异常（参数格式错误）

建议按"迁移指南"中的步骤逐步进行更新。

### ❓ 常见问题解答

#### **Q: 如何处理认证失败的情况？**
```typescript
// 推荐的错误处理方式
const handleApiError = (error: any) => {
  if (error.code === 401) {
    // Token过期，跳转登录
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  } else if (error.code === 429) {
    // 请求频率限制
    alert('请求过于频繁，请稍后再试');
  } else {
    // 其他错误
    console.error('API Error:', error);
  }
};
```

#### **Q: 筛选参数格式不对怎么办？**
```typescript
// 正确的筛选参数构建方式
const buildFilterParams = (filters: {
  sort?: number;
  genre?: string; // 如 "1-3-5" 表示多选
  region?: number;
  language?: number;
  year?: number;
  status?: number;
}) => {
  const ids = [
    filters.sort || 0,
    filters.genre || 0,
    filters.region || 0,
    filters.language || 0,
    filters.year || 0,
    filters.status || 0
  ].join(',');

  return `ids=${ids}`;
};
```

#### **Q: 如何处理分页数据？**
```typescript
// 分页数据处理示例
interface PaginatedResponse<T> {
  code: number;
  data: {
    list: T[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}

// 使用示例
const loadMoreData = async (page: number) => {
  const response = await fetch(`/api/list/getfiltersdata?channeid=1&page=${page}`);
  const result: PaginatedResponse<VideoItem> = await response.json();

  if (result.data.hasMore) {
    // 还有更多数据可以加载
    setCurrentPage(page + 1);
  }

  return result.data.list;
};
```

#### **Q: 剧集交互功能的使用？**
```typescript
// 完整的交互功能实现
class EpisodeService {
  async reactToEpisode(episodeId: number, type: 'like' | 'dislike' | 'favorite') {
    try {
      const response = await fetch(`/api/video/episode/${episodeId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        // 更新本地状态
        this.updateLocalCounts(episodeId, type);
      }

      return await response.json();
    } catch (error) {
      console.error('Interaction failed:', error);
    }
  }

  private updateLocalCounts(episodeId: number, type: string) {
    // 更新本地缓存的计数
    const episode = this.episodes.find(ep => ep.id === episodeId);
    if (episode) {
      episode[`${type}Count`] = (episode[`${type}Count`] || 0) + 1;
    }
  }
}
```

#### **Q: 如何处理缓存和数据同步？**
```typescript
// 缓存策略示例
class ApiCache {
  private cache = new Map();

  async getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl = 300000): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}

// 使用示例
const apiCache = new ApiCache();
const categories = await apiCache.getCachedData(
  'categories',
  () => fetch('/api/home/categories').then(r => r.json()),
  600000 // 10分钟缓存
);
```

---

## 🔐 认证说明

### 接口分类
- **❌ 公开接口**: 无需认证，可直接访问
- **✅ 认证接口**: 需要在请求头中添加 `Authorization: Bearer <access_token>`

### JWT Token 使用
```typescript
// 在请求头中添加认证信息
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

---

## 📱 用户使用流程

### 1. 用户注册/登录流程

#### **邮箱注册**
```typescript
// 接口地址
POST /api/auth/register

// 请求参数
interface RegisterRequest {
  email: string;           // 邮箱地址（必需）
  password: string;        // 密码（必需，6-20位，包含字母和数字）
  confirmPassword: string; // 确认密码（必需，必须与密码一致）
  username: string;       // 用户名（必需，唯一）
  firstName: string;      // 名字（必需）
  lastName?: string;       // 姓氏（可选）
}

// 响应格式
interface RegisterResponse {
  id: string;             // 用户ID
  shortId: string;        // 短ID
  email: string;          // 邮箱
  username: string;       // 用户名
  firstName: string;      // 名字
  lastName: string;       // 姓氏
  isActive: number;       // 激活状态
  createdAt: string;     // 创建时间
}

// 使用示例
const registerUser = async (userData: RegisterRequest) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return await response.json();
};
```

#### **邮箱登录**
```typescript
// 接口地址
POST /api/auth/email-login

// 请求参数
interface EmailLoginRequest {
  email: string;           // 邮箱地址
  password: string;       // 密码
  deviceInfo?: string;    // 设备信息（可选）
}

// 响应格式
interface EmailLoginResponse {
  access_token: string;   // 访问令牌
  refresh_token: string;  // 刷新令牌
  expires_in: number;     // 过期时间（秒）
  token_type: string;     // 令牌类型
}

// 使用示例
const emailLogin = async (credentials: EmailLoginRequest) => {
  const response = await fetch('/api/auth/email-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return await response.json();
};
```

#### **Telegram WebApp 登录**
```typescript
// 接口地址
POST /api/auth/telegram/webapp-login

// 请求参数
interface TelegramWebAppLoginRequest {
  initData: string;       // Telegram WebApp的initData
  deviceInfo?: string;     // 设备信息（可选）
}

// 响应格式
interface TelegramWebAppLoginResponse {
  access_token: string;   // 访问令牌
  refresh_token: string;  // 刷新令牌
  expires_in: number;     // 过期时间（秒）
  token_type: string;     // 令牌类型
}

// 使用示例
const telegramWebAppLogin = async (initData: string) => {
  const response = await fetch('/api/auth/telegram/webapp-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData })
  });
  return await response.json();
};
```

#### **Telegram Bot 登录**
```typescript
// 接口地址
POST /api/auth/telegram/bot-login

// 请求参数
interface TelegramBotLoginRequest {
  id: number;             // Telegram用户ID
  first_name: string;     // 用户名
  username?: string;      // 用户名（可选）
  auth_date: number;      // 认证时间戳
  hash: string;           // 验证哈希
  deviceInfo?: string;    // 设备信息（可选）
}

// 响应格式
interface TelegramBotLoginResponse {
  access_token: string;   // 访问令牌
  refresh_token: string;  // 刷新令牌
  expires_in: number;     // 过期时间（秒）
  token_type: string;     // 令牌类型
}

// 使用示例
const telegramBotLogin = async (botData: TelegramBotLoginRequest) => {
  const response = await fetch('/api/auth/telegram/bot-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(botData)
  });
  return await response.json();
};
```

#### **获取用户信息**
```typescript
// 接口地址
GET /api/user/me
Headers: Authorization: Bearer <access_token>

// 响应格式
interface UserInfo {
  email: string | null;     // 邮箱地址（可能为null，如Telegram-only用户）
  username: string;        // 用户名
  firstName: string;       // 名字
  lastName: string;        // 姓氏
  hasTelegram: boolean;    // 是否绑定了Telegram（布尔值，不暴露具体ID）
  isActive: boolean;       // 是否激活
  createdAt: string;        // 创建时间
}

// 使用示例
const getUserInfo = async (accessToken: string) => {
  const response = await fetch('/api/user/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  return await response.json();
};
```

#### **刷新访问令牌**
```typescript
// 接口地址
POST /api/user/refresh
Headers: Authorization: Bearer <access_token>

// 请求参数
interface RefreshRequest {
  refresh_token: string;  // 刷新令牌
}

// 响应格式
interface RefreshResponse {
  access_token: string;   // 新的访问令牌
  expires_in: number;     // 过期时间（秒）
  token_type: "Bearer";   // 令牌类型
}
```

#### **用户登出**
```typescript
// 登出当前设备
POST /api/user/logout
Headers: Authorization: Bearer <access_token>

// 请求参数
interface LogoutRequest {
  refresh_token: string;  // 刷新令牌
}

// 登出所有设备
POST /api/user/logout-all
Headers: Authorization: Bearer <access_token>

// 响应格式
interface LogoutResponse {
  message: string;        // 登出成功消息
}
```

#### **设备管理**
```typescript
// 获取用户活跃设备列表
GET /api/user/devices
Headers: Authorization: Bearer <access_token>

// 响应格式
interface DeviceResponse {
  code: number;
  data: {
    list: DeviceInfo[];
    total: number;
  };
}

interface DeviceInfo {
  id: number;             // 设备ID
  deviceInfo?: string;    // 设备信息
  ipAddress?: string;     // IP地址
  createdAt: string;      // 创建时间
  lastUsedAt: string;     // 最后使用时间
}

// 撤销指定设备
DELETE /api/user/devices/:tokenId
Headers: Authorization: Bearer <access_token>

// 响应格式
interface RevokeDeviceResponse {
  message: string;        // 撤销成功消息
  success: boolean;       // 是否成功
}
```

#### **刷新访问令牌**
```typescript
// 接口地址
POST /api/user/refresh
Headers: Authorization: Bearer <access_token>

// 请求参数
interface RefreshRequest {
  refresh_token: string;  // 刷新令牌
}

// 响应格式
interface RefreshResponse {
  access_token: string;   // 新的访问令牌
  expires_in: number;     // 过期时间（秒）
  token_type: "Bearer";   // 令牌类型
}
```

#### **用户登出**
```typescript
// 登出当前设备
POST /api/user/logout
Headers: Authorization: Bearer <access_token>

// 请求参数
interface LogoutRequest {
  refresh_token: string;  // 刷新令牌
}

// 登出所有设备
POST /api/user/logout-all
Headers: Authorization: Bearer <access_token>

// 响应格式
interface LogoutResponse {
  message: string;        // 登出成功消息
}
```

#### **设备管理**
```typescript
// 获取用户活跃设备列表
GET /api/user/devices
Headers: Authorization: Bearer <access_token>

// 响应格式
interface DeviceResponse {
  code: number;
  data: {
    list: DeviceInfo[];
    total: number;
  };
}

interface DeviceInfo {
  id: number;             // 设备ID
  deviceInfo?: string;    // 设备信息
  ipAddress?: string;     // IP地址
  createdAt: string;      // 创建时间
  lastUsedAt: string;     // 最后使用时间
}

// 撤销指定设备
DELETE /api/user/devices/:tokenId
Headers: Authorization: Bearer <access_token>

// 响应格式
interface RevokeDeviceResponse {
  message: string;        // 撤销成功消息
  success: boolean;       // 是否成功
}
```

---

### 2. 首页浏览流程

#### **获取分类列表**
```typescript
// 接口地址
GET /api/home/categories

// 响应格式
interface Category[] {
  id: number;
  name: string;         // 分类名称
  routeName: string;    // 路由名称
  isEnabled: boolean;   // 是否启用
}
```

#### **获取首页数据**
```typescript
// 接口地址
GET /api/home/gethomemodules?channeid=1&page=1

// 请求参数
interface HomeRequest {
  channeid: number;     // 分类ID（对应分类列表中的id）
  page: number;         // 页码
}

// 响应格式
interface HomeResponse {
  code: number;
  data: {
    list: ContentBlock[];
  };
}

interface ContentBlock {
  type: number;         // 0=轮播图, 1001=搜索过滤器, -1=广告, 3=视频列表
  name: string;         // 板块名称
  banners?: Banner[];   // 轮播图数据
  filters?: Filter[];   // 筛选器数据
  list?: VideoItem[];   // 视频列表
}
```



返回字段说明（HomeResponse）：
- `code` number：业务状态码（200 表示成功）
- `data.list` ContentBlock[]：首页模块数组（按顺序渲染）

字段说明（ContentBlock）：
- `type` number：模块类型
  - 0：轮播图模块（banners 有值）
  - 1001：搜索过滤器模块（filters 有值）
  - -1：广告模块（banners 或自定义广告数据）
  - 3：视频列表模块（list 有值）
- `name` string：模块标题（如“热门推荐”）
- `banners` Banner[]：轮播数据（结构同“获取活跃轮播图”的 BannerItem）
- `filters` Filter[]：筛选器数据（用于前端构建筛选 UI）
- `list` VideoItem[]：视频卡片列表（用于网格/横滑渲染）

字段说明（VideoItem 主要字段）：
- `id` number：系列 ID
- `shortId` string：系列 ShortID（用于前端路由/分享）
- `coverUrl` string：封面 URL
- `title` string：标题
- `score` string：评分字符串（如 "9.2"）
- `playCount` number：系列累计播放量
- `url` string：访问用 URL/ID（通常为系列 ID 字符串，便于兼容旧前端逻辑）
- `type` string：内容类型文本（例如“短剧”）
- `isSerial` boolean：是否为系列内容（true=系列）
- `upStatus` string：更新状态文案（示例“更新至第15集”/“已完结”）
- `upCount` number：当天新增集数（用于角标）
- `isRecommend` boolean：是否推荐（用于角标/排序）
- `createdAt` string：创建时间（ISO）
- `cidMapper` string：分类/频道映射 ID（用于埋点/分组）
- `author` string：主演/主创
- `description` string：简介

#### **获取筛选标签**
```typescript
// 接口地址
GET /api/list/getfilterstags?channeid=1

// 响应格式
interface FilterTagsResponse {
  code: number;
  data: FilterTagGroup[];
}

interface FilterTagGroup {
  name: string;         // 标签组名称
  list: FilterTagItem[];
}

interface FilterTagItem {
  index: number;        // 标签索引
  classifyId: number;   // 分类ID
  classifyName: string; // 分类名称
  isDefaultSelect: boolean; // 是否默认选中
}
```

#### **获取筛选数据**
```typescript
// 接口地址
GET /api/list/getfiltersdata?channeid=1&ids=1,2,0,0,0,0&page=1

// 响应格式
interface FiltersDataResponse {
  code: number;
  data: {
    list: VideoItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}
```

---

### 3. 轮播图管理流程

#### **获取活跃轮播图**
```typescript
// 接口地址
GET /api/banners/active/list?categoryId=1&limit=5

// 请求参数
interface BannerRequest {
  categoryId?: number;        // 分类ID（可选）
  limit?: number;             // 限制数量
}

// 响应格式
interface BannerResponse {
  code: number;
  data: BannerItem[];
}

interface BannerItem {
  id: number;
  title: string;              // 标题
  imageUrl: string;           // 图片URL
  linkUrl?: string;           // 跳转链接
  seriesId?: number;          // 关联系列ID
  shortId?: string;           // 系列ShortID
  weight: number;             // 权重
  isActive: boolean;          // 是否启用
  categoryId: number;         // 分类ID
  description?: string;       // 描述
}
```

---

### 4. 视频搜索和筛选流程

#### **获取筛选标签**
```typescript
// 接口地址
GET /api/list/getfilterstags?channeid=1

// 请求参数
interface FilterTagsRequest {
  channeid: number;     // 频道ID（对应分类ID）
}

// 响应格式
interface FilterTagsResponse {
  code: number;
  data: FilterTagGroup[];
}

interface FilterTagGroup {
  name: string;         // 标签组名称（如：题材、地区、年份等）
  list: FilterTagItem[];
}

interface FilterTagItem {
  index: number;        // 标签索引
  classifyId: number;   // 分类ID
  classifyName: string; // 分类名称
  isDefaultSelect: boolean; // 是否默认选中
}

// 使用示例
const filterTags = await fetch('/api/list/getfilterstags?channeid=1')
  .then(res => res.json());

// 构建筛选参数
const buildFilterIds = (selectedTags: FilterTagItem[]): string => {
  return selectedTags.map(tag => tag.classifyId).join(',');
};
```

<a id="筛选参数"></a>
说明：
- 筛选位顺序固定为：0=排序(sort)，1=题材(genre)，2=地区(region)，3=语言(language)，4=年份(year)，5=状态(status)
- 第二位（题材）支持多选，使用连字符连接 display_order 值，例如：`1,2-5-7,0,0,0,0`

#### **条件筛选视频**
```typescript
// 接口地址
GET /api/list/getfiltersdata?channeid=1&ids=1,2,0,0,0,0&page=1

// 请求参数
interface FilterRequest {
  channeid: number;     // 频道ID
  ids: string;          // 筛选条件，顺序：[sort,genre,region,language,year,status]
                        // 例：单选题材：1,2,0,0,0,0  多选题材：1,2-5-7,0,0,0,0
  page: number;         // 页码
}

// 响应格式
interface FilterResponse {
  code: number;
  data: {
    list: VideoItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}

<a id="videoitem"></a>
interface VideoItem {
  id: number;
  shortId: string;          // 系列ShortID
  coverUrl: string;         // 封面图
  title: string;            // 标题
  score: string;            // 评分（如 "9.2"）
  playCount: number;        // 播放次数
  url: string;              // 访问URL（通常为系列ID字符串）
  type: string;             // 类型（如 "短剧"）
  isSerial: boolean;        // 是否系列剧
  upStatus: string;         // 更新状态文案（如：更新至第X集 / 已完结）
  upCount: number;          // 当天新增集数（按当天0点~次日0点统计）
  likeCount?: number;       // 点赞数（系列下已发布剧集聚合）
  dislikeCount?: number;    // 踩数（系列下已发布剧集聚合）
  favoriteCount?: number;   // 收藏数（系列下已发布剧集聚合）
  author: string;           // 主演
  description: string;      // 描述
  cidMapper: string;        // 分类映射ID
  isRecommend: boolean;     // 是否推荐
  createdAt: string;        // 创建时间（ISO格式）
}
```

#### **模糊搜索**
```typescript
// 接口地址
GET /api/list/fuzzysearch?keyword=霸道总裁&page=1&size=20

// 响应格式（同筛选结果，但包含分页信息）
interface SearchResponse {
  code: number;
  data: {
    list: VideoItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}
```

#### **高级筛选**
```typescript
// 接口地址
GET /api/list/getconditionfilterdata?titleid=drama&ids=0,0,0,0,0,0&page=1&size=21

// 响应格式（包含更详细的视频信息）
interface AdvancedVideoItem extends VideoItem {
  starring: string;     // 主演
  actor: string;        // 演员
  director: string;     // 导演
  region: string;       // 地区
  language: string;     // 语言
  releaseDate: string;  // 发布日期（ISO日期时间，如 2024-08-01T12:34:56Z）
  isCompleted: boolean; // 是否完结
  episodeCount: number; // 当前集数
  tags: any[];          // 标签
}
```

---

### 5. 剧集观看流程

#### **获取剧集列表**
```typescript
// 需要认证 - 获取用户观看进度
GET /api/video/episodes?seriesShortId=fpcxnnFA6m9&page=1&size=20
Headers: Authorization: Bearer <access_token>

// 无需认证 - 获取公开剧集列表
GET /api/public/video/episodes?seriesShortId=fpcxnnFA6m9&page=1&size=20

// 响应格式
interface EpisodeResponse {
  code: number;
  data: {
    seriesInfo: SeriesInfo;
    userProgress?: UserProgress;  // 认证时返回
    list: EpisodeItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
    currentEpisode: string;  // 当前观看到的集数（与 episodeTitle 一致，如 "01"；无记录则为 "01"）
  };
}

<a id="seriesinfo"></a>
interface SeriesInfo {
  starring: string;        // 主演
  id: number;              // 系列ID
  channeName: string;      // 频道名称
  channeID: number;        // 频道ID
  title: string;           // 系列标题
  coverUrl: string;        // 封面
  mediaUrl: string;        // 媒体URL
  fileName: string;        // 文件名（如 "series-123"）
  mediaId: string;         // 媒体ID（如 "123_24,1000,85,1"）
  postTime: string;        // 发布时间
  contentType: string;     // 内容类型
  actor: string;           // 演员
  shareCount: number;      // 分享次数
  director: string;        // 导演
  description: string;     // 描述
  comments: number;        // 评论数
  updateStatus: string;    // 更新状态
  watch_progress: number;  // 观看进度
  playCount: number;       // 播放次数
  isHot: boolean;          // 是否热门
  isVip: boolean;          // 是否VIP
  tags?: string[];         // 系列题材标签（最多 5 个）
}

interface UserProgress {
  currentEpisode: number;  // 当前观看集数
  watchProgress: number;   // 观看进度（秒）
  watchPercentage: number; // 观看百分比
  isCompleted: boolean;    // 是否完成
}

<a id="episodeitem"></a>
interface EpisodeItem {
  id: number;
  shortId: string;         // 剧集ShortID
  episodeNumber: number;   // 集数
  episodeTitle: string;    // 集数标题（如 01, 02...）
  title: string;           // 标题
  duration: number;        // 时长（秒）
  status: string;          // 剧集状态
  isVertical: boolean;     // 是否竖屏播放（false=横屏，true=竖屏）
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
  seriesId: number;        // 所属系列ID
  seriesTitle: string;     // 所属系列标题
  seriesShortId: string;   // 所属系列ShortID
  likeCount?: number;      // 点赞数
  dislikeCount?: number;   // 点踩数
  favoriteCount?: number;  // 收藏数
  watchProgress?: number;  // 观看进度（秒）
  watchPercentage?: number; // 观看百分比
  isWatched?: boolean;     // 是否已观看
  lastWatchTime?: string;  // 最后观看时间
  episodeAccessKey?: string; // 剧集级 accessKey，用于 /api/video/url/access/:accessKey 或 POST 查询
  urls: EpisodeUrl[];      // 播放地址
  userInteraction?: UserInteraction;  // 用户交互状态（仅认证时返回）🆕
}

interface UserInteraction {
  liked: boolean;          // 是否点赞了这一集
  disliked: boolean;       // 是否点踩了这一集
  favorited: boolean;      // 是否收藏了这个系列（同系列所有集相同）⭐
}

interface EpisodeUrl {
  quality: string;         // 清晰度
  accessKey: string;       // 访问密钥
}
```

#### 获取 accessKey 的方式
- 剧集级 accessKey（用于 type='episode'）：来自 `/api/video/episodes` 或 `/api/public/video/episodes` 的 `data.list[i].episodeAccessKey`
- 地址级 accessKey（用于 type='url'）：来自上述接口的 `data.list[i].urls[j].accessKey`

示例（先拿 accessKey 再查询播放地址）
```bash
TELEGRAM='{"id":6702079700,"first_name":"随风","username":"seo99991","auth_date":1754642628,"hash":"cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07"}'; \
ACCESS=$(curl -s -H "Content-Type: application/json" -X POST -d "$TELEGRAM" http://localhost:8080/api/user/telegram-login | jq -r .access_token); \
SERIES_SHORT=$(curl -s "http://localhost:8080/api/list/getfiltersdata?channeid=1&ids=0,0,0,0,0,0&page=1" | jq -r '.data.list[0].shortId'); \
EP_JSON=$(curl -s -H "Authorization: Bearer $ACCESS" "http://localhost:8080/api/video/episodes?seriesShortId=$SERIES_SHORT&page=1&size=1"); \
EP_ACCESS=$(echo "$EP_JSON" | jq -r '.data.list[0].episodeAccessKey'); \
URL_ACCESS=$(echo "$EP_JSON" | jq -r '.data.list[0].urls[0].accessKey'); \
echo "episodeAccessKey=$EP_ACCESS"; echo "urlAccessKey=$URL_ACCESS"
```

#### **获取播放地址**
```typescript
// 接口地址（推荐POST）
POST /api/video/url/query
// 推荐请求体
interface EpisodeUrlQuery {
  type: 'episode' | 'url';  // 'episode' = episodes.access_key, 'url' = episode_urls.access_key
  accessKey: string;        // 对应类型的 accessKey
}
// 兼容老格式
// { key: 'ep:<accessKey>' } 或 { key: 'url:<accessKey>' }

// 示例（使用剧集级 accessKey）
curl -X POST "http://localhost:8080/api/video/url/query" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "episode",
    "accessKey": "<EPISODE_ACCESS_KEY>"
  }'

// 示例（使用地址级 accessKey）
curl -X POST "http://localhost:8080/api/video/url/query" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url",
    "accessKey": "<URL_ACCESS_KEY>"
  }'

// 响应格式（聚合同集所有地址）
interface EpisodeUrlQueryResponse {
  episodeId: number;
  episodeShortId: string;
  episodeTitle: string;
  seriesId?: number;
  seriesShortId?: string;
  urls: Array<{
    id: number;
    quality: string;
    cdnUrl: string;
    ossUrl: string;
    subtitleUrl?: string | null;
    accessKey: string;
    createdAt: string;
    updatedAt: string;
  }>;
  accessKeySource: 'episode' | 'url'; // 调用时使用的 accessKey 类型来源
}
```

#### **记录观看进度**
```typescript
// 保存观看进度
POST /api/video/progress
Headers: Authorization: Bearer <access_token>

// 请求参数
interface ProgressRequest {
  episodeIdentifier: string;  // 剧集ShortID或ID
  stopAtSecond: number;       // 停止时间（秒）
}

// 获取观看进度
GET /api/video/progress?episodeIdentifier=fpcxnnFA6m9
Headers: Authorization: Bearer <access_token>

// 响应格式
interface ProgressResponse {
  stopAtSecond: number;       // 观看进度（秒）
}
```

---

### 6. 推荐功能流程（类抖音列表）

#### **推荐功能概述**

推荐功能提供智能的剧集推荐，类似抖音的推荐流：
- **智能推荐算法**：基于点赞、收藏、评论数
- **随机因子**：每次刷新都有新内容
- **完整信息**：剧集信息、系列信息、互动数据、评论预览
- **一键跳转**：返回系列 shortId，可直接跳转到系列详情

#### **获取推荐剧集列表**

**接口地址**: `GET /api/video/recommend`

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `size` | number | 否 | 20 | 每页数量 |

**请求示例**:
```bash
# 获取第一页（20条）
curl "http://localhost:3000/api/video/recommend"

# 获取第二页
curl "http://localhost:3000/api/video/recommend?page=2&size=20"

# 自定义每页数量
curl "http://localhost:3000/api/video/recommend?page=1&size=10"
```

**响应格式**:
```typescript
interface RecommendResponse {
  code: number;
  data: {
    list: RecommendEpisodeItem[];
    page: number;
    size: number;
    hasMore: boolean;
  };
  msg: string | null;
}

interface RecommendEpisodeItem {
  // 剧集基本信息
  shortId: string;                 // 剧集 shortId
  episodeNumber: number;           // 集数
  episodeTitle: string;            // 集数标题（如 "01"）
  title: string;                   // 剧集标题
  duration: number;                // 时长（秒）
  status: string;                  // 状态
  isVertical: boolean;             // 是否竖屏播放
  createdAt: string;               // 创建时间
  
  // 系列信息
  seriesShortId: string;           // 系列 shortId（用于跳转）
  seriesTitle: string;             // 系列标题
  seriesCoverUrl: string;          // 系列封面
  seriesDescription: string;       // 系列简介
  
  // 互动数据
  playCount: number;               // 播放次数
  likeCount: number;               // 点赞数
  dislikeCount: number;            // 不喜欢数
  favoriteCount: number;           // 收藏数
  commentCount: number;            // 评论数
  
  // 播放地址
  episodeAccessKey: string;        // 剧集访问密钥
  urls: {
    quality: string;               // 清晰度
    accessKey: string;             // 地址访问密钥
  }[];
  
  // 评论预览（最新3条）
  topComments: {
    id: number;
    shortId: string;
    content: string;
    username: string;
    avatar: string;
    createdAt: string;
    likeCount: number;
  }[];
  
  // 用户交互状态（仅认证时返回）🆕
  userInteraction?: {
    liked: boolean;          // 是否点赞了这一集
    disliked: boolean;       // 是否点踩了这一集
    favorited: boolean;      // 是否收藏了这个系列（同系列所有集相同）⭐
  };
  
  // 推荐分数（调试用）
  recommendScore?: number;
}
```

**响应示例**（实际测试数据）:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "episodeTitle": "01",
        "title": "01",
        "duration": 716,
        "status": "published",
        "isVertical": true,
        "createdAt": "2025-09-19 05:52",
        "seriesShortId": "N8Tg2KtBQPN",
        "seriesTitle": "恋爱潜伏",
        "seriesCoverUrl": "https://static.656932.com/video/cover/6a689930e440c458b19bc49cd2b240d8.gif",
        "seriesDescription": "外科医生顾念救了毒贩K后...",
        "playCount": 1,
        "likeCount": 1,
        "dislikeCount": 0,
        "favoriteCount": 15,
        "commentCount": 0,
        "episodeAccessKey": "dfb71e43a79fc155820d18250248a4ae",
        "urls": [
          {
            "quality": "720p",
            "accessKey": "0e78b9a04a10df9e34250244eb012528"
          },
          {
            "quality": "480p",
            "accessKey": "c9fcd8f31280b1d295170bc356c1d5e1"
          }
        ],
        "topComments": [],
        "recommendScore": 139
      }
    ],
    "page": 1,
    "size": 1,
    "hasMore": true
  },
  "message": "获取推荐成功",
  "timestamp": "2025-10-05T12:24:50.172Z"
}
```

> **✅ 已验证**: 上述响应来自实际API测试（2025-10-05）  
> - `isVertical` 字段正常工作
> - 推荐算法正确运行
> - 所有数据字段完整返回

#### **推荐算法**

**推荐分数计算公式**:
```
推荐分数 = (点赞数 × 3 + 收藏数 × 5 + 评论数 × 2) + 随机因子(0-100)
```

**权重说明**:
- **点赞数 × 3**: 点赞是最基础的互动
- **收藏数 × 5**: 收藏表示更强的喜爱
- **评论数 × 2**: 评论表示用户参与度
- **随机因子**: 保证内容多样性，避免推荐固化

**筛选条件**:
- 只推荐 `status = 'published'` 的剧集
- 只推荐 `series.is_active = 1` 的系列
- 按推荐分数降序排列
- 加入随机排序，保证每次刷新都有不同内容

#### **互动功能接口**

##### **1. 点赞剧集**

**接口**: `POST /api/video/episode/activity`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID
  type: 'like';       // 点赞
}
```

**Response**:
```typescript
{
  code: 200,
  data: {
    episodeId: number;
    shortId: string;
    type: 'like';
    changed: boolean;         // 是否改变了状态
    previousType?: string;    // 之前的状态（如果有）
  },
  message: '已更新' | '已是该状态'
}
```

**说明**: 
- 如果用户已点赞，再次点赞不会重复计数，返回 `changed: false`
- 如果用户之前点踩，切换为点赞会自动调整计数，返回 `previousType: 'dislike'`

---

##### **2. 点踩剧集**

**接口**: `POST /api/video/episode/activity`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID
  type: 'dislike';    // 点踩
}
```

**Response**: 同点赞接口

---

##### **3. 取消点赞/点踩**

**接口**: `POST /api/video/episode/reaction/remove`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID
}
```

**Response**:
```typescript
{
  code: 200,
  data: {
    episodeId: number;
    shortId: string;
    removed: boolean;   // 是否成功取消
  },
  message: '已取消' | '未找到反应记录'
}
```

**说明**: 
- 取消操作不区分点赞还是点踩，会移除用户的任何反应
- 如果用户没有点赞或点踩记录，返回 `removed: false`

---

##### **4. 收藏剧集**

**接口**: `POST /api/video/episode/activity`

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID（任意一集）
  type: 'favorite';   // 收藏
}
```

**Response**:
```typescript
{
  code: 200,
  data: {
    episodeId: number;
    shortId: string;
    type: 'favorite';
    seriesId: number;   // 被收藏的系列ID
  },
  message: '已收藏系列'
}
```

**说明**: 
- ⭐ **收藏是针对系列的**，传入任意一集的 `shortId` 会收藏整个系列
- 用户收藏后，该系列的所有剧集都显示为已收藏状态（`userFavorited: true`）
- 重复收藏同一系列不会报错

---

#### **前端集成示例**

**完整的React推荐流组件（带互动功能）**:
```typescript
import React, { useState, useEffect } from 'react';

interface Episode {
  shortId: string;
  seriesShortId: string;
  seriesTitle: string;
  episodeTitle: string;
  seriesCoverUrl: string;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  commentCount: number;
  isVertical: boolean;
  // 用户交互状态（仅登录后返回）
  userInteraction?: {
    liked: boolean;        // 是否点赞
    disliked: boolean;     // 是否点踩
    favorited: boolean;    // 是否收藏（针对系列）⭐
  };
}

export function RecommendFeed() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadRecommend();
  }, [page]);

  async function loadRecommend() {
    const res = await fetch(`/api/video/recommend?page=${page}&size=20`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`  // 登录后才能获取用户状态
      }
    });
    const data = await res.json();
    
    setEpisodes(prev => [...prev, ...data.data.list]);
    setHasMore(data.data.hasMore);
  }

  // 点赞/取消点赞
  async function handleLike(episode: Episode, index: number) {
    try {
      if (episode.userInteraction?.liked) {
        // 取消点赞
        await fetch('/api/video/episode/reaction/remove', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shortId: episode.shortId }),
        });
        
        // 更新本地状态
        updateEpisode(index, {
          userInteraction: { 
            ...episode.userInteraction, 
            liked: false 
          },
          likeCount: episode.likeCount - 1
        });
      } else {
        // 点赞
        const res = await fetch('/api/video/episode/activity', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shortId: episode.shortId, type: 'like' }),
        });
        
        const result = await res.json();
        
        // 更新本地状态
        const updates: any = { 
          userInteraction: {
            liked: true,
            disliked: result.data.previousType === 'dislike' ? false : (episode.userInteraction?.disliked || false),
            favorited: episode.userInteraction?.favorited || false
          }
        };
        if (result.data.previousType === 'dislike') {
          // 从点踩切换到点赞
          updates.dislikeCount = episode.dislikeCount - 1;
          updates.likeCount = episode.likeCount + 1;
        } else {
          updates.likeCount = episode.likeCount + 1;
        }
        updateEpisode(index, updates);
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      showToast('操作失败，请重试');
    }
  }

  // 点踩/取消点踩
  async function handleDislike(episode: Episode, index: number) {
    try {
      if (episode.userInteraction?.disliked) {
        // 取消点踩
        await fetch('/api/video/episode/reaction/remove', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shortId: episode.shortId }),
        });
        
        updateEpisode(index, {
          userInteraction: {
            ...episode.userInteraction,
            disliked: false
          },
          dislikeCount: episode.dislikeCount - 1
        });
      } else {
        // 点踩
        const res = await fetch('/api/video/episode/activity', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shortId: episode.shortId, type: 'dislike' }),
        });
        
        const result = await res.json();
        
        const updates: any = {
          userInteraction: {
            liked: result.data.previousType === 'like' ? false : (episode.userInteraction?.liked || false),
            disliked: true,
            favorited: episode.userInteraction?.favorited || false
          }
        };
        if (result.data.previousType === 'like') {
          // 从点赞切换到点踩
          updates.likeCount = episode.likeCount - 1;
          updates.dislikeCount = episode.dislikeCount + 1;
        } else {
          updates.dislikeCount = episode.dislikeCount + 1;
        }
        updateEpisode(index, updates);
      }
    } catch (error) {
      console.error('点踩操作失败:', error);
      showToast('操作失败，请重试');
    }
  }

  // 收藏/取消收藏
  async function handleFavorite(episode: Episode, index: number) {
    try {
      if (episode.userInteraction?.favorited) {
        // 取消收藏
        await fetch('/api/user/favorites/remove', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shortId: episode.shortId }),
        });
        
        updateEpisode(index, {
          userInteraction: {
            ...episode.userInteraction,
            favorited: false
          },
          favoriteCount: episode.favoriteCount - 1
        });
      } else {
        // 收藏
        await fetch('/api/video/episode/activity', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shortId: episode.shortId, type: 'favorite' }),
        });
        
        updateEpisode(index, {
          userInteraction: {
            ...episode.userInteraction,
            favorited: true
          },
          favoriteCount: episode.favoriteCount + 1
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      showToast('操作失败，请重试');
    }
  }

  // 更新剧集状态
  function updateEpisode(index: number, updates: Partial<Episode>) {
    setEpisodes(prev => {
      const newEpisodes = [...prev];
      newEpisodes[index] = { ...newEpisodes[index], ...updates };
      return newEpisodes;
    });
  }

  return (
    <div className="recommend-feed">
      {episodes.map((ep, index) => (
        <div key={ep.shortId} className={`episode-card ${ep.isVertical ? 'vertical' : ''}`}>
          <img src={ep.seriesCoverUrl} alt={ep.seriesTitle} />
          <h3>{ep.seriesTitle} - {ep.episodeTitle}</h3>
          
          {/* 互动按钮组 */}
          <div className="actions">
            <button 
              className={ep.userInteraction?.liked ? 'active' : ''}
              onClick={() => handleLike(ep, index)}
            >
              {ep.userInteraction?.liked ? '👍' : '🤍'} {ep.likeCount}
            </button>
            
            <button 
              className={ep.userInteraction?.disliked ? 'active' : ''}
              onClick={() => handleDislike(ep, index)}
            >
              {ep.userInteraction?.disliked ? '👎' : '🤍'} {ep.dislikeCount}
            </button>
            
            <button 
              className={ep.userInteraction?.favorited ? 'active' : ''}
              onClick={() => handleFavorite(ep, index)}
              title="收藏系列"
            >
              {ep.userInteraction?.favorited ? '⭐' : '☆'} {ep.favoriteCount}
            </button>
            
            <button onClick={() => navigate(`/series/${ep.seriesShortId}/comments`)}>
              💬 {ep.commentCount}
            </button>
          </div>
          
          <button onClick={() => navigate(`/series/${ep.seriesShortId}`)}>
            查看系列
          </button>
        </div>
      ))}
      {hasMore && <button onClick={() => setPage(p => p + 1)}>加载更多</button>}
    </div>
  );
}

// 工具函数
function getToken(): string {
  return localStorage.getItem('access_token') || '';
}

function showToast(message: string) {
  // 实现你的提示组件
  alert(message);
}
```

**优化的互动按钮组件**:
```typescript
interface InteractionButtonsProps {
  episode: Episode;
  onUpdate: (updates: Partial<Episode>) => void;
}

function InteractionButtons({ episode, onUpdate }: InteractionButtonsProps) {
  const [loading, setLoading] = useState(false);

  async function toggleLike() {
    if (loading) return;
    setLoading(true);
    
    try {
      if (episode.userLiked) {
        await removeReaction(episode.shortId);
        onUpdate({
          userLiked: false,
          likeCount: episode.likeCount - 1
        });
      } else {
        const result = await reactToEpisode(episode.shortId, 'like');
        const updates: any = { userLiked: true };
        
        if (result.data.previousType === 'dislike') {
          updates.userDisliked = false;
          updates.dislikeCount = episode.dislikeCount - 1;
          updates.likeCount = episode.likeCount + 1;
        } else {
          updates.likeCount = episode.likeCount + 1;
        }
        onUpdate(updates);
      }
    } catch (error) {
      showToast('操作失败');
    } finally {
      setLoading(false);
    }
  }

  async function toggleDislike() {
    if (loading) return;
    setLoading(true);
    
    try {
      if (episode.userDisliked) {
        await removeReaction(episode.shortId);
        onUpdate({
          userDisliked: false,
          dislikeCount: episode.dislikeCount - 1
        });
      } else {
        const result = await reactToEpisode(episode.shortId, 'dislike');
        const updates: any = { userDisliked: true };
        
        if (result.data.previousType === 'like') {
          updates.userLiked = false;
          updates.likeCount = episode.likeCount - 1;
          updates.dislikeCount = episode.dislikeCount + 1;
        } else {
          updates.dislikeCount = episode.dislikeCount + 1;
        }
        onUpdate(updates);
      }
    } catch (error) {
      showToast('操作失败');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    if (loading) return;
    setLoading(true);
    
    try {
      if (episode.userFavorited) {
        await removeFavorite(episode.shortId);
        onUpdate({
          userFavorited: false,
          favoriteCount: episode.favoriteCount - 1
        });
      } else {
        await reactToEpisode(episode.shortId, 'favorite');
        onUpdate({
          userFavorited: true,
          favoriteCount: episode.favoriteCount + 1
        });
      }
    } catch (error) {
      showToast('操作失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="interaction-buttons">
      <button 
        className={`like-btn ${episode.userLiked ? 'active' : ''}`}
        onClick={toggleLike}
        disabled={loading}
      >
        <span className="icon">{episode.userLiked ? '👍' : '🤍'}</span>
        <span className="count">{formatCount(episode.likeCount)}</span>
      </button>
      
      <button 
        className={`dislike-btn ${episode.userDisliked ? 'active' : ''}`}
        onClick={toggleDislike}
        disabled={loading}
      >
        <span className="icon">{episode.userDisliked ? '👎' : '🤍'}</span>
        <span className="count">{formatCount(episode.dislikeCount)}</span>
      </button>
      
      <button 
        className={`favorite-btn ${episode.userFavorited ? 'active' : ''}`}
        onClick={toggleFavorite}
        disabled={loading}
      >
        <span className="icon">{episode.userFavorited ? '⭐' : '☆'}</span>
        <span className="count">{formatCount(episode.favoriteCount)}</span>
      </button>
      
      <button className="comment-btn">
        <span className="icon">💬</span>
        <span className="count">{formatCount(episode.commentCount)}</span>
      </button>
    </div>
  );
}

// API调用函数
async function reactToEpisode(shortId: string, type: 'like' | 'dislike' | 'favorite') {
  const res = await fetch('/api/video/episode/activity', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shortId, type }),
  });
  return await res.json();
}

async function removeReaction(shortId: string) {
  await fetch('/api/video/episode/reaction/remove', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shortId }),
  });
}

async function removeFavorite(shortId: string) {
  await fetch('/api/user/favorites/remove', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shortId }),
  });
}

// 格式化数字显示
function formatCount(count: number): string {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + 'w';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}
```

**无限滚动加载**:
```typescript
let currentPage = 1;

async function loadMore() {
  const response = await fetch(`/api/video/recommend?page=${currentPage}&size=20`);
  const data = await response.json();
  
  if (data.data.hasMore) {
    currentPage++;
    appendEpisodes(data.data.list);
  } else {
    showNoMoreContent();
  }
}

// 监听滚动事件
window.addEventListener('scroll', () => {
  if (isNearBottom()) {
    loadMore();
  }
});
```

**跳转到系列详情**:
```typescript
// 使用返回的 seriesShortId 跳转
function jumpToSeries(seriesShortId) {
  // 方式1：跳转到系列详情页
  window.location.href = `/series/${seriesShortId}`;
  
  // 方式2：获取系列的所有剧集
  fetch(`/api/video/episodes?seriesShortId=${seriesShortId}`)
    .then(res => res.json())
    .then(data => {
      showSeriesDetail(data);
    });
}
```

#### **注意事项**

1. **认证要求**:
   - 推荐接口无需认证，可公开访问
   - 互动接口（点赞、点踩、收藏、评论）需要 JWT token
   - 未登录用户不会返回 `userLiked`、`userDisliked`、`userFavorited` 字段

2. **性能优化**:
   - 推荐结果包含随机因子，不建议缓存
   - 建议使用无限滚动而不是传统分页
   - 前端可以预加载下一页数据
   - 互动按钮使用乐观更新，提升响应速度

3. **数据更新**:
   - 互动数据（点赞、点踩、收藏、评论）实时更新
   - 推荐分数每次请求重新计算
   - 评论预览只显示最新3条
   - 用户状态通过批量查询优化，性能良好

4. **播放器适配**:
   - 使用 `isVertical` 字段判断播放器方向
   - `true`: 竖屏播放器（9:16）
   - `false`: 横屏播放器（16:9）

5. **互动逻辑**:
   - 点赞和点踩互斥，切换时自动调整计数
   - 重复点赞/点踩不会重复计数
   - 取消操作会移除用户的反应记录
   - 收藏操作独立，不影响点赞/点踩状态

6. **错误处理**:
   - 所有互动操作都应包含错误处理
   - 网络错误时显示友好提示
   - 使用乐观更新时，失败后要回滚状态

---

### 7. 评论互动流程

#### 剧集交互（播放/点赞/不喜欢/收藏）
- 接口：`POST /api/video/episode/activity`
- Headers：`Authorization: Bearer <access_token>`（可选）
- 请求体：
  - `shortId` string（必填）：剧集 ShortID
  - `type` 'play' | 'like' | 'dislike' | 'favorite'（必填）
- 返回（data）：
  - `episodeId` number
  - `shortId` string
  - `type` string（同入参）
- 说明：
  - `play` → 自增该集 `playCount`
  - `like` → 自增该集 `likeCount`
  - `dislike` → 自增该集 `dislikeCount`
  - `favorite` → 自增该集 `favoriteCount`

---

#### **评论盖楼功能（完整版）**

评论系统支持多级嵌套回复（楼中楼），类似微信朋友圈或知乎的回复机制。

##### **1. 发表主楼评论**

**接口**: `POST /api/video/episode/comment`

**Headers**: 
```
Authorization: Bearer <access_token>
```

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID（必填）
  content: string;    // 评论内容（≤500字）
}
```

**Response**:
```typescript
{
  code: 200,
  message: "评论发表成功",
  data: {
    id: number;           // 评论ID
    content: string;      // 评论内容
    createdAt: string;    // 创建时间
  }
}
```

**说明**: 主楼评论的 `parentId` 和 `rootId` 为 `null`，`floorNumber` 为 `0`。

---

##### **2. 回复评论（盖楼）**🆕

**接口**: `POST /api/video/episode/comment/reply`

**Headers**: 
```
Authorization: Bearer <access_token>
```

**Request Body**:
```typescript
{
  episodeShortId: string;  // 剧集 ShortID（必填）
  parentId: number;        // 要回复的评论ID（必填）
  content: string;         // 回复内容（≤500字）
}
```

**Response**:
```typescript
{
  code: 200,
  message: "回复成功",
  data: {
    id: number;                    // 回复ID
    parentId: number;              // 父评论ID（回复谁）
    rootId: number;                // 主楼ID
    floorNumber: number;           // 楼层号（1, 2, 3...）
    content: string;               // 回复内容
    createdAt: string;             // 创建时间
    username: string | null;       // 回复者用户名
    nickname: string | null;       // 回复者昵称
    photoUrl: string | null;       // 回复者头像
    replyToUsername: string | null; // 被回复者用户名
    replyToNickname: string | null; // 被回复者昵称
  }
}
```

**说明**: 
- 可以回复主楼（`parentId` = 主楼ID）
- 可以回复某条回复（`parentId` = 回复ID），实现多级嵌套
- `rootId` 自动继承，所有回复都属于同一个主楼
- `floorNumber` 自动递增，同一主楼下的回复按发表顺序编号

---

##### **3. 获取主楼评论列表（带回复预览）**⬆️

**接口**: `GET /api/video/comments?episodeShortId=xxx&page=1&size=20`

**Query Parameters**:
```typescript
{
  episodeShortId: string;  // 剧集 ShortID（必填）
  page?: number;           // 页码（默认1）
  size?: number;           // 每页数量（默认20）
}
```

**Response**:
```typescript
{
  code: 200,
  message: "获取评论成功",
  data: {
    comments: [
      {
        id: number;                // 主楼ID
        content: string;           // 主楼内容
        appearSecond: number;      // 弹幕时间（普通评论为0）
        replyCount: number;        // 回复数量
        createdAt: string;         // 创建时间
        username: string | null;   // 评论者用户名
        nickname: string | null;   // 评论者昵称
        photoUrl: string | null;   // 评论者头像
        recentReplies: [           // 最新2条回复预览
          {
            id: number;            // 回复ID
            content: string;       // 回复内容
            floorNumber: number;   // 楼层号
            createdAt: string;     // 回复时间
            username: string | null;
            nickname: string | null;
          }
        ]
      }
    ],
    total: number;        // 主楼评论总数
    page: number;
    size: number;
    totalPages: number;
  }
}
```

**说明**: 
- 只返回主楼评论（`rootId` 为 `null`）
- 每条主楼附带 `replyCount` 和最新 2 条 `recentReplies`
- 点击"查看更多回复"时调用下一个接口

---

##### **4. 获取某条评论的所有回复**🆕

**接口**: `GET /api/video/episode/comments/:commentId/replies?page=1&size=20`

**Path Parameters**:
```typescript
{
  commentId: number;  // 主楼评论ID
}
```

**Query Parameters**:
```typescript
{
  page?: number;   // 页码（默认1）
  size?: number;   // 每页数量（默认20）
}
```

**Response**:
```typescript
{
  code: 200,
  message: "获取成功",
  data: {
    rootComment: {               // 主楼信息
      id: number;
      content: string;
      username: string | null;
      nickname: string | null;
      photoUrl: string | null;
      replyCount: number;        // 总回复数
      createdAt: string;
    },
    replies: [                   // 回复列表（按楼层号升序）
      {
        id: number;              // 回复ID
        parentId: number;        // 父评论ID
        floorNumber: number;     // 楼层号（1, 2, 3...）
        content: string;         // 回复内容
        createdAt: string;       // 回复时间
        username: string | null;
        nickname: string | null;
        photoUrl: string | null;
      }
    ],
    total: number;               // 回复总数
    page: number;
    size: number;
    totalPages: number;
  }
}
```

**说明**: 
- 返回主楼的所有回复，按 `floorNumber` 升序排列
- 包括回复的回复（多级嵌套）
- 通过 `parentId` 可以判断回复关系

---

##### **5. 评论层级关系说明**

```
主楼 (id=1, parentId=null, rootId=null, floor=0, replyCount=4)
  ├─ 1楼 (id=2, parentId=1, rootId=1, floor=1)
  ├─ 2楼 (id=3, parentId=1, rootId=1, floor=2)
  ├─ 3楼 (id=4, parentId=1, rootId=1, floor=3)
  └─ 4楼 (id=5, parentId=2, rootId=1, floor=4)  ← 这是回复1楼的
```

**字段关系**:
- `parentId`: 直接回复的评论ID
  - `null` → 这是主楼
  - `1` → 回复主楼
  - `2` → 回复1楼
- `rootId`: 所属主楼ID
  - `null` → 自己是主楼
  - `1` → 属于ID为1的主楼
- `floorNumber`: 楼层号
  - `0` → 主楼
  - `1, 2, 3...` → 回复楼层（按发表顺序）
- `replyCount`: 回复数量
  - 仅主楼统计
  - 包含所有层级的回复

---

##### **6. 前端展示建议**

**方案A: 朋友圈式（推荐）**

```
┌──────────────────────────────────┐
│ 👤 张三  2小时前                │
│ 这部剧太好看了！                 │
│ ❤️ 12  💬 3条回复              │
│                                  │
│ [展开回复]                       │
└──────────────────────────────────┘

点击后：
┌──────────────────────────────────┐
│ 👤 张三  2小时前                │
│ 这部剧太好看了！                 │
│ ❤️ 12  💬 3条回复              │
│                                  │
│ ┌────────────────────────────┐ │
│ │ 👤 李四 #1楼               │ │
│ │ 同意！                     │ │
│ │ [回复]                     │ │
│ └────────────────────────────┘ │
└──────────────────────────────────┘
```

**方案B: 知乎式（支持多级缩进）**

```
主楼：这部剧太好看了！
  ├─ #1楼 李四：同意！
  │   └─ #4楼 王五 回复 李四：+1
  ├─ #2楼 赵六：我也觉得
  └─ #3楼 孙七：确实不错
```

---

##### **7. 完整使用示例**

```typescript
// 1. 用户发表主楼评论
const mainComment = await fetch('/api/video/episode/comment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shortId: '6JswefD4QXK',
    content: '这部剧太好看了！'
  })
}).then(r => r.json());

const mainCommentId = mainComment.data.id;

// 2. 用户回复主楼
await fetch('/api/video/episode/comment/reply', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    episodeShortId: '6JswefD4QXK',
    parentId: mainCommentId,
    content: '我也觉得！'
  })
});

// 3. 获取主楼列表（带回复预览）
const comments = await fetch(
  '/api/video/comments?episodeShortId=6JswefD4QXK&page=1&size=20'
).then(r => r.json());

// 4. 用户点击"查看更多回复"，获取所有回复
const replies = await fetch(
  `/api/video/episode/comments/${mainCommentId}/replies?page=1&size=20`
).then(r => r.json());

// 5. 回复某条回复（多级嵌套）
const firstReplyId = replies.data.replies[0].id;
await fetch('/api/video/episode/comment/reply', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    episodeShortId: '6JswefD4QXK',
    parentId: firstReplyId,  // 回复某条回复
    content: '@1楼 同意你的观点！'
  })
});
```

---

##### **8. 注意事项**

1. **权限控制**:
   - 发表评论和回复需要登录（JWT认证）
   - 查看评论列表无需登录

2. **性能优化**:
   - 主楼列表只返回最新2条回复预览
   - 点击"查看更多"时才加载全部回复
   - 建议每页20条主楼，50条回复

3. **删除逻辑**:
   - 删除主楼会级联删除所有回复
   - 删除某条回复不影响其他回复

4. **回复计数**:
   - 只有主楼的 `replyCount` 有值
   - 包含所有层级的回复总数
   - 自动实时更新

---

---

### 8. 收藏管理流程

#### **收藏功能概述**

⭐ **重要说明**：**收藏是针对整个系列的，不是针对单集！**

收藏功能允许用户收藏喜欢的系列。当用户在任意一集点击收藏时，系统会收藏整个系列。收藏列表按系列显示，每个系列只显示一次。

**设计理由**：
- 短剧通常较短（20-100集），用户收藏是为了追完整个系列
- 收藏列表更清晰，避免同一系列重复出现
- 可以显示"更新X集"角标，提醒用户追剧

#### **1. 添加收藏（推荐方式）**

**接口**: `POST /api/video/episode/activity`

**Headers**: 
```
Authorization: Bearer <access_token>
```

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID（该系列的任意一集即可）
  type: 'favorite';   // 固定值：favorite
}
```

**Response**:
```typescript
{
  code: 200,
  message: "已收藏系列",
  data: {
    episodeId: number;    // 触发收藏的剧集ID
    shortId: string;      // 触发收藏的剧集ShortID
    type: "favorite";     // 操作类型
    seriesId: number;     // 被收藏的系列ID ⭐
  }
}
```

**⭐ 重要说明**: 
- **收藏是针对整个系列的**，不是针对单集
- 传入该系列任意一集的 `shortId` 都会收藏整个系列
- 收藏后，该系列的**所有剧集**都会显示为已收藏状态（`userFavorited: true`）
- 这是推荐的收藏方式，通过统一的交互接口实现
- 支持重复收藏（不会重复添加）

**示例**：
```typescript
// 用户在第5集点击收藏
POST /api/video/episode/activity
{ "shortId": "第5集的shortId", "type": "favorite" }

// 结果：
// ✅ 收藏了整个系列
// ✅ 第1集、第2集...所有集的 userFavorited 都变为 true
// ✅ 收藏列表中显示这个系列（不是第5集）
```

---

#### **2. 获取收藏列表**

**接口**: `GET /api/user/favorites`

**Headers**: 
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
```typescript
{
  page?: number;   // 页码（默认1）
  size?: number;   // 每页数量（默认20）
}
```

**Response**:
```typescript
{
  code: 200,
  message: "获取收藏列表成功",
  data: {
    list: [
      {
        seriesId: number;              // 系列ID
        seriesShortId: string;         // 系列ShortID
        seriesTitle: string;          // 系列标题
        seriesCoverUrl: string;       // 系列封面
        categoryName: string;          // 分类名称
        description: string;           // 系列描述
        score: string;                 // 评分（如 "9.2"）
        playCount: number;             // 播放次数
        totalEpisodeCount: number;     // 系列总集数
        favoritedEpisodeCount: number;  // 用户收藏了该系列的多少集
        upCount: number;               // 当天新增集数（用于角标）
        isCompleted: boolean;          // 是否完结
        favoriteTime: string;          // 最后收藏时间（格式：YYYY-MM-DD HH:mm）
      }
    ],
    total: number;        // 收藏系列总数
    page: number;
    size: number;
    hasMore: boolean;     // 是否还有更多数据
  }
}
```

**说明**: 
- 收藏是针对系列的，列表显示用户收藏的所有系列
- `totalEpisodeCount`：该系列的总集数
- `upCount`：当天新增集数，用于显示"更新X集"角标
- `favoriteTime`：收藏该系列的时间
- `favoritedEpisodeCount`：固定为0（保留字段，未来可能支持单集收藏）

---

#### **3. 取消收藏**

**接口**: `POST /api/user/favorites/remove`

**Headers**: 
```
Authorization: Bearer <access_token>
```

**Request Body**:
```typescript
{
  shortId: string;    // 剧集 ShortID（任意一集即可）
}
```

**Response**:
```typescript
{
  code: 200,
  message: "取消收藏成功",
  data: {
    removed: boolean;           // 是否成功移除
    shortId: string;            // 剧集ShortID
    seriesId: number;           // 系列ID
    favoriteType: "series";     // 收藏类型（系列）
  }
}
```

**说明**: 
- ⭐ **取消收藏是针对系列的**，传入该系列任意一集的 `shortId` 即可取消整个系列的收藏
- 取消后，该系列的所有剧集都显示为未收藏状态（`userFavorited: false`）
- 如果未找到对应收藏记录，返回 `removed: false`

---

#### **4. 获取收藏统计**

**接口**: `GET /api/user/favorites/stats`

**Headers**: 
```
Authorization: Bearer <access_token>
```

**Response**:
```typescript
{
  code: 200,
  message: "获取收藏统计成功",
  data: {
    total: number;        // 总收藏数（所有剧集）
    seriesCount: number;  // 收藏系列数
    episodeCount: number; // 收藏剧集数
  }
}
```

---

#### **5. 完整使用示例**

```typescript
  // 收藏服务类
class FavoriteService {
  private api: ApiClient;
  
  constructor(api: ApiClient) {
    this.api = api;
  }
  
  // 1. 收藏系列（通过任意一集的shortId）⭐
  async addFavorite(episodeShortId: string): Promise<boolean> {
    try {
      const response = await this.api.post('/api/video/episode/activity', {
        shortId: episodeShortId,  // 该系列任意一集的shortId
        type: 'favorite'
      });
      
      console.log('收藏系列成功:', response.data);
      // response.data.seriesId 是被收藏的系列ID
      return true;
    } catch (error) {
      console.error('收藏失败:', error);
      return false;
    }
  }
  
  // 2. 获取收藏列表
  async getFavorites(page: number = 1, size: number = 20): Promise<FavoriteListResponse> {
    try {
      const response = await this.api.get(
        `/api/user/favorites?page=${page}&size=${size}`
      );
      return response;
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      throw error;
    }
  }
  
  // 3. 取消收藏系列（通过任意一集的shortId）⭐
  async removeFavorite(episodeShortId: string): Promise<boolean> {
    try {
      const response = await this.api.post('/api/user/favorites/remove', {
        shortId: episodeShortId  // 该系列任意一集的shortId
      });
      
      console.log('取消收藏系列成功:', response.data);
      // response.data.seriesId 是被取消收藏的系列ID
      return response.data.removed;
    } catch (error) {
      console.error('取消收藏失败:', error);
      return false;
    }
  }
  
  // 4. 获取收藏统计
  async getFavoriteStats(): Promise<FavoriteStatsResponse> {
    try {
      const response = await this.api.get('/api/user/favorites/stats');
      return response;
    } catch (error) {
      console.error('获取收藏统计失败:', error);
      throw error;
    }
  }
  
  // 5. 检查是否已收藏
  async isFavorited(episodeShortId: string): Promise<boolean> {
    try {
      // 通过收藏列表检查（简单方式）
      const favorites = await this.getFavorites(1, 1000); // 获取所有收藏
      return favorites.data.list.some(item => 
        // 这里需要根据实际数据结构判断
        // 如果收藏列表包含该剧集所属的系列，则认为已收藏
        true // 简化示例
      );
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }
}

// 使用示例
const favoriteService = new FavoriteService(api);

  // 在剧集列表组件中使用
const EpisodeList = ({ episodes }: { episodes: EpisodeItem[] }) => {
  const [episodeList, setEpisodeList] = useState(episodes);
  
  // ⭐ 收藏是针对系列的，需要同时更新该系列所有剧集的状态
  const handleFavoriteToggle = async (episode: EpisodeItem) => {
    try {
      if (episode.userFavorited) {
        // 取消收藏系列
        await favoriteService.removeFavorite(episode.shortId);
        showToast('已取消收藏系列');
        
        // ⭐ 更新该系列所有剧集的收藏状态
        setEpisodeList(prev => prev.map(ep => 
          ep.seriesId === episode.seriesId 
            ? { ...ep, userFavorited: false, favoriteCount: ep.favoriteCount - 1 }
            : ep
        ));
      } else {
        // 收藏系列
        await favoriteService.addFavorite(episode.shortId);
        showToast('已收藏系列');
        
        // ⭐ 更新该系列所有剧集的收藏状态
        setEpisodeList(prev => prev.map(ep => 
          ep.seriesId === episode.seriesId 
            ? { ...ep, userFavorited: true, favoriteCount: ep.favoriteCount + 1 }
            : ep
        ));
      }
    } catch (error) {
      showToast('操作失败，请重试');
    }
  };
  
  return (
    <div className="episode-list">
      {episodeList.map(episode => (
        <div key={episode.shortId} className="episode-card">
          <img src={episode.coverUrl} alt={episode.title} />
          <h3>{episode.title}</h3>
          
          {/* ⭐ 收藏按钮 - 同一系列的所有集状态应该一致 */}
          <button 
            onClick={() => handleFavoriteToggle(episode)}
            className={`favorite-btn ${episode.userFavorited ? 'favorited' : ''}`}
            title={episode.userFavorited ? '已收藏该系列' : '收藏该系列'}
          >
            {episode.userFavorited ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          
          <p className="hint">
            {episode.userFavorited 
              ? '✅ 已收藏整个系列' 
              : '点击收藏整个系列'}
          </p>
        </div>
      ))}
    </div>
  );
};

// 收藏列表页面
const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const loadFavorites = async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await favoriteService.getFavorites(pageNum, 20);
      if (append) {
        setFavorites(prev => [...prev, ...response.data.list]);
      } else {
        setFavorites(response.data.list);
      }
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('加载收藏列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadFavorites(1);
  }, []);
  
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFavorites(nextPage, true);
    }
  };
  
  return (
    <div className="favorites-page">
      <h2>我的收藏</h2>
      <div className="favorites-grid">
        {favorites.map(series => (
          <div key={series.seriesId} className="favorite-item">
            <img src={series.seriesCoverUrl} alt={series.seriesTitle} />
            <div className="series-info">
              <h3>{series.seriesTitle}</h3>
              <p className="category">{series.categoryName}</p>
              <p className="description">{series.description}</p>
              <div className="stats">
                <span>评分: {series.score}</span>
                <span>播放: {series.playCount}</span>
                <span>收藏: {series.favoritedEpisodeCount}/{series.totalEpisodeCount}集</span>
                {series.upCount > 0 && (
                  <span className="update-badge">更新{series.upCount}集</span>
                )}
              </div>
              <p className="favorite-time">收藏于: {series.favoriteTime}</p>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  );
};
```

---

#### **6. 注意事项**

1. **权限控制**:
   - 所有收藏相关接口都需要登录（JWT认证）
   - 未登录用户无法进行收藏操作

2. **数据一致性**:
   - 收藏操作通过 `POST /api/video/episode/activity` 实现
   - 取消收藏通过 `POST /api/user/favorites/remove` 实现
   - 两种操作都使用 `shortId` 保持一致性
   - ⭐ **收藏是针对系列的**，同一系列的所有剧集 `userFavorited` 状态应保持一致

3. **性能优化**:
   - 收藏列表按系列聚合，减少数据量
   - 支持分页加载，避免一次性加载大量数据
   - `upCount` 字段用于显示更新角标，提升用户体验

4. **用户体验**:
   - 支持重复收藏（不会报错）
   - 取消收藏时如果记录不存在，返回友好提示
   - 收藏列表显示收藏时间，便于用户管理
   - ⭐ 收藏按钮应显示"收藏系列"而不是"收藏剧集"，避免用户混淆

---

### 9. 个人中心流程

#### **获取浏览历史**
```typescript
// 接口地址
GET /api/video/browse-history?page=1&size=20
Headers: Authorization: Bearer <access_token>

// 响应格式
interface BrowseHistoryResponse {
  code: number;
  data: {
    list: BrowseHistoryItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}

interface BrowseHistoryItem {
  seriesId: number;
  seriesTitle: string;       // 系列标题
  seriesShortId: string;     // 系列ShortID
  seriesCoverUrl: string;    // 系列封面
  lastEpisodeNumber: number; // 最后访问集数
  visitCount: number;        // 访问次数
  lastVisitTime: string;     // 最后访问时间
  durationSeconds: number;   // 浏览时长
}
```

#### **浏览历史说明**
```typescript
// ⚠️ 注意：高级浏览历史功能（recent、sync、stats等）当前不可用
// 只有基础的浏览历史查看功能可用，数据基于用户观看进度自动聚合生成

// 浏览记录自动生成规则：
// 1. 基于用户的观看进度记录（WatchProgress）自动聚合
// 2. 按系列分组，显示最后观看的集数和时间
// 3. visitCount = 该系列下有观看进度的不同集数
// 4. durationSeconds = 最后观看集数的观看时长
// 5. 无需手动同步，观看时自动更新

// 如需手动记录浏览行为，请使用观看进度接口：
// POST /api/video/progress

// 账号绑定功能说明：
// 1. 邮箱注册用户可以通过绑定Telegram实现双登录方式
// 2. Telegram用户可以通过绑定邮箱实现双登录方式
// 3. 绑定后两种登录方式都指向同一个用户账号
// 4. 用户信息（观看历史、收藏等）在两种登录方式间完全共享
```

#### **实际可用的浏览历史接口**
```typescript
// ✅ 唯一可用的浏览历史接口
GET /api/video/browse-history?page=1&size=20
Headers: Authorization: Bearer <access_token>

// 完整的响应数据结构
interface BrowseHistoryResponse {
  code: number;
  message: string;
  data: {
    list: BrowseHistoryItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}

interface BrowseHistoryItem {
  id: number;                    // 系列ID（兼容字段）
  seriesId: number;              // 系列ID
  seriesTitle: string;           // 系列标题
  seriesShortId: string;         // 系列ShortID
  seriesCoverUrl: string;        // 系列封面
  categoryName: string;          // 分类名称
  browseType: "episode_watch";   // 浏览类型（固定值）
  browseTypeDesc: "观看剧集";     // 浏览类型描述
  lastEpisodeNumber: number;     // 最后观看集数
  lastEpisodeTitle: string;      // 最后观看集数标题
  visitCount: number;            // 访问次数（观看过的不同集数）
  durationSeconds: number;       // 最后观看集的观看时长（秒）
  lastVisitTime: string;         // 最后访问时间（格式：YYYY-MM-DD HH:mm）
  watchStatus: string;           // 观看状态（如："观看至第52集"）
}
```

---

### 10. 缓存管理流程

#### **获取缓存统计**
```typescript
// 接口地址
GET /api/cache/stats

// 响应格式
interface CacheStatsResponse {
  code: number;
  data: {
    totalKeys: number;        // 总缓存键数
    memoryUsage: number;      // 内存使用量
    hitRate: number;          // 缓存命中率
    missRate: number;         // 缓存未命中率
    evictions: number;        // 驱逐次数
    expiredKeys: number;      // 过期键数
  };
}
```

#### **清理指定缓存**
```typescript
// 接口地址
DELETE /api/cache/clear/:pattern

// 请求参数
interface ClearCacheRequest {
  pattern: string;            // 缓存键模式（如：episode_list:*）
}

// 响应格式
interface ClearCacheResponse {
  code: number;
  message: string;            // 清理结果消息
  clearedKeys: number;        // 清理的键数量
}
```

#### **清理所有缓存**
```typescript
// 接口地址
DELETE /api/cache/clear-all

// 响应格式
interface ClearAllCacheResponse {
  code: number;
  message: string;            // 清理结果消息
  clearedKeys: number;        // 清理的键数量
}
```

#### **获取缓存键列表**
```typescript
// 接口地址
GET /api/cache/keys

// 响应格式
interface CacheKeysResponse {
  code: number;
  data: {
    keys: string[];           // 缓存键列表
    total: number;            // 总键数
    patterns: string[];       // 可用模式列表
  };
}
```

#### **预热缓存**
```typescript
// 接口地址
GET /api/cache/warmup

// 响应格式
interface WarmupResponse {
  code: number;
  message: string;            // 预热结果消息
  warmedKeys: number;         // 预热的键数量
  duration: number;           // 预热耗时（毫秒）
}
```

---

### 11. 健康检查流程

#### **基础健康检查**
```typescript
// 接口地址
GET /api/health

// 响应格式
interface HealthResponse {
  status: string;             // 服务状态
  timestamp: string;          // 检查时间
  uptime: number;             // 运行时间
}
```

#### **详细健康检查**
```typescript
// 接口地址
GET /api/health/detailed

// 响应格式
interface DetailedHealthResponse {
  status: string;             // 服务状态
  timestamp: string;          // 检查时间
  uptime: number;             // 运行时间
  database: {
    status: string;           // 数据库状态
    responseTime: number;     // 响应时间
  };
  cache: {
    status: string;           // 缓存状态
    hitRate: number;          // 命中率
  };
  memory: {
    used: number;             // 已用内存
    total: number;            // 总内存
    percentage: number;       // 使用百分比
  };
}
```

#### **系统信息**
```typescript
// 接口地址
GET /api/health/system

// 响应格式
interface SystemInfoResponse {
  status: string;             // 服务状态
  timestamp: string;          // 检查时间
  system: {
    platform: string;         // 平台信息
    nodeVersion: string;      // Node.js版本
    memory: {
      used: number;           // 已用内存
      total: number;          // 总内存
      percentage: number;     // 使用百分比
    };
    cpu: {
      loadAverage: number[];  // CPU负载
      cores: number;          // CPU核心数
    };
    uptime: number;           // 系统运行时间
  };
}
```

#### **获取系统统计**
```typescript
// 接口地址
GET /api/video/browse-history/stats
Headers: Authorization: Bearer <access_token>

// 响应格式
interface SystemStatsResponse {
  code: number;
  data: {
    totalUsers: number;       // 总用户数
    totalRecords: number;     // 总记录数
    activeUsers: number;      // 活跃用户数
    totalStorage: number;     // 总存储量
    averageSessionTime: number; // 平均会话时间
  };
}
```

---

### 10. 缓存管理流程

#### **获取缓存统计**
```typescript
// 接口地址
GET /api/cache/stats

// 响应格式
interface CacheStatsResponse {
  code: number;
  data: {
    totalKeys: number;        // 总缓存键数
    memoryUsage: number;      // 内存使用量
    hitRate: number;          // 缓存命中率
    missRate: number;         // 缓存未命中率
    evictions: number;        // 驱逐次数
    expiredKeys: number;      // 过期键数
  };
}
```

#### **清理指定缓存**
```typescript
// 接口地址
DELETE /api/cache/clear/:pattern

// 请求参数
interface ClearCacheRequest {
  pattern: string;            // 缓存键模式（如：episode_list:*）
}

// 响应格式
interface ClearCacheResponse {
  code: number;
  message: string;            // 清理结果消息
  clearedKeys: number;        // 清理的键数量
}
```

#### **清理所有缓存**
```typescript
// 接口地址
DELETE /api/cache/clear-all

// 响应格式
interface ClearAllCacheResponse {
  code: number;
  message: string;            // 清理结果消息
  clearedKeys: number;        // 清理的键数量
}
```

#### **获取缓存键列表**
```typescript
// 接口地址
GET /api/cache/keys

// 响应格式
interface CacheKeysResponse {
  code: number;
  data: {
    keys: string[];           // 缓存键列表
    total: number;            // 总键数
    patterns: string[];       // 可用模式列表
  };
}
```

#### **预热缓存**
```typescript
// 接口地址
GET /api/cache/warmup

// 响应格式
interface WarmupResponse {
  code: number;
  message: string;            // 预热结果消息
  warmedKeys: number;         // 预热的键数量
  duration: number;           // 预热耗时（毫秒）
}
```

---

### 11. 健康检查流程

#### **基础健康检查**
```typescript
// 接口地址
GET /api/health

// 响应格式
interface HealthResponse {
  status: string;             // 服务状态
  timestamp: string;          // 检查时间
  uptime: number;             // 运行时间
}
```

#### **详细健康检查**
```typescript
// 接口地址
GET /api/health/detailed

// 响应格式
interface DetailedHealthResponse {
  status: string;             // 服务状态
  timestamp: string;          // 检查时间
  uptime: number;             // 运行时间
  database: {
    status: string;           // 数据库状态
    responseTime: number;     // 响应时间
  };
  cache: {
    status: string;           // 缓存状态
    hitRate: number;          // 命中率
  };
  memory: {
    used: number;             // 已用内存
    total: number;            // 总内存
    percentage: number;       // 使用百分比
  };
}
```

#### **系统信息**
```typescript
// 接口地址
GET /api/health/system

// 响应格式
interface SystemInfoResponse {
  status: string;             // 服务状态
  timestamp: string;          // 检查时间
  system: {
    platform: string;         // 平台信息
    nodeVersion: string;      // Node.js版本
    memory: {
      used: number;           // 已用内存
      total: number;          // 总内存
      percentage: number;     // 使用百分比
    };
    cpu: {
      loadAverage: number[];  // CPU负载
      cores: number;          // CPU核心数
    };
    uptime: number;           // 系统运行时间
  };
}
```

---

## 📊 通用响应格式

### 成功响应
```typescript
interface SuccessResponse<T> {
  code: number;          // 状态码，200表示成功
  data: T;               // 响应数据
  message?: string;      // 响应消息
  timestamp?: string;    // 时间戳
  path?: string;         // 请求路径
}
```

### 分页响应
```typescript
interface PaginatedResponse<T> {
  code: number;
  data: T[];             // 数据列表
  pagination: {
    total: number;        // 总数量
    page: number;         // 当前页码
    size: number;         // 每页大小
    totalPages: number;   // 总页数
    hasNext: boolean;     // 是否有下一页
    hasPrev: boolean;     // 是否有上一页
  };
  message?: string;
  timestamp?: string;
}
```

### 错误响应
```typescript
interface ErrorResponse {
  code: number;          // 错误状态码
  message: string;       // 错误消息
  error?: string;        // 错误类型
  details?: any;         // 错误详情
  timestamp: string;     // 时间戳
  path?: string;         // 请求路径
  requestId?: string;    // 请求ID
}
```

### Ingest（采集）统一响应消费建议
```typescript
// Ingest 接口统一返回 { code, data: { summary, items }, message, success }
// items 内可混合成功/失败项，失败项包含 statusCode 与 details（字段级错误）

interface IngestItemSuccess {
  statusCode: number;      // 200
  seriesId: number;
  shortId?: string | null;
  externalId?: string | null;
  action: 'created' | 'updated';
  title?: string;
}

interface IngestItemError {
  statusCode: number;      // 4xx
  error: string;
  details?: any;
  externalId?: string | null;
  title?: string | null;
}

type IngestItem = IngestItemSuccess | IngestItemError;

function consumeIngestResponse(resp: any) {
  const items: IngestItem[] = resp?.data?.items || [];
  const successItems = items.filter(x => x.statusCode === 200) as IngestItemSuccess[];
  const failedItems = items.filter(x => x.statusCode !== 200) as IngestItemError[];

  // 展示统计
  const summary = resp?.data?.summary;
  console.log('created:', summary?.created, 'updated:', summary?.updated, 'failed:', summary?.failed);

  // 成功项处理
  successItems.forEach(item => {
    // 如：记录 seriesId/shortId/externalId 到本地
  });

  // 失败项提示（字段级 details 可用于表单标注）
  failedItems.forEach(err => {
    // err.details: [{ property, constraints, children }]
  });

  return { successItems, failedItems, summary };
}
```

---

## 📱 前端集成建议

### 1. 状态管理

#### **用户状态**
```typescript
interface UserState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfo | null;
  tokenExpiry: number | null;
}
```

### 2. 请求封装

#### **API客户端**
```typescript
class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async request<T>(
    endpoint: string, 
    options?: RequestInit & { skipAuth?: boolean }
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options || {};
    
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    };
    
    // 添加认证头
    if (!skipAuth) {
      const token = useUserStore.getState().accessToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // 发送请求
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // 便捷方法
  async get<T>(endpoint: string, options?: any) {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }
  
  async post<T>(endpoint: string, data?: any, options?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }
}
```

#### **首页数据获取流程**
```typescript
// 完整的首页数据获取流程
class HomeDataService {
  private api: ApiClient;
  
  constructor(api: ApiClient) {
    this.api = api;
  }
  
  // 1. 首先获取分类列表
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await this.api.get<Category[]>('/api/home/categories');
      return categories;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return [];
    }
  }
  
  // 2. 根据分类获取首页数据
  async getHomeData(categoryId: number, page: number = 1): Promise<HomeResponse> {
    try {
      const homeData = await this.api.get<HomeResponse>(
        `/api/home/gethomemodules?channeid=${categoryId}&page=${page}`
      );
      return homeData;
    } catch (error) {
      console.error('获取首页数据失败:', error);
      throw error;
    }
  }
  
  // 3. 获取筛选标签
  async getFilterTags(categoryId: number): Promise<FilterTagsResponse> {
    try {
      const filterTags = await this.api.get<FilterTagsResponse>(
        `/api/list/getfilterstags?channeid=${categoryId}`
      );
      return filterTags;
    } catch (error) {
      console.error('获取筛选标签失败:', error);
      throw error;
    }
  }
  
  // 4. 完整的首页初始化流程
  async initializeHome(categoryId: number = 1): Promise<{
    categories: Category[];
    homeData: HomeResponse;
    filterTags: FilterTagsResponse;
  }> {
    try {
      // 并行获取数据，提升性能
      const [categories, homeData, filterTags] = await Promise.all([
        this.getCategories(),
        this.getHomeData(categoryId, 1),
        this.getFilterTags(categoryId)
      ]);
      
      return {
        categories,
        homeData,
        filterTags
      };
    } catch (error) {
      console.error('首页初始化失败:', error);
      throw error;
    }
  }
}

  // 使用示例
  const homeService = new HomeDataService(api);
```

#### **浏览历史服务**
```typescript
// 浏览历史服务（基于观看进度自动生成）
class BrowseHistoryService {
  private api: ApiClient;
  
  constructor(api: ApiClient) {
    this.api = api;
  }
  
  // 获取浏览历史
  async getBrowseHistory(page: number = 1, size: number = 20): Promise<BrowseHistoryResponse> {
    try {
      const response = await this.api.get<BrowseHistoryResponse>(
        `/api/video/browse-history?page=${page}&size=${size}`
      );
      return response;
    } catch (error) {
      console.error('获取浏览历史失败:', error);
      throw error;
    }
  }
  
  // 记录观看进度（会自动更新浏览历史）
  async recordWatchProgress(episodeIdentifier: string | number, stopAtSecond: number): Promise<void> {
    try {
      await this.api.post('/api/video/progress', {
        episodeIdentifier,
        stopAtSecond
      });
      console.log('观看进度记录成功，浏览历史已自动更新');
    } catch (error) {
      console.error('观看进度记录失败:', error);
      // 不抛出错误，避免影响主要业务逻辑
    }
  }
  
  // 获取分页浏览历史
  async loadBrowseHistoryPage(page: number, size: number = 10): Promise<BrowseHistoryItem[]> {
    const response = await this.getBrowseHistory(page, size);
    return response.data.list;
  }
  
  // 检查是否还有更多数据
  async hasMoreHistory(page: number, size: number = 10): Promise<boolean> {
    const response = await this.getBrowseHistory(page, size);
    return response.data.hasMore;
  }
}

// 使用示例
const browseHistoryService = new BrowseHistoryService(api);

// 在React组件中使用
const BrowseHistoryPage = () => {
  const [historyData, setHistoryData] = useState<BrowseHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const loadHistory = async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await browseHistoryService.getBrowseHistory(pageNum, 20);
      if (append) {
        setHistoryData(prev => [...prev, ...response.data.list]);
      } else {
        setHistoryData(response.data.list);
      }
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('加载浏览历史失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadHistory(1);
  }, []);
  
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistory(nextPage, true);
    }
  };
  
  return (
    <div>
      {historyData.map(item => (
        <div key={item.seriesId} className="history-item">
          <img src={item.seriesCoverUrl} alt={item.seriesTitle} />
          <div>
            <h3>{item.seriesTitle}</h3>
            <p>{item.watchStatus}</p>
            <p>最后观看：{item.lastVisitTime}</p>
            <p>观看了 {item.visitCount} 集</p>
          </div>
        </div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? '加载中...' : '加载更多'}
        </button>
      )}
    </div>
  );
};

// 在视频播放器中记录观看进度
const VideoPlayer = ({ episodeId, onProgressUpdate }: VideoPlayerProps) => {
  const recordProgress = (currentTime: number) => {
    // 每30秒记录一次观看进度
    browseHistoryService.recordWatchProgress(episodeId, Math.floor(currentTime));
  };
  
  // ... 视频播放器逻辑
};
```

  // 在组件中使用
  const HomePage = () => {
    const [homeData, setHomeData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [filterTags, setFilterTags] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const loadHomeData = async () => {
        try {
          setLoading(true);
          const data = await homeService.initializeHome(1); // 默认加载分类ID为1的数据
          
          setCategories(data.categories);
          setHomeData(data.homeData);
          setFilterTags(data.filterTags);
        } catch (error) {
          console.error('加载首页数据失败:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadHomeData();
    }, []);
    
    // 切换分类
    const handleCategoryChange = async (categoryId: number) => {
      try {
        const [newHomeData, newFilterTags] = await Promise.all([
          homeService.getHomeData(categoryId, 1),
          homeService.getFilterTags(categoryId)
        ]);
        
        setHomeData(newHomeData);
        setFilterTags(newFilterTags);
      } catch (error) {
        console.error('切换分类失败:', error);
      }
    };
    
    if (loading) {
      return <LoadingSpinner />;
    }
    
    return (
      <div>
        {/* 分类选择器 */}
        <CategorySelector 
          categories={categories}
          onCategoryChange={handleCategoryChange}
        />
        
        {/* 首页内容 */}
        <HomeContent 
          homeData={homeData}
          filterTags={filterTags}
        />
      </div>
    );
  };
```

#### **筛选器使用示例**
```typescript
// 筛选器组件示例
const FilterSelector = ({ 
  filterTags, 
  onFilterChange, 
  selectedFilters 
}: FilterSelectorProps) => {
  const handleFilterSelect = (groupId: string, tagId: number) => {
    const newFilters = { ...selectedFilters };
    
    if (!newFilters[groupId]) {
      newFilters[groupId] = [];
    }
    
    const existingIndex = newFilters[groupId].findIndex(id => id === tagId);
    
    if (existingIndex >= 0) {
      // 移除已选择的标签
      newFilters[groupId].splice(existingIndex, 1);
    } else {
      // 添加新选择的标签
      newFilters[groupId].push(tagId);
    }
    
    onFilterChange(newFilters);
  };
  
  const buildFilterIds = (filters: Record<string, number[]>): string => {
    // 构建筛选参数字符串，格式：1,2,0,0,0
    const filterGroups = ['type', 'region', 'year', 'status', 'quality'];
    return filterGroups.map(group => {
      const groupFilters = filters[group] || [];
      return groupFilters.length > 0 ? groupFilters.join(',') : '0';
    }).join(',');
  };
  
  return (
    <div className="filter-selector">
      {filterTags?.data?.map((group, groupIndex) => (
        <div key={groupIndex} className="filter-group">
          <h4>{group.name}</h4>
          <div className="filter-tags">
            {group.list.map((tag) => (
              <button
                key={tag.index}
                className={`filter-tag ${
                  selectedFilters[group.name]?.includes(tag.classifyId) 
                    ? 'selected' 
                    : ''
                }`}
                onClick={() => handleFilterSelect(group.name, tag.classifyId)}
              >
                {tag.classifyName}
              </button>
            ))}
          </div>
        </div>
      ))}
      
      {/* 应用筛选按钮 */}
      <button 
        className="apply-filters"
        onClick={() => {
          const filterIds = buildFilterIds(selectedFilters);
          // 调用筛选接口
          onFilterChange(selectedFilters, filterIds);
        }}
      >
        应用筛选
      </button>
    </div>
  );
};

// 在视频列表组件中使用筛选器
const VideoList = ({ categoryId }: { categoryId: number }) => {
  const [filterTags, setFilterTags] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 获取筛选标签
  useEffect(() => {
    const loadFilterTags = async () => {
      try {
        const tags = await fetch(`/api/list/getfilterstags?channeid=${categoryId}`)
          .then(res => res.json());
        setFilterTags(tags);
      } catch (error) {
        console.error('获取筛选标签失败:', error);
      }
    };
    
    loadFilterTags();
  }, [categoryId]);
  
  // 应用筛选
  const handleFilterChange = async (filters: any, filterIds?: string) => {
    setSelectedFilters(filters);
    
    if (filterIds) {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/list/getfiltersdata?channeid=${categoryId}&ids=${filterIds}&page=1`
        );
        const data = await response.json();
        setVideos(data.data.list || []);
      } catch (error) {
        console.error('筛选失败:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className="video-list-page">
      {/* 筛选器 */}
      <FilterSelector
        filterTags={filterTags}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
      />
      
      {/* 视频列表 */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};
```
```

### 3. 错误处理

#### **统一错误处理**
```typescript
class ErrorHandler {
  static handle(error: any) {
    console.error('API Error:', error);
    
    if (error.code === 401) {
      // Token过期，跳转登录
      useUserStore.getState().logout();
      router.push('/login');
      showToast('登录已过期，请重新登录');
    } else if (error.code === 429) {
      // 请求频率限制
      showToast('请求过于频繁，请稍后再试');
    } else {
      // 其他错误
      showToast(error.message || '请求失败');
    }
  }
}
```

### 4. Token自动刷新

#### **Token管理器**
```typescript
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 请求拦截器：添加token
    axios.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
    
    // 响应拦截器：处理token过期
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // 尝试刷新token
            const newToken = await this.refreshAccessToken();
            
            // 重新发送原始请求
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // 刷新失败，重新登录
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  async refreshAccessToken(): Promise<string> {
    // 防止重复刷新
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.doRefreshToken();
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  private async doRefreshToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post('/api/user/refresh', {
        refresh_token: this.refreshToken
      });
      
      this.accessToken = response.data.access_token;
      localStorage.setItem('access_token', this.accessToken);
      
      return this.accessToken;
    } catch (error) {
      // 刷新失败，清除所有token
      this.logout();
      throw error;
    }
  }
  
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
  
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
  
  getAccessToken(): string | null {
    return this.accessToken;
  }
  
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

// 使用示例
const tokenManager = new TokenManager();

// 登录后设置tokens
function handleLoginSuccess(response: LoginResponse) {
  tokenManager.setTokens(
    response.access_token,
    response.refresh_token
  );
}
```

---

## 🚀 最佳实践

### 1. 缓存策略
- **分类数据**: 缓存1小时（变化很少）
- **首页数据**: 缓存5分钟（变化中等）
- **剧集列表**: 用户数据缓存5分钟，公开数据缓存30分钟
- **系列详情**: 缓存15分钟

### 2. 请求优化
- 使用分页加载，避免一次性加载大量数据
- 实现虚拟滚动，提升长列表性能
- 预加载下一页数据，提升用户体验
- 合理使用缓存，减少重复请求

### 3. 错误处理
- 网络错误自动重试3次
- 使用指数退避策略
- 区分可重试和不可重试的错误
- 提供友好的错误提示

### 4. Token管理
- 实现自动刷新机制，避免用户频繁登录
- 在多个标签页间同步token状态
- 定期检查token有效性
- 支持多设备登录管理

### 5. Token自动刷新

#### **Token管理器**
```typescript
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 请求拦截器：添加token
    axios.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });
    
    // 响应拦截器：处理token过期
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // 尝试刷新token
            const newToken = await this.refreshAccessToken();
            
            // 重新发送原始请求
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // 刷新失败，重新登录
            this.logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  async refreshAccessToken(): Promise<string> {
    // 防止重复刷新
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.doRefreshToken();
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  private async doRefreshToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post('/api/user/refresh', {
        refresh_token: this.refreshToken
      });
      
      this.accessToken = response.data.access_token;
      localStorage.setItem('access_token', this.accessToken);
      
      return this.accessToken;
    } catch (error) {
      // 刷新失败，清除所有token
      this.logout();
      throw error;
    }
  }
  
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
  
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
  
  getAccessToken(): string | null {
    return this.accessToken;
  }
  
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

// 使用示例
const tokenManager = new TokenManager();

// 登录后设置tokens
function handleLoginSuccess(response: LoginResponse) {
  tokenManager.setTokens(
    response.access_token,
    response.refresh_token
  );
}
```

---

## 📞 技术支持

如有接口使用问题，请联系开发团队或查看项目文档。

**相关文档**:
- [API汇总文档](./api-summary-documentation.md)
- [详细请求示例](./api-request-examples-detailed.md)
- [数据库架构文档](./database-schema-documentation.md)
- [Redis缓存指南](./redis-cache-guide.md)
- [部署指南](./deployment-guide.md)

**文档版本**: v1.1
**最后更新**: 2025年9月12日
**维护团队**: 短剧系统开发团队


---

## 📘 前端接口速查（仅参数与返回）

### 1) 获取剧集列表
- 接口（需要认证，返回用户进度）：`GET /api/video/episodes`
- 接口（公开）：`GET /api/public/video/episodes`
- Query 参数：
  - `seriesShortId` string（二选一）：系列 ShortID
  - `seriesId` string（二选一）：系列 ID（兼容）
  - `page` number：页码，默认 1
  - `size` number：每页数量，默认 20，最大 200（超出按 200 处理）
- 返回 data：
  - `seriesInfo` SeriesInfo
  - `userProgress?` UserProgress（仅认证时返回）
  - `list` EpisodeItem[]（每项含 `likeCount`/`dislikeCount`/`favoriteCount`、`episodeAccessKey`、`urls[]`）
  - `total` number，`page` number，`size` number，`hasMore` boolean，`currentEpisode` string

主要字段说明：
- EpisodeItem.urls[]：`{ quality, accessKey, cdnUrl?, ossUrl?, subtitleUrl? }`
- EpisodeItem.episodeAccessKey：用于按"剧集级"获取整集所有地址
- EpisodeItem.userInteraction：用户交互状态（仅认证时返回）
  - `liked`：是否点赞了这一集
  - `disliked`：是否点踩了这一集
  - `favorited`：是否收藏了这个系列（同系列所有集相同）⭐

### 2) 获取播放地址
- 接口：`POST /api/video/url/query`
- Body：
  - `type` 'episode' | 'url'：accessKey 类型（剧集级或地址级）
  - `accessKey` string：对应类型的 accessKey
- 返回 data：
  - `episodeId` number，`episodeShortId` string，`episodeTitle` string
  - `seriesId?` number，`seriesShortId?` string
  - `urls`：`{ id, quality, cdnUrl, ossUrl, subtitleUrl?, accessKey, createdAt, updatedAt }[]`
  - `accessKeySource` 'episode' | 'url'

### 3) 剧集交互（播放/点赞/不喜欢/收藏）
- 接口：`POST /api/video/episode/activity`
- Body：
  - `shortId` string（必填）：剧集 ShortID
  - `type` 'play' | 'like' | 'dislike' | 'favorite'（必填）
- 返回 data：`{ episodeId, shortId, type }`

交互含义：
- `play` → 自增 `playCount`
- `like` → 自增 `likeCount`
- `dislike` → 自增 `dislikeCount`
- `favorite` → 自增 `favoriteCount`

### 4) 收藏管理
- 添加收藏：`POST /api/video/episode/activity`
  - Body：`{ shortId: string, type: 'favorite' }`
  - 返回：`{ episodeId, shortId, type }`
- 获取收藏列表：`GET /api/user/favorites?page=1&size=20`
  - 返回：按系列聚合的收藏列表，包含 `favoritedEpisodeCount`、`upCount` 等字段
- 取消收藏：`POST /api/user/favorites/remove`
  - Body：`{ shortId: string }`
  - 返回：`{ removed, shortId, seriesId, episodeId, favoriteType }`
- 收藏统计：`GET /api/user/favorites/stats`
  - 返回：`{ total, seriesCount, episodeCount }`

### 5) 其他说明
- `size` 上限为 200，建议分页拉取并根据 `hasMore` 判断是否继续加载
- accessKey 获取：
  - 剧集级：`/api/video(或/public/video)/episodes` 的 `data.list[i].episodeAccessKey`
  - 地址级：同接口 `data.list[i].urls[j].accessKey`
- 收藏功能特点：
  - 按系列聚合显示，多集收藏只显示一个系列条目
  - `upCount` 字段用于显示"更新X集"角标
  - 所有收藏操作都需要 JWT 认证
