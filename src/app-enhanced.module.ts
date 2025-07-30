import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// 原有模块（仅导入存在的模块）
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';
import { TestModule } from './test/test.module';

// 健壮性改进组件
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import {
  LoggerMiddleware,
  PerformanceMiddleware,
  SecurityLoggerMiddleware,
} from './common/middleware/logger.middleware';

/**
 * 增强版应用模块
 * 集成了所有健壮性改进功能
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // 业务模块
    AuthModule,
    UserModule,
    VideoModule,
    TestModule,
  ],
  controllers: [],
  providers: [
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    
    // 全局验证管道（增强配置）
    {
      provide: APP_PIPE,
      useFactory: () => new ValidationPipe({
        // 自动转换类型
        transform: true,
        // 只保留DTO中定义的属性
        whitelist: true,
        // 如果有未定义的属性则抛出错误
        forbidNonWhitelisted: true,
        // 禁用详细错误（生产环境安全考虑）
        disableErrorMessages: process.env.NODE_ENV === 'production',
        // 自定义错误消息
        exceptionFactory: (errors) => {
          const messages = errors.map(error => {
            const constraints = error.constraints;
            if (constraints) {
              return Object.values(constraints).join(', ');
            }
            return `${error.property} 验证失败`;
          });
          
          return {
            statusCode: 400,
            message: '请求参数验证失败',
            errors: messages,
            error: 'Bad Request',
          };
        },
      }),
    },
    
    // 自定义限流守卫
    RateLimitGuard,
  ],
})
export class AppEnhancedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 配置中间件
    consumer
      .apply(
        SecurityLoggerMiddleware,  // 安全日志（最先执行）
        LoggerMiddleware,          // 请求日志
        PerformanceMiddleware,     // 性能监控
      )
      .forRoutes('*'); // 应用到所有路由
  }
}