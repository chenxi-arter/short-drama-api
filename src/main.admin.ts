import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AdminAppModule } from './app.admin.module';
import { DateUtil } from './common/utils/date.util';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AdminAppModule);

  app.setGlobalPrefix('api');

  // 兼容环境不允许 PUT/DELETE 的情况：
  // 允许通过 POST + X-HTTP-Method-Override 或 _method=? 模拟 PUT/DELETE/PATCH
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const headerOverride = req.header('x-http-method-override');
    const queryOverride = typeof req.query._method === 'string' ? req.query._method : undefined;
    const override = headerOverride || queryOverride;
    if (override) {
      const upper = override.toUpperCase();
      if (upper === 'PUT' || upper === 'DELETE' || upper === 'PATCH') {
        req.method = upper;
      }
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: false,
    forbidNonWhitelisted: false,
    exceptionFactory: (errors: ValidationError[]) => {
      const details = errors.map((e: ValidationError) => ({
        property: e.property,
        constraints: e.constraints,
        children: e.children?.length ? e.children : undefined,
      }));
      return new BadRequestException({ message: '参数验证失败', details });
    }
  }));

  app.enableCors({
    // 回显请求来源，允许携带凭据，满足浏览器对预检的要求
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-HTTP-Method-Override'],
    optionsSuccessStatus: 204,
  });

  const appTimezone = process.env.APP_TIMEZONE || process.env.DB_TIMEZONE || 'Asia/Shanghai';
  DateUtil.setTimezone(appTimezone);

  const adminPort = Number(process.env.ADMIN_PORT) || 8080;
  await app.listen(adminPort);
}
void bootstrap();


