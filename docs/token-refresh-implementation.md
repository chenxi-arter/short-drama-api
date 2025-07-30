# Token 刷新机制实现指南

## 当前状态

目前系统使用简单的 JWT 认证，**不支持 token 刷新**。当 token 过期时，用户必须重新登录。

## 实现 Refresh Token 机制

如果您希望改善用户体验，可以按以下步骤实现 refresh token 机制：

### 1. 数据库扩展

首先需要创建 refresh token 存储表：

```sql
-- 创建 refresh_tokens 表
CREATE TABLE refresh_tokens (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_revoked TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);
```

### 2. 创建 Refresh Token 实体

```typescript
// src/auth/entity/refresh-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

### 3. 扩展认证服务

```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { User } from '../user/entity/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async generateTokens(user: User) {
    // 生成 access token (短期)
    const accessToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h', // 1小时
      }
    );

    // 生成 refresh token (长期)
    const refreshTokenValue = randomBytes(32).toString('hex');
    const refreshToken = this.refreshTokenRepo.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
    });
    await this.refreshTokenRepo.save(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      expires_in: 3600, // 1小时（秒）
    };
  }

  async refreshAccessToken(refreshTokenValue: string) {
    // 查找 refresh token
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { token: refreshTokenValue, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('无效的 refresh token');
    }

    // 检查是否过期
    if (refreshToken.expiresAt < new Date()) {
      await this.refreshTokenRepo.update(refreshToken.id, { isRevoked: true });
      throw new UnauthorizedException('Refresh token 已过期');
    }

    // 生成新的 access token
    const accessToken = this.jwtService.sign(
      { sub: refreshToken.userId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      }
    );

    return {
      access_token: accessToken,
      expires_in: 3600,
    };
  }

  async revokeRefreshToken(refreshTokenValue: string) {
    await this.refreshTokenRepo.update(
      { token: refreshTokenValue },
      { isRevoked: true }
    );
  }

  async revokeAllUserTokens(userId: number) {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }
}
```

### 4. 添加认证控制器

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body('refresh_token') refreshToken: string) {
    await this.authService.revokeRefreshToken(refreshToken);
    return { message: '登出成功' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req) {
    await this.authService.revokeAllUserTokens(req.user.userId);
    return { message: '已登出所有设备' };
  }
}
```

### 5. 修改用户登录服务

```typescript
// 修改 src/user/user.service.ts 中的 telegramLogin 方法
async telegramLogin(dto: TelegramUserDto) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('缺少 TELEGRAM_BOT_TOKEN，请检查 .env');
  }
  
  // 1. 验证 Telegram Hash
  const isValid = verifyTelegramHash(botToken, dto);
  if (!isValid) throw new UnauthorizedException('非法登录');

  // 2. 查询或创建用户
  let user = await this.userRepo.findOneBy({ id: dto.id });
  if (!user) {
    user = this.userRepo.create({
      id: dto.id,
      first_name: dto.first_name,
      last_name: dto.last_name || '',
      username: dto.username || '',
    });
    await this.userRepo.save(user);
  }

  // 3. 生成 tokens（使用新的 AuthService）
  return this.authService.generateTokens(user);
}
```

### 6. 客户端实现

```javascript
// 客户端 token 管理
class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // 请求拦截器：添加 token
    axios.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // 响应拦截器：处理 token 过期
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // 尝试刷新 token
            await this.refreshAccessToken();
            
            // 重新发送原始请求
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
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

  async refreshAccessToken() {
    const response = await axios.post('/api/auth/refresh', {
      refresh_token: this.refreshToken
    });
    
    this.accessToken = response.data.access_token;
    localStorage.setItem('access_token', this.accessToken);
  }

  setTokens(accessToken, refreshToken) {
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
}

// 使用示例
const tokenManager = new TokenManager();

// 登录后设置 tokens
function handleLoginSuccess(response) {
  tokenManager.setTokens(
    response.data.access_token,
    response.data.refresh_token
  );
}
```

## 安全考虑

1. **Refresh Token 轮换**：每次刷新时生成新的 refresh token
2. **设备绑定**：将 refresh token 与设备信息绑定
3. **异常检测**：监控异常的 token 使用模式
4. **定期清理**：清理过期的 refresh token

## 总结

实现 refresh token 机制可以显著改善用户体验，但也增加了系统复杂性。根据您的业务需求选择合适的方案：

- **简单场景**：保持当前的重新登录机制
- **用户体验优先**：实现完整的 refresh token 机制
- **中间方案**：延长 access token 有效期（如 24 小时）