import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DateUtil } from './common/utils/date.util';
import { LEGAL_DISCLAIMER } from './common/constants/legal.constants';

async function bootstrap() {
  // 启动时输出法律免责声明
  console.log('\n' + '='.repeat(80));
  console.log('法律免责声明 / Legal Disclaimer');
  console.log('='.repeat(80));
  console.log(LEGAL_DISCLAIMER.DEVELOPER_STATEMENT);
  console.log('='.repeat(80) + '\n');
  const app = await NestFactory.create(AppModule);

  // 统一所有路由加上 /api 前缀
  app.setGlobalPrefix('api');

  // ✅ 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: false, // 允许额外的参数
    forbidNonWhitelisted: false, // 不禁止额外的参数
    // 添加错误处理
    exceptionFactory: (errors) => {
      // 将验证错误压缩为前端可读的数组
      const details = errors.map((e: any) => ({
        property: e.property,
        constraints: e.constraints,
        children: e.children?.length ? e.children : undefined,
      }));
      return new BadRequestException({ message: '参数验证失败', details });
    }
  }));

  // ✅ 开启跨域
  app.enableCors({
    origin: '*', // 生产环境可改为 'https://thinkingking.top'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ✅ 配置全局时区（可从环境变量动态切换）
  const appTimezone = process.env.APP_TIMEZONE || process.env.DB_TIMEZONE || 'Asia/Shanghai';
  DateUtil.setTimezone(appTimezone);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
