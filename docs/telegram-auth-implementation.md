# 前端登录注册指导

## 概述

本指导文档专为前端开发者设计，详细说明如何在短剧平台中实现用户注册、登录和账号绑定功能。系统支持邮箱注册登录和Telegram登录两种方式，并支持账号绑定实现双登录方式。

## 功能特性

- ✅ 邮箱注册和登录
- ✅ Telegram WebApp 登录
- ✅ Telegram Bot 登录
- ✅ 账号绑定（邮箱 ⇄ Telegram）
- ✅ JWT 访问令牌和刷新令牌机制
- ✅ 设备信息记录和IP地址跟踪
- ✅ 安全的HMAC-SHA256签名验证
- ✅ 防重放攻击（时间戳验证）

## 登录注册流程

### 1. 邮箱注册

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
  id: number;             // 用户ID
  shortId: string;        // 短ID
  email: string;          // 邮箱
  username: string;       // 用户名
  firstName: string;      // 名字
  lastName: string;       // 姓氏
  isActive: boolean;      // 激活状态
  createdAt: Date;        // 创建时间
}

// 前端实现示例
const registerUser = async (userData: RegisterRequest) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '注册失败');
    }
    
    const result = await response.json();
    console.log('注册成功:', result);
    return result;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};
```

### 2. 邮箱登录

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

// 前端实现示例
const emailLogin = async (credentials: EmailLoginRequest) => {
  try {
    const response = await fetch('/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...credentials,
        deviceInfo: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登录失败');
    }
    
    const tokens = await response.json();
    
    // 保存令牌到本地存储
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    console.log('登录成功');
    return tokens;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};
```

### 3. Telegram WebApp 登录

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

// 前端实现示例
const telegramWebAppLogin = async (initData: string) => {
  try {
    const response = await fetch('/api/auth/telegram/webapp-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        deviceInfo: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Telegram登录失败');
    }
    
    const tokens = await response.json();
    
    // 保存令牌到本地存储
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    console.log('Telegram WebApp登录成功');
    return tokens;
  } catch (error) {
    console.error('Telegram WebApp登录失败:', error);
    throw error;
  }
};

// 在Telegram WebApp中使用
if (window.Telegram?.WebApp) {
  const initData = window.Telegram.WebApp.initData;
  if (initData) {
    telegramWebAppLogin(initData);
  }
}
```

### 4. Telegram Bot 登录

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

// 前端实现示例
const telegramBotLogin = async (botData: TelegramBotLoginRequest) => {
  try {
    const response = await fetch('/api/auth/telegram/bot-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...botData,
        deviceInfo: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Telegram Bot登录失败');
    }
    
    const tokens = await response.json();
    
    // 保存令牌到本地存储
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    console.log('Telegram Bot登录成功');
    return tokens;
  } catch (error) {
    console.error('Telegram Bot登录失败:', error);
    throw error;
  }
};
```

## 用户信息管理

### 获取用户信息

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

// 前端实现示例
const getUserInfo = async () => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('未找到访问令牌');
    }
    
    const response = await fetch('/api/user/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取用户信息失败');
    }
    
    const userInfo = await response.json();
    console.log('用户信息:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};
```

## 账号绑定功能

### 绑定Telegram到邮箱账号

```typescript
// 接口地址
POST /api/user/bind-telegram
Headers: Authorization: Bearer <access_token>

// 请求参数
interface BindTelegramRequest {
  id: number;             // Telegram用户ID
  first_name: string;     // Telegram用户名
  last_name?: string;     // Telegram姓氏（可选）
  username?: string;      // Telegram用户名（可选）
  auth_date: number;      // 认证时间戳
  hash: string;           // 验证哈希
}

// 响应格式
interface BindTelegramResponse {
  success: boolean;       // 绑定结果
  message: string;        // 结果消息
  user: {
    id: number;           // 用户ID
    shortId: string;      // 短ID
    email: string;        // 邮箱
    username: string;     // 用户名
    firstName: string;    // 名字
    lastName: string;     // 姓氏
    telegramId: number;   // Telegram ID
    isActive: boolean;    // 激活状态
  };
}

// 前端实现示例
const bindTelegram = async (telegramData: BindTelegramRequest) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('未找到访问令牌');
    }
    
    const response = await fetch('/api/user/bind-telegram', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(telegramData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '绑定Telegram失败');
    }
    
    const result = await response.json();
    console.log('绑定Telegram成功:', result);
    return result;
  } catch (error) {
    console.error('绑定Telegram失败:', error);
    throw error;
  }
};
```

### 绑定邮箱到Telegram账号

```typescript
// 接口地址
POST /api/user/bind-email
Headers: Authorization: Bearer <access_token>

