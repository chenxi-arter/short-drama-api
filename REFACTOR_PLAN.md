# 🔧 代码结构优化方案

## 📊 当前问题分析

### 1. VideoService 过于庞大 (1607行, 45个方法)
- 包含了系列、剧集、播放、评论、筛选等多种业务逻辑
- 违反单一职责原则，难以维护

### 2. 模块依赖重复
- 多个模块重复注册相同的实体
- VideoModule 和 VideoApiModule 职责重叠

### 3. 服务耦合度高
- FilterService (542行) 也比较庞大
- 各服务之间依赖关系复杂

## 🎯 优化方案

### 方案一：拆分 VideoService（推荐）

#### 1.1 按业务领域拆分服务

```typescript
// 当前：VideoService (1607行)
// 优化后：

// 1. 播放相关服务
class PlaybackService {
  - saveProgress()
  - getProgress() 
  - saveProgressWithBrowseHistory()
  - getUserSeriesProgress()
}

// 2. 内容管理服务
class ContentService {
  - getEpisodeList()
  - getSeriesDetail()
  - getEpisodeByShortId()
  - createEpisodeUrl()
}

// 3. 首页服务
class HomeService {
  - getHomeVideos()
  - getHomeModules()
  - listCategories()
}

// 4. 媒体服务
class MediaService {
  - listMedia()
  - listSeriesFull()
  - listSeriesByCategory()
}

// 5. URL管理服务
class UrlService {
  - getEpisodeUrlByAccessKey()
  - getEpisodeUrlByKey()
  - generateAccessKeysForExisting()
}
```

#### 1.2 重构后的 VideoService

```typescript
// 新的 VideoService 作为协调器
@Injectable()
class VideoService {
  constructor(
    private readonly playbackService: PlaybackService,
    private readonly contentService: ContentService,
    private readonly homeService: HomeService,
    private readonly mediaService: MediaService,
    private readonly urlService: UrlService,
  ) {}

  // 保持对外接口不变，内部委托给专门的服务
  async saveProgress(userId: number, episodeId: number, stopAtSecond: number) {
    return this.playbackService.saveProgress(userId, episodeId, stopAtSecond);
  }

  async getEpisodeList(...args) {
    return this.contentService.getEpisodeList(...args);
  }
  
  // ... 其他方法类似
}
```

### 方案二：优化模块结构

#### 2.1 重新组织模块

```typescript
// 当前模块结构问题：
VideoModule {
  imports: [VideoApiModule, SeriesModule, EpisodeModule, ...] // 重复导入
  providers: [VideoService, SeriesService, ...] // 重复注册
}

// 优化后：
// 1. 核心视频模块
@Module({
  imports: [
    PlaybackModule,    // 播放相关
    ContentModule,     // 内容管理
    FilterModule,      // 筛选搜索
    AdminModule,       // 管理功能
  ]
})
export class VideoModule {}

// 2. 播放模块
@Module({
  providers: [PlaybackService, WatchProgressService],
  exports: [PlaybackService]
})
export class PlaybackModule {}

// 3. 内容模块
@Module({
  providers: [ContentService, SeriesService, EpisodeService],
  exports: [ContentService]
})
export class ContentModule {}
```

#### 2.2 清理重复依赖

```typescript
// 问题：多个模块重复注册相同实体
VideoModule: TypeOrmModule.forFeature([Series, Episode, ...])
SeriesModule: TypeOrmModule.forFeature([Series, Episode, ...])  // 重复
EpisodeModule: TypeOrmModule.forFeature([Episode, ...])         // 重复

// 解决：使用 SharedEntityModule
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Series, Episode, EpisodeUrl, ...])],
  exports: [TypeOrmModule]
})
export class SharedEntityModule {}

// 其他模块只需导入
@Module({
  imports: [SharedEntityModule],
  // 不需要重复注册实体
})
export class VideoModule {}
```

### 方案三：优化控制器结构

#### 3.1 按功能域重新组织控制器

```typescript
// 当前控制器分散问题：
VideoController          // 认证用户的视频操作
PublicVideoController     // 公开视频接口
HomeController           // 首页相关
ListController           // 列表和搜索
BrowseHistoryController  // 浏览历史

// 优化后：
// 1. 用户端控制器
@Controller('api/user')
class UserVideoController {
  // 用户相关的所有视频操作
  @Post('watch/progress')     // 观看进度
  @Get('watch/history')       // 观看历史
  @Get('episodes')            // 个人剧集列表
  @Post('comment')            // 发表评论
}

// 2. 公开内容控制器
@Controller('api/content')
class ContentController {
  @Get('home')                // 首页内容
  @Get('series')              // 系列列表
  @Get('episodes')            // 公开剧集列表
  @Get('search')              // 搜索功能
}

// 3. 筛选控制器
@Controller('api/filter')
class FilterController {
  @Get('tags')                // 筛选标签
  @Get('data')                // 筛选数据
  @Get('search')              // 模糊搜索
}
```

## 🔧 具体实施步骤

### 阶段一：拆分 VideoService（立即执行）

1. **创建专门的服务类**
2. **保持对外接口不变**
3. **逐步迁移方法**
4. **添加单元测试**

### 阶段二：优化模块依赖（近期执行）

1. **创建 SharedEntityModule**
2. **清理重复的实体注册**
3. **优化模块导入关系**

### 阶段三：重构控制器（长期规划）

1. **按业务域重新组织路由**
2. **保持向后兼容**
3. **逐步迁移现有路由**

## 📈 优化效果预期

### 代码质量
- ✅ 单一职责：每个服务专注特定业务
- ✅ 可维护性：代码更清晰，易于理解
- ✅ 可测试性：更容易编写单元测试
- ✅ 可扩展性：新功能更容易添加

### 性能优化
- ✅ 内存使用：减少重复的实体注册
- ✅ 启动速度：优化模块依赖关系
- ✅ 开发体验：更快的热重载

### 团队协作
- ✅ 代码审查：更小的文件，更容易审查
- ✅ 并行开发：不同开发者可以并行工作
- ✅ 冲突减少：减少合并冲突

## ⚠️ 注意事项

1. **向后兼容**：所有现有API接口保持不变
2. **渐进式重构**：分阶段执行，降低风险
3. **测试覆盖**：确保重构后功能正常
4. **文档更新**：更新相关技术文档
