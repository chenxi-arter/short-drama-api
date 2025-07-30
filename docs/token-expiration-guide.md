# JWT Token 过期处理指南

## 当前 Token 机制

### Token 配置
- **过期时间**: 由环境变量 `JWT_EXPIRES_IN` 控制
- **密钥**: 由环境变量 `JWT_SECRET` 控制
- **提取方式**: Bearer Token (Authorization: Bearer <token>)

### Token 验证流程
1. 客户端在请求头中携带 `Authorization: Bearer <token>`
2. `JwtAuthGuard` 拦截请求并验证 token
3. `JwtStrategy` 解析 token payload 并验证有效性

## Token 过期处理

### 服务端响应
当 token 过期时，服务端会返回：
```json
{
  "statusCode": 401,
  "message": "登录信息已过期",
  "error": "Unauthorized"
}
```

### 客户端处理策略

#### 1. 检测 Token 过期
客户端应监听 HTTP 401 状态码，特别是错误信息为 "登录信息已过期" 的响应。

```javascript
// 示例：axios 拦截器
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && 
        error.response?.data?.message === '登录信息已过期') {
      // Token 已过期，需要重新登录
      handleTokenExpired();
    }
    return Promise.reject(error);
  }
);
```

#### 2. 处理 Token 过期

**方案一：重新登录（推荐）**
```javascript
function handleTokenExpired() {
  // 1. 清除本地存储的 token
  localStorage.removeItem('access_token');
  
  // 2. 重定向到登录页面
  window.location.href = '/login';
  
  // 3. 或者显示登录弹窗
  showLoginModal();
}
```

**方案二：自动刷新（需要实现 refresh token）**
```javascript
// 注意：当前系统未实现 refresh token 机制
// 如需实现，需要扩展后端 API
async function refreshToken() {
  try {
    const response = await axios.post('/api/auth/refresh', {
      refresh_token: localStorage.getItem('refresh_token')
    });
    
    localStorage.setItem('access_token', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    // Refresh token 也过期，需要重新登录
    handleTokenExpired();
  }
}
```

## 最佳实践

### 1. 预防性检查
在发送请求前检查 token 是否即将过期：

```javascript
function isTokenExpiringSoon(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // 转换为毫秒
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // 如果 5 分钟内过期，认为即将过期
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    return true; // 解析失败，认为 token 无效
  }
}
```

### 2. 用户体验优化

**提前提醒用户**
```javascript
function checkTokenStatus() {
  const token = localStorage.getItem('access_token');
  if (token && isTokenExpiringSoon(token)) {
    showNotification('您的登录即将过期，请重新登录');
  }
}

// 定期检查（每分钟）
setInterval(checkTokenStatus, 60000);
```

**保存用户状态**
```javascript
function handleTokenExpired() {
  // 保存当前页面路径，登录后可以返回
  localStorage.setItem('redirect_after_login', window.location.pathname);
  
  // 保存用户正在进行的操作
  saveUserProgress();
  
  // 然后重定向到登录页
  redirectToLogin();
}
```

### 3. 安全考虑

- **不要在 URL 中传递 token**
- **使用 HTTPS 传输**
- **定期更换 JWT_SECRET**
- **设置合理的过期时间**（建议 1-24 小时）

## 常见问题

### Q: Token 过期后是否需要重新请求？
**A: 是的，必须重新登录获取新的 token。**

当前系统采用无状态的 JWT 认证，不支持 token 刷新机制。一旦 token 过期，客户端必须：
1. 清除本地存储的过期 token
2. 重新调用登录接口（`/api/user/telegram-login`）
3. 获取新的 access_token
4. 使用新 token 继续后续请求

### Q: 如何避免频繁重新登录？
**A: 可以通过以下方式优化：**
1. 设置合理的 token 过期时间
2. 实现 refresh token 机制（需要后端支持）
3. 在 token 即将过期时提前提醒用户
4. 保存用户操作状态，登录后恢复

### Q: 多个标签页如何处理 token 过期？
**A: 使用 localStorage 事件监听：**
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'access_token' && !e.newValue) {
    // Token 被其他标签页清除，当前页面也需要处理
    handleTokenExpired();
  }
});
```

## 扩展建议

如果需要更好的用户体验，建议实现以下功能：

1. **Refresh Token 机制**
   - 短期 access_token（1小时）
   - 长期 refresh_token（7天）
   - 自动刷新机制

2. **Token 续期**
   - 用户活跃时自动延长 token 有效期
   - 滑动窗口机制

3. **多设备管理**
   - Token 黑名单机制
   - 设备管理功能
   - 强制下线功能