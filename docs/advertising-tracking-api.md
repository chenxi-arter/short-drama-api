# 广告追踪接口文档

## 📋 概述

当用户通过站外广告链接（微信、抖音等）进入网站时，需要调用接口记录用户行为，用于统计广告效果。

**核心场景**：
1. 用户点击站外广告 → 进入网站 → 记录访问事件
2. 用户完成注册 → 记录注册转化

---

## 🔗 接口列表

### 1. 记录访问事件

**接口地址**: `POST /api/tracking/advertising/event`

**功能说明**: 记录用户通过广告进入网站的访问行为

**认证**: 可选（如果传 JWT Token，会自动获取 userId）

**请求参数**:
```json
{
  "campaignCode": "WX_20251117_8FA5D0",  // 广告计划代码（必填）
  "eventType": "click",                   // 事件类型（必填）
  "sessionId": "session_xxx",             // 会话ID（必填）
  "deviceId": "device_xxx"                // 设备ID（必填）
  // userId 会从 JWT Token 自动获取，无需传递
}
```

**事件类型（eventType）**:
- `click` - 点击广告进入

**响应示例**:
```json
{
  "code": 200,
  "message": "事件记录成功",
  "data": {
    "success": true,
    "message": "事件记录成功"
  }
}
```

**使用示例**:
```javascript
// 页面加载时，从URL获取广告代码
const campaignCode = new URLSearchParams(window.location.search).get('campaign');
const token = localStorage.getItem('access_token');

if (campaignCode) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // 如果已登录，传 Token
  }
  
  axios.post('/api/tracking/advertising/event', {
    campaignCode: campaignCode,
    eventType: 'click',
    sessionId: getSessionId(),
    deviceId: getDeviceId()
    // userId 会从 Token 自动获取，无需传递
  }, { headers });
}
```

---

### 2. 记录注册转化

**接口地址**: `POST /api/tracking/advertising/conversion`

**功能说明**: 记录用户完成注册的转化行为

**认证**: 需要 JWT Token（会自动获取 userId）

**请求参数**:
```json
{
  "campaignCode": "WX_20251117_8FA5D0",  // 广告计划代码（必填）
  "conversionType": "register",           // 转化类型（必填）
  "sessionId": "session_xxx",             // 会话ID（必填）
  "deviceId": "device_xxx"                // 设备ID（必填）
  // userId 会从 JWT Token 自动获取，无需传递
}
```

**转化类型（conversionType）**:
- `register` - 注册成功

**响应示例**:
```json
{
  "code": 200,
  "message": "转化记录成功",
  "data": {
    "success": true,
    "message": "转化记录成功",
    "conversionId": "28"
  }
}
```

**使用示例**:
```javascript
// 用户注册成功后调用
function onRegisterSuccess(token) {
  const campaignCode = localStorage.getItem('campaignCode');
  
  if (campaignCode) {
    axios.post('/api/tracking/advertising/conversion', {
      campaignCode: campaignCode,
      conversionType: 'register',
      sessionId: getSessionId(),
      deviceId: getDeviceId()
      // userId 会从 Token 自动获取，无需传递
    }, {
      headers: {
        'Authorization': `Bearer ${token}` // 必须传 Token
      }
    });
  }
}
```

---

## 🛠️ 工具函数

### 生成和获取会话ID
```javascript
function getSessionId() {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}
```

### 生成和获取设备ID
```javascript
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
```

### 保存广告代码
```javascript
function saveCampaignCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignCode = urlParams.get('campaign');
  
  if (campaignCode) {
    localStorage.setItem('campaignCode', campaignCode);
  }
}
```

---

## 📝 完整实现示例

