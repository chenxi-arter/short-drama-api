# NestJS 项目结构优化方案

## 当前结构分析

### 🔍 发现的问题

1. **服务层过于庞大**
   - `video.service.ts` 达到 831 行，违反单一职责原则
   - 包含了多种不同的业务逻辑（视频管理、评论、进度、缓存等）

2. **模块职责不够清晰**
   - video 模块承担了过多责任
   - 缺少按业务领域的细分

3. **缺少基础设施模块**
   - 健康检查模块未注册到主模块
   - 缺少独立的配置管理模块
   - 缺少数据库模块的抽象

4. **共享资源管理不当**
   - 实体分散在各个模块中
   - 缺少统一的数据访问层

## 🚀 优化方案

### 1. 服务层拆分

将 `video.service.ts` 按业务领域拆分为多个专门的服务：

```
src/video/services/
├── video-core.service.ts      # 核心视频业务
├── episode.service.ts         # 剧集管理
├── comment.service.ts         # 评论管理
├── watch-progress.service.ts  # 观看进度
├── video-cache.service.ts     # 视频缓存管理
└── video-search.service.ts    # 视频搜索和筛选
```

### 2. 模块重构

#### 2.1 按业务领域拆分模块

```
src/
├── core/                      # 核心基础设施
│   ├── config/               # 配置管理
│   ├── database/             # 数据库配置
│   └── health/               # 健康检查
├── shared/                   # 共享模块
│   ├── entities/             # 共享实体
│   ├── dto/                  # 共享DTO
│   └── utils/                # 工具类
├── modules/
│   ├── auth/                 # 认证授权
│   ├── user/                 # 用户管理
│   ├── video/                # 视频核心
│   ├── episode/              # 剧集管理
│   ├── comment/              # 评论系统
│   └── analytics/            # 数据分析
```

#### 2.2 创建核心模块

```typescript
// src/core/core.module.ts
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    RedisCacheModule,
  ],
  exports: [
    DatabaseModule,
    RedisCacheModule,
  ],
})
export class CoreModule {}
```

### 3. 实体管理优化

#### 3.1 创建共享实体模块

```typescript
// src/shared/entities/entities.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 所有实体统一管理
      User, Series, Episode, EpisodeUrl,
      Comment, WatchProgress, Category,
      ShortVideo, Tag, RefreshToken
    ])
  ],
  exports: [TypeOrmModule]
})
export class EntitiesModule {}
```

### 4. 配置模块独立化

```typescript
// src/core/config/database.config.ts
@Injectable()
export class DatabaseConfig {
  @IsString()
  host: string;
  
  @IsNumber()
  port: number;
  
  // ... 其他配置
}

// src/core/database/database.module.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: DatabaseConfig) => ({
        type: 'mysql',
        host: config.host,
        port: config.port,
        // ...
      }),
      inject: [DatabaseConfig]
    })
  ]
})
export class DatabaseModule {}
```

### 5. 控制器优化

#### 5.1 API版本管理

```
src/modules/video/controllers/
├── v1/
│   ├── video.controller.ts
│   ├── episode.controller.ts
│   └── public.controller.ts
└── v2/
    └── video.controller.ts
```

#### 5.2 路由分组

```typescript
// 使用路由分组和版本控制
@Controller({ path: 'video', version: '1' })
export class VideoControllerV1 {}

@Controller({ path: 'episode', version: '1' })
export class EpisodeControllerV1 {}
```

### 6. 依赖注入优化

#### 6.1 使用接口抽象

```typescript
// src/modules/video/interfaces/video.service.interface.ts
export interface IVideoService {
  getVideoDetails(id: string): Promise<VideoDetailsResponse>;
  // ...
}

// 实现类
@Injectable()
export class VideoService implements IVideoService {
  // ...
}
```

### 7. 中间件和拦截器优化

```
src/common/
├── interceptors/
│   ├── response.interceptor.ts
│   ├── cache.interceptor.ts
│   └── logging.interceptor.ts
├── pipes/
│   ├── validation.pipe.ts
│   └── transform.pipe.ts
└── decorators/
    ├── api-response.decorator.ts
    └── cache-key.decorator.ts
```

## 📋 实施步骤

### 阶段一：基础设施重构
1. 创建 core 模块
2. 独立配置管理
3. 注册健康检查模块

### 阶段二：服务层拆分
1. 拆分 video.service.ts
2. 创建专门的服务类
3. 重构依赖关系

### 阶段三：模块重组
1. 按业务领域拆分模块
2. 创建共享模块
3. 优化模块间依赖

### 阶段四：API优化
1. 实现版本控制
2. 优化路由结构
3. 统一响应格式

## 🎯 预期收益

1. **可维护性提升**：代码职责清晰，易于维护和扩展
2. **可测试性增强**：服务拆分后更容易进行单元测试
3. **性能优化**：模块化加载，减少不必要的依赖
4. **团队协作**：清晰的模块边界便于团队分工
5. **扩展性**：新功能可以独立开发和部署

## ⚠️ 注意事项

1. **渐进式重构**：避免一次性大规模重构
2. **向后兼容**：保证现有API的兼容性
3. **测试覆盖**：重构过程中保持测试覆盖率
4. **文档更新**：及时更新相关文档