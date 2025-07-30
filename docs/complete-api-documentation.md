# 短剧API完整接口文档

## 概述

本文档包含短剧API项目的所有接口定义、参数说明、响应格式和健壮性改进建议。

### 基础信息

- **基础URL**: `http://localhost:3000`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

```typescript
interface ApiResponse<T> {
  code: number;        // 状态码：200成功，400客户端错误，500服务器错误
  data?: T;           // 响应数据
  message?: string;   // 响应消息
  timestamp?: string; // 响应时间戳
  path?: string;      // 请求路径
}
```

### 通用错误响应

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

---

## 1. 认证模块 (Auth)

### 1.1 刷新访问令牌

**接口信息**
- **路径**: `POST /auth/refresh`
- **描述**: 使用refresh_token获取新的access_token
- **认证**: 无需认证

**请求参数**
```typescript
interface RefreshTokenRequest {
  refresh_token: string; // 必填，刷新令牌
}
```

**响应示例**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**错误响应**
- `400`: refresh_token无效或已过期
- `401`: refresh_token格式错误

### 1.2 验证刷新令牌

**接口信息**
- **路径**: `POST /auth/verify-refresh-token`
- **描述**: 验证refresh_token是否有效
- **认证**: 无需认证

**请求参数**
```typescript
interface VerifyTokenRequest {
  refresh_token: string; // 必填，刷新令牌
}
```

**响应示例**
```json
{
  "valid": true,
  "message": "Refresh token 有效"
}
```

### 1.3 获取活跃设备列表

**接口信息**
- **路径**: `GET /auth/devices`
- **描述**: 获取用户的活跃设备列表
- **认证**: 需要Bearer Token

