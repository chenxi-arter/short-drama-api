# 🔧 代码重构操作指南

## 📋 概述

本文档提供了具体的代码重构操作步骤，帮助你逐步优化代码结构，解决发现的问题。

**重要说明**: 基于你现有的模块结构，我们将扩展现有的 `cache/` 模块，而不是创建新的。

**重要说明**: 基于你现有的模块结构，我们将扩展现有的 `cache/` 模块，而不是创建新的。

---

## 🚨 立即需要修复的问题

### 1. 删除重复的应用模块文件

#### 操作步骤：
```bash
# 1. 备份当前文件（可选）
cp src/app-enhanced.module.ts src/app-enhanced.module.ts.backup

# 2. 检查两个文件的差异
diff src/app.module.ts src/app-enhanced.module.ts

# 3. 删除重复文件
rm src/app-enhanced.module.ts

# 4. 清理导入引用
# 搜索项目中是否有地方导入了 app-enhanced.module.ts
grep -r "app-enhanced" src/
```

#### 需要检查的文件：
- `src/main.ts` - 确保没有引用 `app-enhanced.module.ts`
- 其他可能引用的文件

### 2. 修复VideoModule中的重复服务注册

#### 当前问题：
```typescript
// src/video/video.module.ts
providers: [
  // ... 其他服务
  BannerService,        // 第一次注册
  // ... 其他服务
  BannerService,        // 第二次注册（重复）
]
```

#### 修复步骤：
```typescript
// 修复后的 providers 数组
providers: [
  VideoService,
  WatchProgressService,
  CommentService,
  EpisodeService,
  CategoryService,
  BannerService,        // 只保留一个
  FilterService,
  SeriesService,
  BrowseHistoryService,
  AppLoggerService,
  AppConfigService,
  IsValidChannelExistsConstraint,
]
```

### 3. 清理无用的导入

#### 检查VideoService中的无用导入：
```typescript
// src/video/video.service.ts
// 检查这些导入是否都在使用
import { FilterType } from './entity/filter-type.entity';      // 可能未使用
import { FilterOption } from './entity/filter-option.entity';  // 可能未使用
```

#### 清理步骤：
```bash
# 1. 搜索未使用的导入
grep -r "FilterType\|FilterOption" src/video/

# 2. 如果确实未使用，删除这些导入
# 3. 重新编译检查是否有错误
npm run build
```

---

## 🏗️ 模块重构操作指南

### 阶段1: 创建新的模块目录结构

#### 操作步骤：
```bash
# 1. 创建新的模块目录
mkdir -p src/episode/{controllers,services,entity,dto}
mkdir -p src/content/{controllers,services,entity,dto}
mkdir -p src/search/{controllers,services,entity,dto}
mkdir -p src/user-activity/{controllers,services,entity,dto}

# 2. 扩展现有的cache模块
mkdir -p src/cache/{controllers,utils}

# 3. 创建模块文件
touch src/episode/episode.module.ts
touch src/content/content.module.ts
touch src/search/search.module.ts
touch src/user-activity/user-activity.module.ts
```

### 阶段2: 移动文件到对应模块

#### 2.1 移动剧集相关文件
```bash
# 移动剧集实体
mv src/video/entity/episode.entity.ts src/episode/entity/
mv src/video/entity/episode-url.entity.ts src/episode/entity/

# 移动剧集服务
mv src/video/services/episode.service.ts src/episode/services/

# 移动剧集DTO
mv src/video/dto/episode-list.dto.ts src/episode/dto/
```

#### 2.2 移动内容管理相关文件
```bash
# 移动轮播图相关
mv src/video/controllers/banner.controller.ts src/content/controllers/
mv src/video/services/banner.service.ts src/content/services/
mv src/video/entity/banner.entity.ts src/content/entity/

# 移动分类相关
mv src/video/controllers/category.controller.ts src/content/controllers/
mv src/video/services/category.service.ts src/content/services/
mv src/video/entity/category.entity.ts src/content/entity/
```