// 请求参数
interface BindEmailRequest {
  email: string;          // 邮箱地址
  password: string;       // 密码
  confirmPassword: string; // 确认密码
}

// 响应格式
interface BindEmailResponse {
  success: boolean;       // 绑定结果
  message: string;        // 结果消息
  user: {
    id: number;           // 用户ID
    shortId: string;      // 短ID
    email: string;        // 邮箱
    username: string;     // 用户名
    firstName: string;    // 名字
    lastName: string;     // 姓氏
    telegramId: number;   // Telegram ID
    isActive: boolean;    // 激活状态
  };
}

// 前端实现示例
const bindEmail = async (emailData: BindEmailRequest) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('未找到访问令牌');
    }
    
    const response = await fetch('/api/user/bind-email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '绑定邮箱失败');
    }
    
    const result = await response.json();
    console.log('绑定邮箱成功:', result);
    return result;
  } catch (error) {
    console.error('绑定邮箱失败:', error);
    throw error;
  }
};
```

## 令牌管理

### 刷新访问令牌

```typescript
// 接口地址
POST /api/auth/refresh
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

// 前端实现示例
const refreshToken = async () => {
  try {
    const accessToken = localStorage.getItem('access_token');
    const refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!accessToken || !refreshTokenValue) {
      throw new Error('未找到令牌');
    }
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ refresh_token: refreshTokenValue })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '刷新令牌失败');
    }
    
    const tokens = await response.json();
    
    // 更新本地存储的访问令牌
    localStorage.setItem('access_token', tokens.access_token);
    
    console.log('令牌刷新成功');
    return tokens;
  } catch (error) {
    console.error('令牌刷新失败:', error);
    // 刷新失败，清除所有令牌并跳转到登录页
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw error;
  }
};
```

## 用户登出

### 登出当前设备

```typescript
// 接口地址
POST /api/user/logout
Headers: Authorization: Bearer <access_token>

// 请求参数
interface LogoutRequest {
  refresh_token: string;  // 刷新令牌
}

// 响应格式
interface LogoutResponse {
  message: string;        // 登出成功消息
}

// 前端实现示例
const logout = async () => {
  try {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken && refreshToken) {
      await fetch('/api/user/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    }
    
    // 清除本地存储的令牌
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    console.log('登出成功');
    // 跳转到登录页
    window.location.href = '/login';
  } catch (error) {
    console.error('登出失败:', error);
    // 即使登出失败，也清除本地令牌
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }
};
```

## 完整的认证服务类

```typescript
// 认证服务类
class AuthService {
  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
  
  // 邮箱注册
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '注册失败');
    }
    
    return await response.json();
  }
  
  // 邮箱登录
  async emailLogin(credentials: EmailLoginRequest): Promise<EmailLoginResponse> {
    const response = await fetch('/api/auth/email-login', {
  method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
        ...credentials,
    deviceInfo: navigator.userAgent
  })
});
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登录失败');
    }

const tokens = await response.json();
    this.saveTokens(tokens);
    return tokens;
  }
  
  // Telegram WebApp登录
  async telegramWebAppLogin(initData: string): Promise<TelegramWebAppLoginResponse> {
    const response = await fetch('/api/auth/telegram/webapp-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData,
        deviceInfo: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Telegram登录失败');
    }
    
    const tokens = await response.json();
    this.saveTokens(tokens);
    return tokens;
  }
  
  // 获取用户信息
  async getUserInfo(): Promise<UserInfo> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('未找到访问令牌');
    }
    
    const response = await fetch('/api/user/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取用户信息失败');
    }
    
    return await response.json();
  }
  
  // 登出
  async logout(): Promise<void> {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
        await fetch('/api/user/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  }
  
  // 保存令牌
  private saveTokens(tokens: { access_token: string; refresh_token: string }) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }
}

// 创建全局实例
const authService = new AuthService();

