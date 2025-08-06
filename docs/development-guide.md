# 👨‍💻 开发指南

## 📋 概述

本指南为短剧API项目的开发者提供详细的开发环境搭建、代码规范、开发流程和最佳实践。

## 🛠️ 开发环境搭建

### 系统要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0 (可选)
- **Git**: >= 2.30.0
- **IDE**: VS Code (推荐)

### 1. 克隆项目

```bash
git clone <repository-url>
cd short-drama-api
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 环境配置

```bash
# 复制环境配置文件
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 开发环境配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=short_drama_dev

# JWT配置
JWT_SECRET=your_development_jwt_secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Redis配置（开发环境可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=300

# 限流配置（开发环境放宽）
THROTTLE_TTL=60
THROTTLE_LIMIT=1000

# CORS配置
CORS_ORIGIN=http://localhost:3001
```

### 4. 数据库初始化

```bash
# 创建开发数据库
mysql -u root -p -e "CREATE DATABASE short_drama_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行数据库迁移（如果有）
npm run migration:run

# 或导入完整SQL文件
mysql -u root -p short_drama_dev < migrations/complete-setup.sql
```

### 5. 启动开发服务器

```bash
# 开发模式（热重载）
npm run start:dev

# 调试模式
npm run start:debug
```

服务将在 `http://localhost:3000` 启动。

## 🏗️ 项目架构

### 目录结构

```
src/
├── core/                    # 核心基础设施
│   ├── config/             # 配置管理
│   ├── database/           # 数据库连接
│   └── health/             # 健康检查
├── shared/                  # 共享模块
│   ├── entities/           # 数据库实体
│   └── utils/              # 工具类
├── auth/                    # 认证模块
├── video/                   # 视频模块
│   ├── controllers/        # 控制器
│   ├── services/           # 业务逻辑
│   └── dto/                # 数据传输对象
├── user/                    # 用户模块
├── comment/                 # 评论模块
├── category/                # 分类模块
├── banner/                  # 轮播图模块
├── filter/                  # 筛选模块
├── common/                  # 通用组件
│   ├── decorators/         # 装饰器
│   ├── filters/            # 异常过滤器
│   ├── guards/             # 守卫
│   ├── interceptors/       # 拦截器
│   └── pipes/              # 管道
└── main.ts                  # 应用入口
```

### 架构原则

1. **模块化设计**: 每个功能模块独立，职责明确
2. **分层架构**: Controller → Service → Repository
3. **依赖注入**: 使用NestJS的DI容器
4. **配置管理**: 统一的配置模块
5. **错误处理**: 全局异常过滤器
6. **数据验证**: DTO + class-validator

## 📝 代码规范

### 1. TypeScript规范

```typescript
// ✅ 好的示例
export class VideoService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: Repository<Series>,
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
  ) {}

  async getVideoDetails(id: number): Promise<VideoDetailsDto> {
    const series = await this.seriesRepository.findOne({
      where: { id },
      relations: ['episodes', 'category'],
    });

    if (!series) {
      throw new NotFoundException('视频不存在');
    }

    return this.transformToDto(series);
  }

  private transformToDto(series: Series): VideoDetailsDto {
    // 转换逻辑
  }
}
```

### 2. 命名规范

- **文件名**: kebab-case (video-details.dto.ts)
- **类名**: PascalCase (VideoDetailsDto)
- **方法名**: camelCase (getVideoDetails)
- **常量**: UPPER_SNAKE_CASE (MAX_PAGE_SIZE)
- **接口**: PascalCase + I前缀 (IVideoService)

### 3. 注释规范

```typescript
/**
 * 视频详情数据传输对象
 * @description 用于返回视频详细信息的DTO
 */
export class VideoDetailsDto {
  /**
   * 视频ID
   * @example 1001
   */
  id: number;

  /**
   * 视频标题
   * @example "精彩短剧"
   */
  title: string;
}
```

### 4. 错误处理规范

```typescript
// ✅ 统一的错误处理
try {
  const result = await this.someAsyncOperation();
  return result;
} catch (error) {
  this.logger.error(`操作失败: ${error.message}`, error.stack);
  
  if (error instanceof NotFoundException) {
    throw error;
  }
  
  throw new InternalServerErrorException('服务器内部错误');
}
```

## 🔧 开发工具配置

### VS Code 推荐插件

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code 工作区设置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint 配置

```json
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@nestjs/eslint-config-nestjs',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

## 🧪 测试开发

### 1. 单元测试

```typescript
// video.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoService } from './video.service';
import { Series } from '../entities/series.entity';

describe('VideoService', () => {
  let service: VideoService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: getRepositoryToken(Series),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  describe('getVideoDetails', () => {
    it('should return video details', async () => {
      const mockSeries = {
        id: 1,
        title: 'Test Video',
        episodes: [],
      };
      
      mockRepository.findOne.mockResolvedValue(mockSeries);
      
      const result = await service.getVideoDetails(1);
      
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Video');
    });
  });
});
```

### 2. 集成测试

```typescript
// video.controller.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('VideoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/video/details/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/video/details/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(1);
      });
  });
});
```

### 3. 运行测试

```bash
# 单元测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:cov

# 端到端测试
npm run test:e2e
```

## 🔄 开发流程

### 1. Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/video-search

# 2. 开发功能
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: 添加视频搜索功能"

# 4. 推送分支
git push origin feature/video-search

# 5. 创建 Pull Request
# ... 在 GitHub/GitLab 创建 PR ...

# 6. 代码审查通过后合并
git checkout main
git pull origin main
git branch -d feature/video-search
```

