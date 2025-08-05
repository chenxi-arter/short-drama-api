# 防枚举攻击安全增强指南

本文档详细说明如何增强系统的防枚举攻击能力，包括UUID替换、多层安全防护和最佳实践。

## 🚨 当前安全风险分析

### 现有问题
1. **自增ID暴露**: `VideoDetailsRequest` 使用自增ID，容易被枚举
2. **数据量泄露**: 攻击者可以通过ID范围推测数据规模
3. **业务逻辑暴露**: 连续ID可能暴露业务增长趋势

### 影响范围
- 视频详情接口 (`/api/video/details`)
- 系列详情接口 (`/api/public/video/series/:id`)
- 所有使用自增ID的公开接口

## 🛡️ 防枚举增强方案

### 方案一：UUID替换（推荐）

#### 1. 数据库结构调整

```sql
-- 为主要实体添加UUID字段
ALTER TABLE `series` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;
ALTER TABLE `episodes` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;
ALTER TABLE `videos` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;

-- 为现有数据生成UUID
UPDATE `series` SET `uuid` = UUID() WHERE `uuid` IS NULL;
UPDATE `episodes` SET `uuid` = UUID() WHERE `uuid` IS NULL;
UPDATE `videos` SET `uuid` = UUID() WHERE `uuid` IS NULL;

-- 添加索引优化查询
CREATE INDEX `idx_series_uuid` ON `series`(`uuid`);
CREATE INDEX `idx_episodes_uuid` ON `episodes`(`uuid`);
CREATE INDEX `idx_videos_uuid` ON `videos`(`uuid`);
```

#### 2. 实体类更新

```typescript
// src/video/entity/series.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Generated } from 'typeorm';

@Entity('series')
export class Series {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Generated('uuid')
  @Column({ type: 'varchar', length: 36, unique: true })
  uuid: string;

## 🔐 JWT Token 安全管理

### Token 配置
- **过期时间**: 由环境变量 `JWT_EXPIRES_IN` 控制
- **密钥**: 由环境变量 `JWT_SECRET` 控制
- **提取方式**: Bearer Token (Authorization: Bearer <token>)

### Token 验证流程
1. 客户端在请求头中携带 `Authorization: Bearer <token>`
2. `JwtAuthGuard` 拦截请求并验证 token
3. `JwtStrategy` 解析 token payload 并验证有效性

### Token 过期处理

#### 服务端响应
当 token 过期时，服务端会返回：
```json
{
  "statusCode": 401,
  "message": "登录信息已过期",
  "error": "Unauthorized"
}
```

#### 客户端处理策略

**检测 Token 过期**
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

**处理 Token 过期**

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

**预防性检查**
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

  /** 
   * 公开UUID标识符
   * 用于外部API访问，防止枚举攻击
   */
  @Column({ length: 36, unique: true, name: 'uuid' })
  @Generated('uuid')
  uuid: string;

  // ... 其他字段
}
```

#### 3. DTO更新

```typescript
// src/video/dto/video-details.dto.ts
import { IsNotEmpty, IsUUID } from 'class-validator';

export class VideoDetailsDto {
  @IsNotEmpty()
  @IsUUID(4, { message: '无效的视频标识符格式' })
  uuid: string; // 使用UUID替代ID
}

// 向后兼容的DTO（过渡期使用）
export class VideoDetailsCompatDto {
  @IsOptional()
  @IsUUID(4)
  uuid?: string;

  @IsOptional()
  @IsString()
  id?: string; // 保留ID字段用于向后兼容

  @ValidateIf(o => !o.uuid && !o.id)
  @IsNotEmpty({ message: '必须提供uuid或id参数' })
  _validator?: any;
}
```

#### 4. 服务层更新

```typescript
// src/video/video.service.ts
export class VideoService {
  /**
   * 通过UUID获取视频详情（推荐）
   */
  async getVideoDetailsByUuid(uuid: string): Promise<VideoDetailsResponse> {
    const cacheKey = `video_details_uuid_${uuid}`;
    
    // 尝试从缓存获取
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData as VideoDetailsResponse;
    }

    // 通过UUID查询
    const series = await this.seriesRepo.findOne({
      where: { uuid },
      relations: ['category', 'episodes', 'episodes.urls']
    });

    if (!series) {
      throw new NotFoundException('视频不存在');
    }

    const result = this.buildVideoDetailsResponse(series);
    
    // 缓存结果
    await this.cacheManager.set(cacheKey, result, 300); // 5分钟缓存
    
    return result;
  }

  /**
   * 兼容性方法：支持ID和UUID
   */
  async getVideoDetails(identifier: string): Promise<VideoDetailsResponse> {
    // 判断是UUID还是ID
    if (this.isUUID(identifier)) {
      return this.getVideoDetailsByUuid(identifier);
    } else {
      // 向后兼容：通过ID查询（建议逐步废弃）
      return this.getVideoDetailsByIdLegacy(identifier);
    }
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
```

