import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: false, // 允许额外的参数
    forbidNonWhitelisted: false, // 不禁止额外的参数
    // 添加错误处理
    exceptionFactory: (errors) => {
      console.log('验证错误详情:', JSON.stringify(errors, null, 2));
      return new Error('参数验证失败');
    }
  }));

  // ✅ 开启跨域
  app.enableCors({
    origin: '*', // 生产环境可改为 'https://thinkingking.top'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