```javascript
// ========== 页面加载时执行 ==========
// 1. 初始化工具函数
function getSessionId() {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// 2. 检测并记录广告访问
const urlParams = new URLSearchParams(window.location.search);
const campaignCode = urlParams.get('campaign');

if (campaignCode) {
  // 保存广告代码
  localStorage.setItem('campaignCode', campaignCode);
  
  // 记录访问事件
  const token = localStorage.getItem('access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // 如果已登录，传 Token
  }
  
  axios.post('/api/tracking/advertising/event', {
    campaignCode: campaignCode,
    eventType: 'click',
    sessionId: getSessionId(),
    deviceId: getDeviceId()
    // userId 会从 Token 自动获取
  }, { headers }).catch(err => {
    console.error('记录访问事件失败:', err);
  });
}

// ========== 用户注册成功后执行 ==========
// 示例：在注册接口的回调中调用
async function handleRegister(formData) {
  try {
    // 调用你们的注册接口
    const response = await axios.post('/api/auth/register', formData);
    
    // 从注册接口响应中获取 access_token
    const token = response.data.access_token;
    
    // 保存 token
    localStorage.setItem('access_token', token);
    
    // 记录注册转化
    const campaignCode = localStorage.getItem('campaignCode');
    if (campaignCode) {
      axios.post('/api/tracking/advertising/conversion', {
        campaignCode: campaignCode,
        conversionType: 'register',
        sessionId: getSessionId(),
        deviceId: getDeviceId()
        // userId 会从 Token 自动获取
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // 必须传 Token
        }
      }).catch(err => {
        console.error('记录注册转化失败:', err);
      });
    }
    
    // 跳转到首页或其他页面
    router.push('/home');
  } catch (error) {
    console.error('注册失败:', error);
  }
}
```

---

## ⚠️ 注意事项

1. **广告链接格式**
   - 支持两种参数名格式（推荐使用 UTM 标准格式）：
     - ✅ 标准 UTM 格式（推荐）：`?utm_campaign=OT_20260213_D53363&utm_source=XG-WEB`
     - ✅ 简短格式（兼容）：`?campaign=OT_20260213_D53363`
   - 示例：`https://www.xgshort.com/tgad?utm_campaign=OT_20260213_D53363&utm_source=XG-WEB`

2. **前端读取 campaignCode 的正确方式**（兼容两种格式）
   ```js
   const params = new URLSearchParams(window.location.search);
   // 优先读 utm_campaign（UTM标准），没有再读 campaign（旧格式）
   const campaignCode = params.get('utm_campaign') || params.get('campaign');
   ```

3. **参数说明**
   - `utm_campaign` / `campaign`: 推广计划代码，从URL参数获取后保存到 localStorage
   - `utm_source`: 可选，来源标识（如 `XG-WEB`、`TG-BOT` 等），仅用于外部统计工具，后端不读取
   - `sessionId`: 会话级别，浏览器关闭后失效
   - `deviceId`: 设备级别，永久保存
   - `userId`: 从 JWT Token 自动获取，无需在请求体中传递

3. **调用时机**
   - **访问事件**: 页面加载时检测到campaign参数立即调用
   - **注册转化**: 用户注册成功后立即调用

4. **错误处理**
   - 所有接口调用都应该用 `try-catch` 或 `.catch()` 处理错误
   - 追踪失败不应影响正常业务流程

5. **重复转化**
   - 同一用户的同一类型转化只记录一次
   - 重复调用会返回提示："该用户的此类型转化已存在"

6. **计划暂停**
   - 如果广告计划被暂停，接口返回："广告计划已暂停，无法记录事件"
   - 不影响正常业务，只是不记录数据

---

## 🎯 典型流程

### 网页推广流程

```
用户在微信/抖音等平台看到广告
    ↓
点击广告链接: https://网站.com?campaign=WX_20251117_8FA5D0
    ↓
进入网站，页面加载
    ↓
检测到 campaign 参数 → 存入 localStorage
    ↓
调用接口记录「点击事件」✅  POST /api/tracking/advertising/event
    ↓
用户浏览、注册
    ↓
注册成功
    ↓
调用接口记录「注册转化」✅  POST /api/tracking/advertising/conversion
    ↓
后台统计数据更新
```

---

### Telegram 推广流程

TG 推广链接使用 `startapp` 参数（非 URL query 参数），需要在 TG Web App 初始化时手动解析。

**推广链接格式**：
```
https://t.me/your_bot/your_app?startapp=TG_20251117_8FA5D0
```

> 其中 `startapp=` 后面的值即为 `campaignCode`，由投放人员创建推广计划时生成。

**第一步：在 TG Web App 初始化时解析 campaignCode 并记录点击**