// 导出供其他模块使用
export default authService;
```

## 使用示例

### React组件示例

```typescript
import React, { useState } from 'react';
import authService from './authService';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.emailLogin({ email, password });
      // 登录成功，跳转到主页
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    if (window.Telegram?.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      if (initData) {
        try {
          await authService.telegramWebAppLogin(initData);
          window.location.href = '/dashboard';
        } catch (error) {
          setError(error.message);
        }
      }
    }
  };

  return (
    <div className="login-page">
      <h1>登录</h1>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '邮箱登录'}
        </button>
      </form>
      
      <button onClick={handleTelegramLogin}>
        Telegram登录
      </button>
    </div>
  );
};

export default LoginPage;
```

## 响应状态码说明

### ⚠️ 重要提醒：当前API响应格式

**当前认证接口的成功响应没有包含统一的状态码字段**，而是直接返回数据：

```typescript
// 当前成功响应格式（没有code字段）
interface CurrentSuccessResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  // 注意：没有 code 字段
}

// 当前注册成功响应格式（没有code字段）
interface CurrentRegisterResponse {
  id: number;
  shortId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  // 注意：没有 code 字段
}
```

### HTTP状态码

认证接口使用标准的HTTP状态码：

- **200**: 成功（注册、登录、刷新令牌等）
- **400**: 请求参数错误
- **401**: 认证失败（令牌无效或过期）
- **409**: 冲突（邮箱已存在、Telegram已绑定等）
- **429**: 请求频率限制
- **500**: 服务器内部错误

### 前端处理建议

```typescript
// 推荐的前端处理方式
const handleApiResponse = async (response: Response) => {
  if (response.ok) {
    // HTTP状态码200-299表示成功
    const data = await response.json();
    return { success: true, data };
  } else {
    // HTTP状态码400+表示错误
    const error = await response.json();
    return { success: false, error };
  }
};

