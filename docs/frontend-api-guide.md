# 🚀 前端API接口文档

## 📋 文档说明

本文档专为前端开发者设计，按照用户使用流程和业务逻辑组织，包含完整的接口说明、代码示例和集成建议。

**技术栈**: NestJS + TypeORM + MySQL + Redis + JWT  
**基础URL**: `http://localhost:8080` (开发环境)  
**文档版本**: v1.1
**最后更新**: 2025年9月12日

---

## ⚠️ 🚨 前端对接更新提醒

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
- `createdAt`: string - 创建时间
- `updatedAt`: string - 更新时间
- `seriesId`: number - 所属系列ID
- `seriesTitle`: string - 所属系列标题
- `seriesShortId`: string - 所属系列ShortID
- `likeCount`: number - 点赞数
- `dislikeCount`: number - 点踩数
- `favoriteCount`: number - 收藏数
- `lastWatchTime`: string - 最后观看时间

#### **2. API路径修正**
- ❌ **旧路径**：`/api/video/episode-url/query` 和 `/api/video/episode-url/:accessKey`
- ✅ **新路径**：`/api/video/url/query` 和 `/api/video/url/access/:accessKey`
- ❌ **旧路径**：`/api/list/getfilterstags?channeid=1`
- ✅ **新路径**：`/api/home/getfilterstags?channeid=1`

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
- 新增剧集交互接口：`POST /api/video/episode/:id/reaction`
- 支持三种交互类型：点赞(`like`)、不喜欢(`dislike`)、收藏(`favorite`)
- 交互计数会实时反映在 `likeCount`、`dislikeCount`、`favoriteCount` 字段中

#### **7. 文档导航**
- 📖 [VideoItem 接口定义](#videoitem)
- 📖 [SeriesInfo 接口定义](#seriesinfo)
- 📖 [EpisodeItem 接口定义](#episodeitem)
- 📖 [筛选参数说明](#筛选参数)
- 📖 [剧集交互接口](#剧集交互)

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

#### **Telegram OAuth 登录**
```typescript
// 接口地址
POST /api/user/telegram-login

// 请求参数
interface LoginRequest {
  id: number;           // Telegram用户ID
  first_name: string;   // 用户名
  username?: string;    // 用户名（可选）
  auth_date: number;    // 认证时间戳
  hash: string;         // 验证哈希
}

// 响应格式
interface LoginResponse {
  access_token: string;   // 访问令牌（7天有效）
  refresh_token: string;  // 刷新令牌
  expires_in: number;     // 过期时间（秒）
  token_type: "Bearer";   // 令牌类型
}
```

#### **获取用户信息**
```typescript
// 接口地址
GET /api/user/me
Headers: Authorization: Bearer <access_token>

// 响应格式
interface UserInfo {
  id: string;           // 用户ID
  username: string;     // 用户名
  firstName: string;    // 名字
  lastName: string;     // 姓氏
  isActive: number;     // 是否激活
  createdAt: string;    // 创建时间
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
  tags?: string[];         // 系列标签（题材/地区/语言/年份/状态）
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
  episodeAccessKey?: string; // 剧集级 accessKey，用于 /api/video/episode-url/:accessKey 或 POST 查询
  urls: EpisodeUrl[];      // 播放地址
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
POST /api/video/episode-url/query
// 推荐请求体
interface EpisodeUrlQuery {
  type: 'episode' | 'url';  // 'episode' = episodes.access_key, 'url' = episode_urls.access_key
  accessKey: string;        // 对应类型的 accessKey
}
// 兼容老格式
// { key: 'ep:<accessKey>' } 或 { key: 'url:<accessKey>' }

// 示例（使用剧集级 accessKey）
curl -X POST "http://localhost:8080/api/video/episode-url/query" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "episode",
    "accessKey": "<EPISODE_ACCESS_KEY>"
  }'

// 示例（使用地址级 accessKey）
curl -X POST "http://localhost:8080/api/video/episode-url/query" \
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

### 6. 评论互动流程

#### **发表评论**
```typescript
// 接口地址
POST /api/video/comment
Headers: Authorization: Bearer <access_token>

// 请求参数
interface CommentRequest {
  episodeIdentifier: string;  // 剧集ShortID或ID
  content: string;            // 评论内容
  appearSecond?: number;      // 弹幕出现时间（秒）
}
```

<a id="剧集交互"></a>
#### **剧集交互（点赞/不喜欢/收藏）**
```typescript
// 接口地址
POST /api/video/episode/:id/reaction
Headers: Authorization: Bearer <access_token>

// 请求参数
interface EpisodeReactionRequest {
  type: 'like' | 'dislike' | 'favorite';  // 交互类型
}

// 响应格式
interface EpisodeReactionResponse {
  code: number;
  data: {
    id: number;      // 剧集ID
    type: string;    // 交互类型
  };
  message: string;
  success: boolean;
}

// TypeScript 类型定义（建议添加到项目中）
export type EpisodeReactionType = 'like' | 'dislike' | 'favorite';

export interface EpisodeReactionRequest {
  type: EpisodeReactionType;
}

export interface EpisodeReactionResponse {
  code: number;
  data: {
    id: number;
    type: EpisodeReactionType;
  };
  message: string;
  success: boolean;
}
```

##### 交互类型说明
- **`like`**: 点赞剧集，会增加剧集的 `likeCount`
- **`dislike`**: 不喜欢剧集，会增加剧集的 `dislikeCount`
- **`favorite`**: 收藏剧集，会增加剧集的 `favoriteCount`

##### 使用示例
```typescript
// 点赞剧集
const likeEpisode = async (episodeId: number) => {
  const response = await fetch(`/api/video/episode/${episodeId}/reaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      type: 'like'
    })
  });
  const result = await response.json();
  return result;
};

// 收藏剧集
const favoriteEpisode = async (episodeId: number) => {
  const response = await fetch(`/api/video/episode/${episodeId}/reaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      type: 'favorite'
    })
  });
  const result = await response.json();
  return result;
};
```

##### curl 示例
```bash
# 点赞剧集ID为123的剧集
curl -X POST "http://localhost:8080/api/video/episode/123/reaction" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "like"
  }'

# 收藏剧集
curl -X POST "http://localhost:8080/api/video/episode/123/reaction" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "favorite"
  }'

# 标记不喜欢
curl -X POST "http://localhost:8080/api/video/episode/123/reaction" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "dislike"
  }'
```

##### 注意事项
- **需要认证**: 必须在请求头中携带有效的 `Authorization: Bearer <access_token>`
- **单向操作**: 目前只支持增加计数，不支持取消操作
- **实时更新**: 操作后会立即更新剧集的对应计数器
- **数据统计**: 这些计数会反映在系列列表和剧集列表中
- **并发安全**: 系统会处理并发请求，确保计数准确性

---

### 7. 个人中心流程

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

### 8. 缓存管理流程

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

### 9. 健康检查流程

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

### 8. 缓存管理流程

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

### 9. 健康检查流程

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
        `/api/home/getfilterstags?channeid=${categoryId}`
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