#### 2.3 移动搜索筛选相关文件
```bash
# 移动筛选相关
mv src/video/services/filter.service.ts src/search/services/
mv src/video/controllers/list.controller.ts src/search/controllers/
mv src/video/entity/filter-type.entity.ts src/search/entity/
mv src/video/entity/filter-option.entity.ts src/search/entity/
mv src/video/dto/filter-*.dto.ts src/search/dto/
```

#### 2.4 移动用户行为相关文件
```bash
# 移动浏览记录相关
mv src/video/controllers/browse-history.controller.ts src/user-activity/controllers/
mv src/video/services/browse-history.service.ts src/user-activity/services/
mv src/video/entity/browse-history.entity.ts src/user-activity/entity/

# 移动观看进度相关
mv src/video/services/watch-progress.service.ts src/user-activity/services/
mv src/video/entity/watch-progress.entity.ts src/user-activity/entity/

# 移动评论相关
mv src/video/services/comment.service.ts src/user-activity/services/
mv src/video/entity/comment.entity.ts src/user-activity/entity/
```

#### 2.5 扩展现有的cache模块
```bash
# 移动缓存监控相关文件到现有的cache模块
mv src/video/cache-monitor.controller.ts src/cache/controllers/
mv src/video/utils/cache-config.util.ts src/cache/utils/
mv src/video/utils/cache-keys.util.ts src/cache/utils/
```

### 阶段3: 创建新的模块文件

#### 3.1 EpisodeModule
```typescript
// src/episode/episode.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from './entity/episode.entity';
import { EpisodeUrl } from './entity/episode-url.entity';
import { EpisodeService } from './services/episode.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Episode, EpisodeUrl]),
  ],
  providers: [EpisodeService],
  exports: [EpisodeService],
})
export class EpisodeModule {}
```

#### 3.2 ContentModule
```typescript
// src/content/content.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entity/banner.entity';
import { Category } from './entity/category.entity';
import { BannerService } from './services/banner.service';
import { CategoryService } from './services/category.service';
import { BannerController } from './controllers/banner.controller';
import { CategoryController } from './controllers/category.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner, Category]),
  ],
  providers: [BannerService, CategoryService],
  controllers: [BannerController, CategoryController],
  exports: [BannerService, CategoryService],
})
export class ContentModule {}
```

#### 3.3 SearchModule
```typescript
// src/search/search.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterType } from './entity/filter-type.entity';
import { FilterOption } from './entity/filter-option.entity';
import { FilterService } from './services/filter.service';
import { ListController } from './controllers/list.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FilterType, FilterOption]),
  ],
  providers: [FilterService],
  controllers: [ListController],
  exports: [FilterService],
})
export class SearchModule {}
```

#### 3.4 UserActivityModule
```typescript
// src/user-activity/user-activity.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowseHistory } from './entity/browse-history.entity';
import { WatchProgress } from './entity/watch-progress.entity';
import { Comment } from './entity/comment.entity';
import { BrowseHistoryService } from './services/browse-history.service';
import { WatchProgressService } from './services/watch-progress.service';
import { CommentService } from './services/comment.service';
import { BrowseHistoryController } from './controllers/browse-history.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrowseHistory, WatchProgress, Comment]),
  ],
  providers: [BrowseHistoryService, WatchProgressService, CommentService],
  controllers: [BrowseHistoryController],
  exports: [BrowseHistoryService, WatchProgressService, CommentService],
})
export class UserActivityModule {}
```

#### 3.5 扩展现有的CacheModule
```typescript
// src/cache/cache.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheMonitorController } from './controllers/cache-monitor.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: configService.get('REDIS_TTL', 300), // 默认5分钟缓存
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CacheMonitorController],
  exports: [CacheModule],
})
export class RedisCacheModule {}
```

### 阶段4: 重构VideoModule