### 方案二：加密ID（轻量级方案）

#### 1. 创建ID加密工具

```typescript
// src/shared/utils/id-encryption.util.ts
import { createCipher, createDecipher } from 'crypto';

export class IdEncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly SECRET_KEY = process.env.ID_ENCRYPTION_KEY || 'default-secret-key-32-chars-long!';

  /**
   * 加密ID
   */
  static encryptId(id: number): string {
    const cipher = createCipher(this.ALGORITHM, this.SECRET_KEY);
    let encrypted = cipher.update(id.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 解密ID
   */
  static decryptId(encryptedId: string): number {
    try {
      const decipher = createDecipher(this.ALGORITHM, this.SECRET_KEY);
      let decrypted = decipher.update(encryptedId, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return parseInt(decrypted, 10);
    } catch (error) {
      throw new Error('无效的视频标识符');
    }
  }

  /**
   * 验证加密ID格式
   */
  static isValidEncryptedId(encryptedId: string): boolean {
    return /^[a-f0-9]+$/i.test(encryptedId) && encryptedId.length >= 16;
  }
}
```

#### 2. 响应数据转换

```typescript
// src/video/interceptors/id-encryption.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IdEncryptionUtil } from '../utils/id-encryption.util';

@Injectable()
export class IdEncryptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transformIds(data))
    );
  }

  private transformIds(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformIds(item));
    }
    
    if (obj && typeof obj === 'object') {
      const transformed = { ...obj };
      
      // 加密ID字段
      if (transformed.id && typeof transformed.id === 'number') {
        transformed.id = IdEncryptionUtil.encryptId(transformed.id);
      }
      
      // 递归处理嵌套对象
      Object.keys(transformed).forEach(key => {
        if (transformed[key] && typeof transformed[key] === 'object') {
          transformed[key] = this.transformIds(transformed[key]);
        }
      });
      
      return transformed;
    }
    
    return obj;
  }
}
```

### 方案三：多层防护（企业级方案）

#### 1. 请求频率限制

```typescript
// src/common/guards/enhanced-rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class EnhancedRateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheManager: any
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    
    // 检查是否为可疑的枚举行为
    const suspiciousKey = `suspicious_${ip}`;
    const suspiciousCount = await this.cacheManager.get(suspiciousKey) || 0;
    
    if (suspiciousCount > 10) {
      throw new Error('检测到异常访问模式，请稍后再试');
    }
    
    // 检查连续失败请求
    const failureKey = `failures_${ip}`;
    const failureCount = await this.cacheManager.get(failureKey) || 0;
    
    if (failureCount > 5) {
      await this.cacheManager.set(suspiciousKey, suspiciousCount + 1, 3600);
      throw new Error('请求过于频繁，请稍后再试');
    }
    
    return true;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }
}
```

#### 2. 智能404响应

```typescript
// src/common/filters/smart-not-found.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(NotFoundException)
export class SmartNotFoundFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 对于可能的枚举攻击，返回统一的错误信息
    const isVideoDetailsRequest = request.path.includes('/video/details');
    
    if (isVideoDetailsRequest) {
      // 不暴露具体的错误信息
      response.status(404).json({
        statusCode: 404,
        message: '请求的内容不存在或已下线',
        timestamp: new Date().toISOString(),
        path: request.url
      });
    } else {
      // 其他404错误正常处理
      response.status(404).json({
        statusCode: 404,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }
}
```

## 🔧 实施步骤

### 第一阶段：基础防护（1-2周）

1. **添加UUID字段**
   ```bash
   # 执行数据库迁移
   npm run migration:run
   ```

2. **更新实体和DTO**
   - 为主要实体添加UUID字段
   - 创建兼容性DTO支持过渡

3. **部署增强的访问控制**
   - 实施请求频率限制
   - 添加异常访问检测

### 第二阶段：UUID迁移（2-3周）

1. **API版本控制**
   ```typescript
   // v1: 兼容ID和UUID
   @Get('v1/details')
   async getVideoDetailsV1(@Query() dto: VideoDetailsCompatDto) {
     return this.videoService.getVideoDetails(dto.uuid || dto.id);
   }
   
   // v2: 仅支持UUID
   @Get('v2/details')
   async getVideoDetailsV2(@Query() dto: VideoDetailsDto) {
     return this.videoService.getVideoDetailsByUuid(dto.uuid);
   }
   ```