```javascript
// Telegram Web App 初始化
const tg = window.Telegram.WebApp;
tg.ready();

// 从 startapp 参数中读取推广代码
const startParam = tg.initDataUnsafe?.start_param || '';
// startParam 示例: "TG_20251117_8FA5D0"

if (startParam) {
  // 保存到 localStorage，供注册转化时使用
  localStorage.setItem('campaignCode', startParam);

  // 记录「点击事件」（进入 TG App 即算点击）
  axios.post('/api/tracking/advertising/event', {
    campaignCode: startParam,
    eventType: 'click',
    sessionId: getSessionId(),
    deviceId: getDeviceId()
    // 此时可能未登录，不传 token 也可以
  }).catch(err => console.error('记录点击失败:', err));
}
```

**第二步：TG 登录成功后记录转化**

```javascript
async function handleTelegramLogin(initData) {
  // 1. 调用 TG 登录接口
  const res = await axios.post('/api/auth/telegram/webapp-login', {
    initData,
    deviceInfo: navigator.userAgent
  });
  const token = res.data.access_token;
  localStorage.setItem('access_token', token);

  // 2. 记录「注册转化」
  const campaignCode = localStorage.getItem('campaignCode');
  if (campaignCode) {
    axios.post('/api/tracking/advertising/conversion', {
      campaignCode,
      conversionType: 'register',
      sessionId: getSessionId(),
      deviceId: getDeviceId()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error('记录转化失败:', err));
  }
}
```

**TG 推广完整流程图**：

```
投放人员在管理后台创建推广计划（平台选 telegram）
    ↓
生成推广链接: t.me/your_bot/app?startapp=TG_20251117_8FA5D0
    ↓
用户点击 TG 推广链接进入 Web App
    ↓
TG Web App 初始化，读取 tg.initDataUnsafe.start_param
    ↓
解析到 campaignCode → 存入 localStorage
    ↓
调用接口记录「点击事件」✅  POST /api/tracking/advertising/event
    ↓
用户完成 TG 登录
    ↓
调用接口记录「注册转化」✅  POST /api/tracking/advertising/conversion
    ↓
后台统计数据更新
```

> ⚠️ **注意**：如果前端未做第一步（解析 `start_param` 并调用 event 接口），后台将只有转化数，**点击数会一直为 0**，导致转化率计算异常。

---

## 📊 数据统计

记录的数据会在管理后台实时展示：
- 总点击数（`totalClicks`）
- 总转化数（`totalConversions`）
- 转化率 = 转化数 / 点击数（`conversionRate`）
- 成本、CPC、CPA 等指标

查询接口：
```bash
# 所有推广计划汇总
GET /api/admin/advertising/dashboard

# 单个计划详情
GET /api/admin/advertising/campaigns/:id/stats

# 各平台横向对比
GET /api/admin/advertising/platform-comparison
```

---

## 📌 附录1：轮播图点击统计接口

### 轮播图统一追踪接口

**接口地址**: `POST /api/banners/track`

**功能说明**: 统一记录轮播图的点击和曝光行为

**请求参数**:
```json
{
  "id": 123,              // 轮播图ID（必填）
  "type": "click"         // 追踪类型（必填）："click" 或 "impression"
}
```

**type 参数说明**:
- `click` - 记录点击
- `impression` - 记录曝光

**响应示例**:
```json
{
  "code": 200,
  "msg": "ok",
  "success": true,
  "timestamp": 1700000000000
}
```

**使用示例**:
```javascript
// 示例1：记录点击
function onBannerClick(bannerId, linkUrl) {
  axios.post('/api/banners/track', {
    id: bannerId,
    type: 'click'
  }).catch(err => {
    console.error('点击记录失败:', err);
  });
  
  // 跳转到目标链接
  if (linkUrl) {
    window.location.href = linkUrl;
  }
}

// 示例2：记录曝光
function onBannerVisible(bannerId) {
  axios.post('/api/banners/track', {
    id: bannerId,
    type: 'impression'
  }).catch(err => {
    console.error('曝光记录失败:', err);
  });
}

// 示例3：使用 Intersection Observer 自动追踪曝光
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bannerId = parseInt(entry.target.dataset.bannerId);
      onBannerVisible(bannerId);
    }
  });
}, { threshold: 0.5 }); // 50%可见时触发

// 监听所有轮播图
document.querySelectorAll('.banner-item').forEach(banner => {
  observer.observe(banner);
});
```

---

### 轮播图统计数据查询