#### 4.1 更新VideoModule导入
```typescript
// src/video/video.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';

// 导入新的模块
import { EpisodeModule } from '../episode/episode.module';
import { ContentModule } from '../content/content.module';
import { SearchModule } from '../search/search.module';
import { UserActivityModule } from '../user-activity/user-activity.module';
import { RedisCacheModule } from '../cache/cache.module';

// 保留的核心实体
import { Series } from './entity/series.entity';
import { ShortVideo } from './entity/short-video.entity';

// 保留的核心服务
import { VideoService } from './video.service';
import { SeriesService } from './services/series.service';

// 保留的核心控制器
import { VideoController } from './video.controller';
import { PublicVideoController } from './public-video.controller';
import { HomeController } from './home.controller';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([
      Series,
      ShortVideo,
    ]),
    // 导入新的模块
    EpisodeModule,
    ContentModule,
    SearchModule,
    UserActivityModule,
    RedisCacheModule,
  ],
  providers: [
    VideoService,
    SeriesService,
    AppLoggerService,
    AppConfigService,
    IsValidChannelExistsConstraint,
  ],
  controllers: [
    PublicVideoController,
    VideoController,
    HomeController,
  ],
  exports: [
    VideoService,
    SeriesService,
  ],
})
export class VideoModule {}
```

### 阶段5: 重构VideoService

#### 5.1 拆分VideoService职责
```typescript
// src/video/video.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// 导入新的服务
import { EpisodeService } from '../episode/services/episode.service';
import { BannerService } from '../content/services/banner.service';
import { CategoryService } from '../content/services/category.service';
import { FilterService } from '../search/services/filter.service';
import { BrowseHistoryService } from '../user-activity/services/browse-history.service';
import { WatchProgressService } from '../user-activity/services/watch-progress.service';
import { CommentService } from '../user-activity/services/comment.service';

// 保留的核心实体
import { Series } from './entity/series.entity';
import { ShortVideo } from './entity/short-video.entity';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Series) private readonly seriesRepo: Repository<Series>,
    @InjectRepository(ShortVideo) private readonly shortRepo: Repository<ShortVideo>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    
    // 注入新的服务
    private readonly episodeService: EpisodeService,
    private readonly bannerService: BannerService,
    private readonly categoryService: CategoryService,
    private readonly filterService: FilterService,
    private readonly browseHistoryService: BrowseHistoryService,
    private readonly watchProgressService: WatchProgressService,
    private readonly commentService: CommentService,
  ) {}

  // 保留核心视频功能
  async getSeriesDetail(seriesId: number) { ... }
  async getHomeVideos(channeid: number, page: number = 1) { ... }
  
  // 其他核心功能...
}
```

---

## 🔍 重构后的验证步骤

### 1. 编译检查
```bash
# 检查是否有编译错误
npm run build

# 如果有错误，逐个修复
```

### 2. 功能测试
```bash
# 启动应用
npm run start:dev

# 测试主要接口
curl http://localhost:8080/health
curl http://localhost:8080/api/home/categories
```

### 3. 依赖检查
```bash
# 检查是否有循环依赖
npm run start:dev

# 查看控制台是否有依赖警告
```

---

## 📝 重构注意事项

### 1. **渐进式重构**
- 不要一次性移动所有文件
- 每移动一个模块就测试一次
- 保持系统可运行状态

### 2. **保持向后兼容**
- 不要改变现有的API接口
- 保持现有的DTO结构
- 确保现有功能正常工作

### 3. **测试覆盖**
- 每个重构步骤都要测试
- 保持现有的测试用例通过
- 添加新的测试用例

### 4. **版本控制**
- 每个重构步骤都要提交
- 写清楚的重构说明
- 准备回滚方案

---

## 🚀 下一步计划

### 短期目标（1-2周）
1. ✅ 完成模块拆分
2. ✅ 重构VideoService
3. ✅ 优化依赖关系

### 中期目标（1个月）
1. 🔄 实现事件驱动架构
2. 🔄 优化数据库查询
3. 🔄 完善缓存策略

### 长期目标（3个月）
1. 📋 微服务架构演进
2. 📋 自动化测试完善
3. 📋 性能监控系统

---

## 🔄 更新说明

**v1.1 更新内容**:
- ✅ 基于用户现有的模块结构调整重构方案
- ✅ 选择方案1：扩展现有的cache模块
- ✅ 更新所有相关的代码示例和操作步骤
- ✅ 保持与现有架构的一致性

---

**文档版本**: v1.1  
**创建时间**: 2025年1月  
**最后更新**: 2025年1月
