# 短剧API健壮性改进实施指南

## 概述

本指南详细说明如何在现有的短剧API项目中实施健壮性改进，包括错误处理、参数验证、安全防护、性能监控等方面的增强。

## 实施步骤

### 第一阶段：基础健壮性改进

#### 1. 全局异常处理

**文件**: `src/common/filters/global-exception.filter.ts`

**集成方式**:
```typescript
// 在 main.ts 中注册全局异常过滤器
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const app = await NestFactory.create(AppModule);
app.useGlobalFilters(new GlobalExceptionFilter());
```

**或者在模块中注册**:
```typescript
// 在 app.module.ts 中
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
```

#### 2. 增强的参数验证

**文件**: `src/common/dto/pagination.dto.ts`

**使用方式**:
```typescript
// 在控制器中使用增强的分页DTO
import { EnhancedPaginationDto } from '../common/dto/pagination.dto';

@Controller('api/list')
export class ListController {
  @Get('getfiltersdata')
  async getFiltersData(@Query() query: EnhancedPaginationDto) {
    // query.skip 和 query.take 可以直接使用
    return await this.service.findWithPagination(query.skip, query.take);
  }
}
```

#### 3. 自定义验证装饰器

**文件**: `src/common/validators/custom-validators.ts`

**使用示例**:
```typescript
import { IsValidChannelId, IsValidMediaType } from '../common/validators/custom-validators';

export class HomeVideosDto {
  @IsValidChannelId()
  @IsOptional()
  channeid?: string = '1';
}

export class MediaQueryDto {
  @IsValidMediaType()
  @IsOptional()
  type?: 'short' | 'series';
}
```

### 第二阶段：安全性增强

#### 4. 请求限流

**文件**: `src/common/guards/rate-limit.guard.ts`

**使用方式**:
```typescript
// 在控制器或方法上使用限流装饰器
import { RateLimit, RateLimitConfigs } from '../common/guards/rate-limit.guard';

@Controller('auth')
@RateLimit(RateLimitConfigs.LOGIN) // 登录接口严格限流
export class AuthController {
  @Post('telegram-login')
  async telegramLogin(@Body() loginDto: TelegramUserDto) {
    // 登录逻辑
  }
}

@Controller('api/video')
export class VideoController {
  @Post('comment')
  @RateLimit(RateLimitConfigs.COMMENT) // 评论接口限流
  async addComment(@Body() commentDto: AddCommentDto) {
    // 评论逻辑
  }
}
```

**全局启用**:
```typescript
// 在 main.ts 中
import { RateLimitGuard } from './common/guards/rate-limit.guard';

const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new RateLimitGuard(new Reflector()));
```

#### 5. 日志和监控

**文件**: `src/common/middleware/logger.middleware.ts`

**集成方式**:
```typescript
// 在 app.module.ts 中配置中间件
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerMiddleware, PerformanceMiddleware, SecurityLoggerMiddleware } from './common/middleware/logger.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SecurityLoggerMiddleware,  // 安全日志
        LoggerMiddleware,          // 请求日志
        PerformanceMiddleware,     // 性能监控
      )
      .forRoutes('*');
  }
}
```

### 第三阶段：响应格式标准化

#### 6. 统一响应格式

**文件**: `src/common/dto/response.dto.ts`

**使用示例**:
```typescript
import { ResponseWrapper } from '../common/dto/response.dto';

@Controller('api/home')
export class HomeController {
  @Get('getvideos')
  async getVideos(@Query() query: HomeVideosDto) {
    const data = await this.videoService.getHomeVideos(query);
    
    // 使用统一响应格式
    return ResponseWrapper.success(data, '获取成功');
  }
  
  @Get('list')
  async getVideoList(@Query() query: EnhancedPaginationDto) {
    const { data, total } = await this.videoService.findWithPagination(
      query.skip,
      query.take
    );
    
    // 使用分页响应格式
    return ResponseWrapper.paginated(data, total, query.page, query.size);
  }
}
```

### 第四阶段：健康检查和监控

#### 7. 健康检查模块