**接口地址**: `GET /api/banners/:id/stats`

**功能说明**: 查询轮播图的统计数据（按日统计）

**请求参数**:
- **路径参数**:
  - `id`: 轮播图ID（必填）
- **查询参数**:
  - `from`: 开始日期（格式：YYYY-MM-DD）
  - `to`: 结束日期（格式：YYYY-MM-DD）

**响应示例**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": [
    {
      "date": "2025-11-18",
      "impressions": 1500,
      "clicks": 120,
      "ctr": 0.08
    },
    {
      "date": "2025-11-17",
      "impressions": 1200,
      "clicks": 95,
      "ctr": 0.079
    }
  ],
  "success": true,
  "timestamp": 1700000000000
}
```

**使用示例**:
```javascript
// 查询最近7天的统计数据
async function getBannerStats(bannerId) {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const response = await axios.get(`/api/banners/${bannerId}/stats`, {
    params: { from, to }
  });
  
  console.log('统计数据:', response.data.data);
  return response.data.data;
}
```

---

### 完整示例：轮播图组件

```vue
<template>
  <div class="banner-carousel">
    <div 
      v-for="banner in banners" 
      :key="banner.id"
      :data-banner-id="banner.id"
      class="banner-item"
      @click="handleBannerClick(banner)"
    >
      <img :src="banner.imageUrl" :alt="banner.title" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      banners: [],
      impressionRecorded: new Set() // 记录已曝光的轮播图
    };
  },
  
  mounted() {
    this.loadBanners();
    this.setupImpressionTracking();
  },
  
  methods: {
    async loadBanners() {
      const response = await axios.get('/api/banners/active/list');
      this.banners = response.data.data;
    },
    
    handleBannerClick(banner) {
      // 记录点击（使用新接口）
      axios.post('/api/banners/track', {
        id: banner.id,
        type: 'click'
      }).catch(err => console.error('点击记录失败:', err));
      
      // 跳转
      if (banner.linkUrl) {
        window.location.href = banner.linkUrl;
      }
    },
    
    setupImpressionTracking() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const bannerId = parseInt(entry.target.dataset.bannerId);
            
            // 避免重复记录
            if (!this.impressionRecorded.has(bannerId)) {
              this.impressionRecorded.add(bannerId);
              
              // 记录曝光（使用新接口）
              axios.post('/api/banners/track', {
                id: bannerId,
                type: 'impression'
              }).catch(err => console.error('曝光记录失败:', err));
            }
          }
        });
      }, { threshold: 0.5 });
      
      // 监听所有轮播图
      this.$nextTick(() => {
        document.querySelectorAll('.banner-item').forEach(banner => {
          observer.observe(banner);
        });
      });
    }
  }
};
</script>
```

---

## 📌 附录2：注册/登录接口说明

系统支持三种注册/登录方式，所有方式都会返回 `userId`，用于记录广告转化。

### 1. Telegram Web App 登录

**接口地址**: `POST /api/auth/telegram/webapp-login`

**功能说明**: 使用 Telegram Web App 的 initData 进行用户认证和登录

**请求参数**:
```json
{
  "initData": "query_id=xxx&user=xxx...",  // Telegram initData（必填）
  "deviceInfo": "iPhone 13"                 // 设备信息（选填）
}
```

**响应示例**:
```json
{
  "userId": 123,                           // 用户ID（重要：用于记录转化）
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 2. Telegram Bot 登录

**接口地址**: `POST /api/auth/telegram/bot-login`

**功能说明**: 使用 Telegram Bot 的认证信息进行登录

**请求参数**:
```json
{
  "id": 123456789,                  // Telegram用户ID（必填）
  "first_name": "John",             // 名字（必填）
  "last_name": "Doe",               // 姓氏（选填）
  "username": "johndoe",            // 用户名（选填）
  "auth_date": 1700000000,          // 认证时间戳（必填）
  "hash": "abc123...",              // 认证哈希（必填）
  "deviceInfo": "Android Phone"     // 设备信息（选填）
}
```

**响应示例**:
```json
{
  "userId": 123,                           // 用户ID（重要：用于记录转化）
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 3. 邮箱注册

**接口地址**: `POST /api/auth/register`

**功能说明**: 使用邮箱和密码注册新账号

**请求参数**:
```json
{
  "email": "user@example.com",       // 邮箱（必填）
  "password": "test123456",          // 密码（必填，6-20位，必须包含字母和数字）
  "confirmPassword": "test123456"    // 确认密码（必填，需与password一致）
}
```

**响应示例**:
```json
{
  "userId": 123,                           // 用户ID（重要：用于记录转化）
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 使用示例

#### 示例1：Telegram Web App 登录后记录转化
```javascript
async function handleTelegramLogin(initData) {
  try {
    // 1. 调用 Telegram 登录接口
    const response = await axios.post('/api/auth/telegram/webapp-login', {
      initData: initData,
      deviceInfo: navigator.userAgent
    });
    
    // 2. 获取返回的 access_token
    const token = response.data.access_token;
    
    // 3. 保存token
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    
    // 4. 记录广告注册转化
    const campaignCode = localStorage.getItem('campaignCode');
    if (campaignCode) {
      axios.post('/api/tracking/advertising/conversion', {
        campaignCode: campaignCode,
        conversionType: 'register',
        sessionId: getSessionId(),
        deviceId: getDeviceId()
        // userId 会从 Token 自动获取
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // 必须传 Token
        }
      }).catch(err => {
        console.error('记录注册转化失败:', err);
      });
    }
    
    // 5. 跳转到首页
    router.push('/home');
    
  } catch (error) {
    console.error('登录失败:', error);
  }
}
```

#### 示例2：Telegram Bot 登录后记录转化
```javascript
async function handleTelegramBotLogin(telegramData) {
  try {
    // 1. 调用 Telegram Bot 登录接口
    const response = await axios.post('/api/auth/telegram/bot-login', {
      id: telegramData.id,
      first_name: telegramData.first_name,
      last_name: telegramData.last_name,
      username: telegramData.username,
      auth_date: telegramData.auth_date,
      hash: telegramData.hash,
      deviceInfo: navigator.userAgent
    });
    
    // 2. 获取返回的 access_token
    const token = response.data.access_token;
    
    // 3. 保存token
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    
    // 4. 记录广告注册转化
    const campaignCode = localStorage.getItem('campaignCode');
    if (campaignCode) {
      axios.post('/api/tracking/advertising/conversion', {
        campaignCode: campaignCode,
        conversionType: 'register',
        sessionId: getSessionId(),
        deviceId: getDeviceId()
        // userId 会从 Token 自动获取
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // 必须传 Token
        }
      }).catch(err => {
        console.error('记录注册转化失败:', err);
      });
    }
    
    // 5. 跳转到首页
    router.push('/home');
    
  } catch (error) {
    console.error('登录失败:', error);
  }
}
```

#### 示例3：邮箱注册后记录转化
```javascript
async function handleEmailRegister(formData) {
  try {
    // 1. 调用邮箱注册接口
    const response = await axios.post('/api/auth/register', {
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });
    
    // 2. 获取返回的 access_token
    const token = response.data.access_token;
    
    // 3. 保存token
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    
    // 4. 记录广告注册转化
    const campaignCode = localStorage.getItem('campaignCode');
    if (campaignCode) {
      axios.post('/api/tracking/advertising/conversion', {
        campaignCode: campaignCode,
        conversionType: 'register',
        sessionId: getSessionId(),
        deviceId: getDeviceId()
        // userId 会从 Token 自动获取
      }, {
        headers: {
          'Authorization': `Bearer ${token}` // 必须传 Token
        }
      }).catch(err => {
        console.error('记录注册转化失败:', err);
      });
    }
    
    // 5. 跳转到首页
    router.push('/home');
    
  } catch (error) {
    console.error('注册失败:', error);
    alert(error.response?.data?.message || '注册失败，请重试');
  }
}
```

---

### 重要提示

1. **三种方式都会返回 userId**
   - 所有登录/注册接口都返回 `userId`
   - 这个ID用于记录广告转化

2. **记录转化的时机**
   - 登录/注册成功后立即调用
   - 不要等待，避免用户关闭页面导致转化丢失

3. **保存用户信息**
   - 建议将 `userId` 和 token 保存到 localStorage
   - 方便后续使用和页面刷新后保持登录状态

4. **错误处理**
   - 转化记录失败不应影响正常登录流程
   - 使用 `.catch()` 捕获错误，避免阻塞用户操作