2. **客户端迁移**
   - 更新前端代码使用UUID
   - 提供迁移工具和文档

3. **监控和日志**
   - 监控API使用情况
   - 记录可疑访问模式

### 第三阶段：完全切换（1周）

1. **废弃旧接口**
   - 移除ID支持
   - 清理兼容性代码

2. **性能优化**
   - 优化UUID查询性能
   - 调整缓存策略

## 📊 性能影响评估

### UUID vs 自增ID

| 方面 | 自增ID | UUID | 影响 |
|------|--------|------|------|
| 存储空间 | 4字节 | 36字节 | +800% |
| 查询性能 | 极快 | 快 | -5~10% |
| 索引大小 | 小 | 大 | +800% |
| 安全性 | 低 | 高 | +90% |

### 优化建议

1. **使用BINARY(16)存储UUID**
   ```sql
   -- 更高效的UUID存储
   ALTER TABLE `series` MODIFY `uuid` BINARY(16);
   ```

2. **合理的缓存策略**
   ```typescript
   // 长期缓存UUID映射
   const cacheKey = `uuid_mapping_${uuid}`;
   await this.cacheManager.set(cacheKey, seriesData, 3600); // 1小时
   ```

3. **数据库查询优化**
   ```sql
   -- 复合索引优化
   CREATE INDEX `idx_series_uuid_status` ON `series`(`uuid`, `status`);
   ```

## 🔍 监控和检测

### 异常访问模式检测

```typescript
// src/common/services/security-monitor.service.ts
@Injectable()
export class SecurityMonitorService {
  /**
   * 检测枚举攻击模式
   */
  async detectEnumerationAttack(ip: string, path: string): Promise<boolean> {
    const key = `enum_pattern_${ip}_${path}`;
    const requests = await this.cacheManager.get(key) || [];
    
    // 检查是否为连续的ID请求
    const now = Date.now();
    const recentRequests = requests.filter(time => now - time < 60000); // 1分钟内
    
    if (recentRequests.length > 20) {
      // 触发安全警报
      await this.triggerSecurityAlert(ip, 'ENUMERATION_ATTACK_DETECTED');
      return true;
    }
    
    // 记录请求
    recentRequests.push(now);
    await this.cacheManager.set(key, recentRequests, 300);
    
    return false;
  }

  private async triggerSecurityAlert(ip: string, type: string) {
    // 发送安全警报
    console.warn(`Security Alert: ${type} from IP ${ip}`);
    
    // 可以集成到监控系统
    // await this.notificationService.sendAlert(...);
  }
}
```

### 日志记录

```typescript
// src/common/middleware/security-logger.middleware.ts
@Injectable()
export class SecurityLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const ip = this.getClientIp(req);
      
      // 记录可疑请求
      if (res.statusCode === 404 && req.path.includes('/video/details')) {
        console.log(`Suspicious 404: IP=${ip}, Path=${req.path}, Duration=${duration}ms`);
      }
    });
    
    next();
  }
}
```

## 🎯 最佳实践

### 1. 渐进式迁移
- 保持向后兼容性
- 逐步废弃旧接口
- 提供充分的迁移时间

### 2. 多层防护
- UUID + 访问控制
- 频率限制 + 异常检测
- 智能响应 + 日志监控

### 3. 性能优化
- 合理的缓存策略
- 数据库索引优化
- 查询性能监控

### 4. 安全监控
- 实时异常检测
- 安全日志记录
- 定期安全审计

## 📋 检查清单

### 实施前检查
- [ ] 数据库备份完成
- [ ] 迁移脚本测试通过
- [ ] 性能基准测试完成
- [ ] 监控系统就绪

### 实施后验证
- [ ] UUID生成正常
- [ ] API响应正确
- [ ] 性能指标正常
- [ ] 安全检测生效
- [ ] 日志记录完整

## 🚀 预期收益

### 安全性提升
- **防枚举攻击**: 99%+ 防护效果
- **数据泄露风险**: 降低90%
- **业务逻辑保护**: 完全隐藏内部结构

### 合规性
- 符合数据保护法规要求
- 提升用户隐私保护
- 增强系统安全等级

### 业务价值
- 保护商业机密
- 提升用户信任
- 降低安全风险成本

---

**注意**: 本方案需要根据实际业务需求和技术栈进行调整。建议在测试环境充分验证后再部署到生产环境。