**响应示例**
```json
{
  "devices": [
    {
      "id": 1,
      "deviceInfo": "Chrome/Windows",
      "ipAddress": "192.168.1.100",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 1.4 撤销设备令牌

**接口信息**
- **路径**: `DELETE /auth/devices/:deviceId`
- **描述**: 撤销指定设备的refresh_token
- **认证**: 需要Bearer Token

**路径参数**
- `deviceId`: 设备ID (number)

**响应示例**
```json
{
  "message": "设备令牌已撤销"
}
```

---

## 2. 用户模块 (User)

### 2.1 Telegram登录

**接口信息**
- **路径**: `POST /user/telegram-login` 或 `GET /user/telegram-login`
- **描述**: 通过Telegram OAuth进行用户登录
- **认证**: 无需认证

**请求参数**
```typescript
interface TelegramLoginRequest {
  id: number;           // 必填，Telegram用户ID
  first_name: string;   // 必填，用户名字
  last_name?: string;   // 可选，用户姓氏
  username?: string;    // 可选，用户名
  auth_date: number;    // 必填，认证时间戳
  hash: string;         // 必填，Telegram验证哈希
  photo_url?: string;   // 可选，头像URL
}
```

**响应示例**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_string",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": 123456789,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2.2 获取用户信息

**接口信息**
- **路径**: `GET /user/me`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要Bearer Token

**响应示例**
```json
{
  "id": 123456789,
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 3. 首页模块 (Home)

### 3.1 获取首页视频列表

**接口信息**
- **路径**: `GET /api/home/getvideos`
- **描述**: 获取首页推荐内容，包括轮播图、过滤器、视频列表
- **认证**: 无需认证

**请求参数**
```typescript
interface HomeVideosRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
  page?: number;      // 可选，页码，默认为1，最小值1
}
```

**响应示例**
```json
{
  "data": {
    "list": [
      {
        "type": 0,
        "name": "轮播图",
        "banners": [
          {
            "showURL": "https://example.com/banner1.jpg",
            "title": "热门剧集",
            "id": 1,
            "channeID": 1,
            "url": "1"
          }
        ]
      },
      {
        "type": 1001,
        "name": "搜索过滤器",
        "filters": [
          {
            "channeID": 1,
            "name": "短剧",
            "title": "全部",
            "ids": "0,0,0,0,0"
          }
        ]
      },
      {
        "type": 3,
        "name": "推荐视频",
        "list": [
          {
            "id": 1,
            "coverUrl": "https://example.com/cover1.jpg",
            "title": "精彩剧集",
            "score": "8.5",
            "playCount": 12345,
            "url": "1",
            "type": "剧情",
            "isSerial": true,
            "upStatus": "更新到10集",
            "upCount": 2
          }
        ]
      }
    ]
  },
  "code": 200,
  "msg": null
}
```

---

## 4. 列表模块 (List)

### 4.1 获取筛选器标签

**接口信息**
- **路径**: `GET /api/list/getfilterstags`
- **描述**: 获取视频筛选器的标签分组
- **认证**: 无需认证

**请求参数**
```typescript
interface FilterTagsRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
}
```

**响应示例**
```json
{
  "list": [
    {
      "name": "排序标签",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "最新上传",
          "isDefaultSelect": true
        },
        {
          "index": 0,
          "classifyId": 1,
          "classifyName": "最近更新",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "分类标签",
      "list": [
        {
          "index": 1,
          "classifyId": 0,
          "classifyName": "全部类型",
          "isDefaultSelect": true
        }
      ]
    }
  ]
}
```

### 4.2 获取筛选器数据

**接口信息**
- **路径**: `GET /api/list/getfiltersdata`
- **描述**: 根据筛选条件获取视频列表
- **认证**: 无需认证

**请求参数**
```typescript
interface FilterDataRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
  ids?: string;       // 可选，筛选ID组合，默认为"0,0,0,0,0"
  page?: string;      // 可选，页码，默认为"1"
}
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 828839,
        "coverUrl": "https://example.com/cover.jpg",
        "title": "狂飙",
        "playCount": 23959613,
        "upStatus": "39集全",
        "upCount": 0,
        "score": "8.8",
        "isSerial": false,
        "cidMapper": "警匪·罪案·剧情",
        "isRecommend": true
      }
    ]
  },
  "msg": null
}
```

---

## 5. 视频模块 (Video)

### 5.1 保存观看进度

**接口信息**
- **路径**: `POST /api/video/progress`
- **描述**: 记录或更新用户的观看进度
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface SaveProgressRequest {
  episodeId: number;     // 必填，剧集ID
  stopAtSecond: number;  // 必填，停止观看的秒数
}
```

**响应示例**
```json
{
  "message": "观看进度已保存",
  "progress": {
    "episodeId": 1,
    "stopAtSecond": 1200,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 5.2 获取观看进度

**接口信息**
- **路径**: `GET /api/video/progress`
- **描述**: 获取用户在指定剧集的观看进度
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface GetProgressRequest {
  episodeId: number;  // 必填，剧集ID
}
```

**响应示例**
```json
{
  "episodeId": 1,
  "stopAtSecond": 1200,
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 5.3 发表评论

**接口信息**
- **路径**: `POST /api/video/comment`
- **描述**: 为指定剧集发表评论或弹幕
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface AddCommentRequest {
  episodeId: number;      // 必填，剧集ID
  content: string;        // 必填，评论内容
  appearSecond?: number;  // 可选，弹幕出现时间（秒）
}
```

**响应示例**
```json
{
  "message": "评论发表成功",
  "comment": {
    "id": 123,
    "content": "这部剧太精彩了！",
    "episodeId": 1,
    "appearSecond": 300,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 5.4 获取视频详情

**接口信息**
- **路径**: `GET /api/video/details`
- **描述**: 获取视频的详细信息，包括剧集列表、演员信息等
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface VideoDetailsRequest {
  id: string;  // 必填，视频ID
}
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "detailInfo": {
      "id": 1,
      "title": "精彩剧集",
      "coverUrl": "https://example.com/cover.jpg",
      "description": "这是一部精彩的剧集",
      "starring": "张三,李四",
      "director": "王五",
      "score": "8.5",
      "playCount": 12345,
      "serialCount": 24,
      "updateStatus": "更新到第10集",
      "episodes": [
        {
          "episodeId": 1,
          "title": "第1集",
          "episodeTitle": "初遇",
          "duration": 2400,
          "isVip": false
        }
      ]
    },
    "like": {
      "count": 1234,
      "selected": false
    },
    "favorites": {
      "count": 567,
      "selected": true
    }
  },
  "msg": "success"
}
```

### 5.5 获取用户媒体列表

**接口信息**
- **路径**: `GET /api/video/media`
- **描述**: 获取用户相关的媒体内容列表
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface MediaQueryRequest {
  categoryId?: number;              // 可选，分类ID
  type?: 'short' | 'series';       // 可选，媒体类型
  sort?: 'latest' | 'like' | 'play'; // 可选，排序方式，默认latest
  page?: number;                    // 可选，页码，默认1
  size?: number;                    // 可选，每页数量，默认20，最大50
}
```

---

## 6. 公共视频模块 (Public Video)

### 6.1 获取分类列表

**接口信息**
- **路径**: `GET /api/public/video/categories`
- **描述**: 获取所有视频分类
- **认证**: 无需认证

**响应示例**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "短剧",
      "description": "精彩短剧内容",
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "电影",
      "description": "热门电影推荐",
      "sortOrder": 2
    }
  ]
}
```

### 6.2 获取系列列表

**接口信息**
- **路径**: `GET /api/public/video/series/list`
- **描述**: 获取系列剧集的完整列表
- **认证**: 无需认证

**请求参数**
```typescript
interface SeriesListRequest {
  categoryId?: number;  // 可选，分类ID
  page?: number;        // 可选，页码，默认1
  size?: number;        // 可选，每页数量，默认20
}
```

### 6.3 获取系列详情

**接口信息**
- **路径**: `GET /api/public/video/series/:id`
- **描述**: 获取指定系列的详细信息
- **认证**: 无需认证

**路径参数**
- `id`: 系列ID (number)

### 6.4 获取媒体列表

**接口信息**
- **路径**: `GET /api/public/video/media`
- **描述**: 获取公共媒体内容列表
- **认证**: 无需认证

**请求参数**
```typescript
interface PublicMediaRequest {
  categoryId?: number;              // 可选，分类ID
  type?: 'short' | 'series';       // 可选，媒体类型
  sort?: 'latest' | 'like' | 'play'; // 可选，排序方式
  page?: number;                    // 可选，页码
  size?: number;                    // 可选，每页数量
}
```

---

## 7. 测试模块 (Test)

### 7.1 测试用户信息

**接口信息**
- **路径**: `GET /test/me`
- **描述**: 测试JWT认证并获取用户信息
- **认证**: 需要Bearer Token

**响应示例**
```json
{
  "message": "登录有效",
  "user": {
    "id": 123456789,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 健壮性改进建议

### 1. 统一错误处理

**当前问题**:
- 错误响应格式不统一
- 缺少详细的错误码定义
- 错误信息不够友好

**改进建议**:
```typescript
// 创建全局异常过滤器
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : 500;
      
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(exception),
      error: this.getErrorType(status)
    };
    
    response.status(status).json(errorResponse);
  }
}
```

### 2. 请求参数验证增强

**当前问题**:
- 部分接口缺少完整的参数验证
- 数值范围验证不够严格
- 缺少自定义验证规则

**改进建议**:
```typescript
// 增强的分页DTO
export class EnhancedPaginationDto {
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小值为1' })
  @Max(1000, { message: '页码最大值为1000' })
  page = 1;

  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小值为1' })
  @Max(100, { message: '每页数量最大值为100' })
  size = 20;
}

// 自定义验证装饰器
export function IsValidChannelId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidChannelId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^[1-9]\d*$/.test(value);
        },
        defaultMessage() {
          return '频道ID格式无效';
        }
      }
    });
  };
}
```

### 3. 响应格式标准化

**当前问题**:
- 不同接口的响应格式不一致
- 缺少统一的响应包装器
- 分页信息格式不统一

**改进建议**:
```typescript
// 统一响应包装器
export class ResponseWrapper {
  static success<T>(data: T, message = 'success'): ApiResponse<T> {
    return {
      code: 200,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }
  
  static paginated<T>(
    data: T[], 
    total: number, 
    page: number, 
    size: number
  ): PaginatedResponse<T> {
    return {
      code: 200,
      data,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
        hasNext: page * size < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

### 4. 安全性增强

**当前问题**:
- 缺少请求频率限制
- 没有IP白名单机制
- 敏感信息可能泄露

**改进建议**:
```typescript
// 请求限流装饰器
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: Redis) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const key = `rate_limit:${ip}`;
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // 1分钟窗口
    }
    
    if (current > 100) { // 每分钟最多100次请求
      throw new HttpException('请求过于频繁', 429);
    }
    
    return true;
  }
}