### 2. 提交信息规范

```bash
# 格式: type(scope): description

# 功能
git commit -m "feat(video): 添加视频搜索功能"

# 修复
git commit -m "fix(auth): 修复令牌刷新问题"

# 文档
git commit -m "docs: 更新API文档"

# 样式
git commit -m "style: 修复代码格式"

# 重构
git commit -m "refactor(video): 重构视频服务"

# 测试
git commit -m "test: 添加视频服务测试"

# 构建
git commit -m "build: 更新依赖包"
```

### 3. 代码审查清单

- [ ] 代码符合项目规范
- [ ] 功能实现正确
- [ ] 错误处理完善
- [ ] 测试覆盖充分
- [ ] 性能考虑合理
- [ ] 安全性检查
- [ ] 文档更新及时

## 🚀 新功能开发

### 1. 创建新模块

```bash
# 使用 NestJS CLI 创建模块
nest generate module search
nest generate controller search
nest generate service search
```

### 2. 模块结构示例

```typescript
// search.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Series } from '../shared/entities/series.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Series])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
```

### 3. 控制器示例

```typescript
// search.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchDto,
  ) {
    return this.searchService.search(searchDto);
  }
}
```

### 4. DTO 示例

```typescript
// dto/search.dto.ts
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
```

## 🔍 调试技巧

### 1. 日志调试

```typescript
import { Logger } from '@nestjs/common';

export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  async getVideoDetails(id: number) {
    this.logger.debug(`获取视频详情: ${id}`);
    
    try {
      const result = await this.findVideo(id);
      this.logger.log(`成功获取视频: ${result.title}`);
      return result;
    } catch (error) {
      this.logger.error(`获取视频失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### 2. VS Code 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "args": ["--debug"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

### 3. 数据库查询调试

```typescript
// 启用查询日志
// app.module.ts
TypeOrmModule.forRoot({
  // ... 其他配置
  logging: ['query', 'error'],
  logger: 'advanced-console',
}),
```

## 📊 性能优化

### 1. 数据库查询优化

```typescript
// ✅ 使用查询构建器
const videos = await this.seriesRepository
  .createQueryBuilder('series')
  .leftJoinAndSelect('series.episodes', 'episodes')
  .leftJoinAndSelect('series.category', 'category')
  .where('series.is_active = :isActive', { isActive: true })
  .orderBy('series.created_at', 'DESC')
  .limit(20)
  .getMany();

// ✅ 使用索引
@Index(['category_id', 'is_active'])
@Entity('series')
export class Series {
  // ...
}
```

### 2. 缓存策略

```typescript
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('video')
@UseInterceptors(CacheInterceptor)
export class VideoController {
  @Get('hot')
  @CacheKey('hot-videos')
  @CacheTTL(300) // 5分钟缓存
  async getHotVideos() {
    return this.videoService.getHotVideos();
  }
}
```

### 3. 分页优化

```typescript
// 使用游标分页替代偏移分页
async getVideosByCursor(cursor?: number, limit: number = 20) {
  const queryBuilder = this.seriesRepository
    .createQueryBuilder('series')
    .orderBy('series.id', 'DESC')
    .limit(limit + 1); // 多查一条判断是否有下一页

  if (cursor) {
    queryBuilder.where('series.id < :cursor', { cursor });
  }

  const videos = await queryBuilder.getMany();
  const hasNext = videos.length > limit;
  
  if (hasNext) {
    videos.pop(); // 移除多查的一条
  }

  return {
    data: videos,
    hasNext,
    nextCursor: hasNext ? videos[videos.length - 1].id : null,
  };
}
```

## 🔒 安全最佳实践

### 1. 输入验证

```typescript
// 使用 DTO 和 class-validator
export class CreateCommentDto {
  @IsString()
  @Length(1, 500)
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(1)
  episode_id: number;

  @IsEnum(['normal', 'danmaku'])
  comment_type: string;
}
```

### 2. SQL 注入防护

```typescript
// ✅ 使用参数化查询
const user = await this.userRepository.findOne({
  where: { username: username },
});

// ✅ 使用查询构建器
const videos = await this.seriesRepository
  .createQueryBuilder('series')
  .where('series.title LIKE :title', { title: `%${keyword}%` })
  .getMany();
```

### 3. 敏感信息保护

```typescript
// 排除敏感字段
@Entity('users')
export class User {
  @Column({ select: false }) // 默认不查询
  password: string;

  @Exclude() // 序列化时排除
  refresh_token: string;
}
```

## 📚 学习资源

### 官方文档
- [NestJS 官方文档](https://docs.nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [class-validator 文档](https://github.com/typestack/class-validator)

### 推荐阅读
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript 深入理解](https://basarat.gitbook.io/typescript/)
- [MySQL 性能优化](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

### 社区资源
- [NestJS Discord](https://discord.gg/G7Qnnhy)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nestjs)
- [GitHub Issues](https://github.com/nestjs/nest/issues)

---

## 📞 技术支持

开发过程中如遇问题，请参考：
- [API接口文档](./api-summary-documentation.md)
- [数据库设计文档](./database-schema-documentation.md)
- [部署指南](./deployment-guide.md)
- [API测试指南](./api-testing-guide.md)
- [健壮性实现指南](./robustness-implementation-guide.md)

或通过以下方式获取帮助：
- 查看项目 Issues
- 联系项目维护者
- 参与社区讨论