// 使用示例
const login = async (credentials: EmailLoginRequest) => {
  try {
    const response = await fetch('/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const result = await handleApiResponse(response);
    
    if (result.success) {
      // 登录成功
      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      return result.data;
    } else {
      // 登录失败
      throw new Error(result.error.message || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};
```

### 错误处理策略

```typescript
const handleApiError = (response: Response, error: any) => {
  switch (response.status) {
    case 400:
      return '请求参数错误';
    case 401:
      // Token过期，跳转登录
      authService.logout();
      return '认证失败，请重新登录';
    case 409:
      return '数据冲突，请检查输入';
    case 429:
      return '请求过于频繁，请稍后再试';
    case 500:
      return '服务器内部错误';
    default:
      return error.message || '操作失败';
  }
};
```

## 安全建议

1. **令牌存储**: 使用localStorage存储令牌，生产环境可考虑使用httpOnly cookies
2. **HTTPS**: 生产环境必须使用HTTPS
3. **令牌过期**: 实现自动令牌刷新机制
4. **错误处理**: 妥善处理各种错误情况
5. **用户反馈**: 提供清晰的错误提示和加载状态

## 示例请求和响应

### 1. 邮箱注册示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123",
    "username": "testuser",
    "firstName": "张",
    "lastName": "三"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "id": 1234567890,
  "shortId": "Ab3Cd4Ef5G6",
  "email": "test@example.com",
  "username": "testuser",
  "firstName": "张",
  "lastName": "三",
  "isActive": true,
  "createdAt": "2025-01-22T10:30:00.000Z"
}
```

**错误响应（HTTP 400）：**
```json
{
  "statusCode": 400,
  "message": [
    "密码必须包含至少一个字母和一个数字"
  ],
  "error": "Bad Request"
}
```

### 2. 邮箱登录示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/auth/email-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "deviceInfo": "Chrome 120.0.0.0"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.example_signature",
  "refresh_token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**错误响应（HTTP 401）：**
```json
{
  "statusCode": 401,
  "message": "邮箱或密码错误",
  "error": "Unauthorized"
}
```

### 3. Telegram WebApp登录示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/auth/telegram/webapp-login \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "user=%7B%22id%22%3A6702079700%2C%22first_name%22%3A%22%E9%9A%8F%E9%A3%8E%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22seo99991%22%2C%22language_code%22%3A%22zh-hans%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FZmcCUiO3ad-NkMSzrdNaA7WhKJV3YpNH9JnfmJAiBx6RaeSGSqYqQaXHl0XLd8-I.svg%22%7D&chat_instance=1564885613800394904&chat_type=private&auth_date=1758522053&signature=k2yYzZhMkFpbYPvClPacYnY4cctf7UwS04pRchBqiKo49yx5QNRGFmLxzDXph5SLAs8Fw05Wm8lRF1cj_yq2BA&hash=0e0277f78d1168ea3ef1055a3f97c1bf5725e0a3e0f8bd0b19be91d4fb8e0fae",
    "deviceInfo": "Telegram WebApp"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.telegram_signature",
  "refresh_token": "def456ghi789jkl012mno345pqr678stu901vwx234yzabc123",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**错误响应（HTTP 401）：**
```json
{
  "statusCode": 401,
  "message": "Telegram数据验证失败",
  "error": "Unauthorized"
}
```

### 4. Telegram Bot登录示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/auth/telegram/bot-login \
  -H "Content-Type: application/json" \
  -d '{
    "id": 6702079700,
    "first_name": "随风",
    "username": "seo99991",
    "auth_date": 1754642628,
    "hash": "cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07",
    "deviceInfo": "Telegram Bot"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.bot_signature",
  "refresh_token": "ghi789jkl012mno345pqr678stu901vwx234yzabc123def456",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### 5. 获取用户信息示例

**请求：**
```bash
curl -X GET http://localhost:8080/api/user/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.example_signature"
```

**成功响应（HTTP 200）：**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "firstName": "张",
  "lastName": "三",
  "hasTelegram": true,
  "isActive": true,
  "createdAt": "2025-01-22T10:30:00.000Z"
}
```

**错误响应（HTTP 401）：**
```json
{
  "statusCode": 401,
  "message": "登录信息无效或已过期",
  "error": "Unauthorized"
}
```

### 6. 刷新令牌示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.example_signature" \
  -d '{
    "refresh_token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.new_signature",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**错误响应（HTTP 401）：**
```json
{
  "statusCode": 401,
  "message": "refresh token无效或已过期",
  "error": "Unauthorized"
}
```

### 7. 绑定Telegram示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/user/bind-telegram \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.example_signature" \
  -d '{
    "id": 6702079700,
    "first_name": "随风",
    "username": "seo99991",
    "auth_date": 1754642628,
    "hash": "cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "success": true,
  "message": "Telegram账号绑定成功，现在可以使用邮箱或Telegram登录",
  "user": {
    "id": 1234567890,
    "shortId": "Ab3Cd4Ef5G6",
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "张",
    "lastName": "三",
    "telegramId": 6702079700,
    "isActive": true
  }
}
```

**错误响应（HTTP 409）：**
```json
{
  "statusCode": 409,
  "message": "该Telegram账号已被其他用户绑定",
  "error": "Conflict"
}
```

### 8. 绑定邮箱示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/user/bind-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.example_signature" \
  -d '{
    "email": "newemail@example.com",
    "password": "NewPass123",
    "confirmPassword": "NewPass123"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "success": true,
  "message": "邮箱绑定成功，现在可以使用邮箱或Telegram登录",
  "user": {
    "id": 1234567890,
    "shortId": "Ab3Cd4Ef5G6",
    "email": "newemail@example.com",
    "username": "testuser",
    "firstName": "张",
    "lastName": "三",
    "telegramId": 6702079700,
    "isActive": true
  }
}
```

**错误响应（HTTP 400）：**
```json
{
  "statusCode": 400,
  "message": "密码和确认密码不匹配",
  "error": "Bad Request"
}
```

### 9. 用户登出示例

**请求：**
```bash
curl -X POST http://localhost:8080/api/user/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQ1Njc4OTAsImlhdCI6MTczNzU2NzAwMCwiZXhwIjoxNzM3NTcwNjAwfQ.example_signature" \
  -d '{
    "refresh_token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  }'
```

**成功响应（HTTP 200）：**
```json
{
  "message": "登出成功"
}
```

## 总结

本指导文档提供了完整的前端登录注册实现方案，包括：

- 邮箱注册和登录
- Telegram WebApp和Bot登录
- 账号绑定功能
- 令牌管理
- 错误处理
- 安全建议
- 详细的请求响应示例

开发者可以根据项目需求选择合适的认证方式，并参考提供的代码示例和请求响应示例进行实现。