**文件**: `src/health/health.module.ts`

**集成方式**:
```typescript
// 在 app.module.ts 中导入健康检查模块
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ... 其他模块
    HealthModule,
  ],
})
export class AppModule {}
```

**访问健康检查接口**:
- `GET /health` - 基础健康检查
- `GET /health/detailed` - 详细健康信息
- `GET /health/system` - 系统信息

### 第五阶段：完整集成

#### 8. 使用增强模块

**文件**: `src/app-enhanced.module.ts`

**替换现有的app.module.ts**:
```typescript
// 在 main.ts 中使用增强模块
import { AppEnhancedModule } from './app-enhanced.module';

async function bootstrap() {
  const app = await NestFactory.create(AppEnhancedModule);
  
  // 其他配置...
  
  await app.listen(3000);
}
bootstrap();
```

## 具体改进示例

### 改进前的控制器

```typescript
@Controller('api/home')
export class HomeController {
  @Get('getvideos')
  async getVideos(@Query() query: any) {
    try {
      const data = await this.videoService.getHomeVideos(query);
      return { data, code: 200, msg: null };
    } catch (error) {
      return { data: null, code: 500, msg: error.message };
    }
  }
}
```

### 改进后的控制器

```typescript
import { RateLimit, RateLimitConfigs } from '../common/guards/rate-limit.guard';
import { ResponseWrapper } from '../common/dto/response.dto';
import { IsValidChannelId } from '../common/validators/custom-validators';

class HomeVideosDto {
  @IsValidChannelId()
  @IsOptional()
  channeid?: string = '1';
  
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小值为1' })
  page?: number = 1;
}

@Controller('api/home')
@RateLimit(RateLimitConfigs.NORMAL) // 普通限流
export class HomeController {
  @Get('getvideos')
  async getVideos(@Query() query: HomeVideosDto) {
    // 不需要try-catch，全局异常过滤器会处理
    const data = await this.videoService.getHomeVideos(query);
    return ResponseWrapper.success(data, '获取成功');
  }
}
```

## 环境配置

### 开发环境配置

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 生产环境配置

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 测试建议

### 1. 单元测试

```typescript
// 测试自定义验证器
describe('Custom Validators', () => {
  it('should validate channel ID correctly', () => {
    const validator = new IsValidChannelIdConstraint();
    expect(validator.validate('1')).toBe(true);
    expect(validator.validate('0')).toBe(false);
    expect(validator.validate('abc')).toBe(false);
  });
});
```

### 2. 集成测试

```typescript
// 测试限流功能
describe('Rate Limiting', () => {
  it('should block requests after limit exceeded', async () => {
    // 发送100次请求
    for (let i = 0; i < 100; i++) {
      await request(app.getHttpServer())
        .get('/api/home/getvideos')
        .expect(200);
    }
    
    // 第101次请求应该被限流
    await request(app.getHttpServer())
      .get('/api/home/getvideos')
      .expect(429);
  });
});
```

### 3. 性能测试

```bash
# 使用 artillery 进行负载测试
npm install -g artillery

# 创建测试配置文件 load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/home/getvideos"
      - get:
          url: "/health"

# 运行测试
artillery run load-test.yml
```

## 监控和告警

### 1. 日志监控

```typescript
// 配置日志级别和输出
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      }),
    ],
  }),
});
```

### 2. 性能监控

```typescript
// 集成 Prometheus 监控
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class AppModule {}
```

## 部署建议

### 1. Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### 2. Nginx配置

```nginx
# nginx.conf
upstream api_backend {
    server app:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 健康检查端点
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

## 总结

通过实施以上改进，您的短剧API将具备：

1. **更好的错误处理**: 统一的异常处理和友好的错误响应
2. **更严格的参数验证**: 自定义验证规则和详细的错误信息
3. **更强的安全防护**: 请求限流、安全日志和可疑活动检测
4. **更完善的监控**: 性能监控、健康检查和详细的日志记录
5. **更标准的响应格式**: 统一的API响应结构和分页格式

建议按阶段逐步实施，每个阶段完成后进行充分测试，确保系统稳定性。