// 敏感信息过滤
export class SensitiveDataFilter {
  static filterUserData(user: any) {
    const { password, refreshTokens, ...safeData } = user;
    return safeData;
  }
}
```

### 5. 日志和监控

**改进建议**:
```typescript
// 请求日志中间件
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    
    const start = Date.now();
    
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip} ${userAgent}`
      );
    });
    
    next();
  }
}
```

### 6. 数据库查询优化

**改进建议**:
```typescript
// 分页查询优化
export class OptimizedPaginationService {
  async findWithPagination<T>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    page: number,
    size: number
  ): Promise<PaginatedResult<T>> {
    // 使用 getManyAndCount 减少查询次数
    const [data, total] = await repository.findAndCount({
      ...options,
      skip: (page - 1) * size,
      take: size
    });
    
    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size)
    };
  }
}
```

### 7. 缓存策略

**改进建议**:
```typescript
// Redis缓存装饰器
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 存入缓存
      await this.redis.setex(cacheKey, ttl, JSON.stringify(result));
      
      return result;
    };
  };
}
```

---

## 测试建议

### 1. 单元测试
```typescript
// 控制器测试示例
describe('HomeController', () => {
  let controller: HomeController;
  let service: VideoService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: VideoService,
          useValue: {
            getHomeVideos: jest.fn()
          }
        }
      ]
    }).compile();
    
    controller = module.get<HomeController>(HomeController);
    service = module.get<VideoService>(VideoService);
  });
  
  it('should return home videos', async () => {
    const mockData = { data: { list: [] }, code: 200, msg: null };
    jest.spyOn(service, 'getHomeVideos').mockResolvedValue(mockData);
    
    const result = await controller.getVideos({ channeid: '1', page: 1 });
    expect(result).toEqual(mockData);
  });
});
```

### 2. 集成测试
```typescript
// E2E测试示例
describe('Auth (e2e)', () => {
  let app: INestApplication;
  
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  it('/auth/refresh (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: 'valid_token' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('expires_in');
      });
  });
});
```

---

## 部署和监控

### 1. 健康检查
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}
```

### 2. 性能监控
```typescript
// 性能监控中间件
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
      
      if (duration > 1000) { // 超过1秒的请求
        console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
      }
    });
    
    next();
  }
}
```

---

## 总结

本文档提供了短剧API项目的完整接口说明和健壮性改进建议。主要改进方向包括：

1. **统一错误处理**: 标准化错误响应格式
2. **参数验证增强**: 更严格的输入验证
3. **响应格式标准化**: 统一的API响应结构
4. **安全性提升**: 请求限流、敏感信息保护
5. **性能优化**: 缓存策略、数据库查询优化
6. **监控和日志**: 完善的日志记录和性能监控
7. **测试覆盖**: 单元测试和集成测试

建议按优先级逐步实施这些改进，以提升API的稳定性、安全性和用户体验。