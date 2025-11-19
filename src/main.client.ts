import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ClientAppModule } from './app.client.module';
import { DateUtil } from './common/utils/date.util';
import { Request, Response, NextFunction } from 'express';
import { LEGAL_DISCLAIMER } from './common/constants/legal.constants';

async function bootstrap() {
  // 启动时输出法律免责声明
  console.log('\n' + '='.repeat(80));
  console.log('法律免责声明 / Legal Disclaimer');
  console.log('='.repeat(80));
  console.log(LEGAL_DISCLAIMER.DEVELOPER_STATEMENT);
  console.log('='.repeat(80) + '\n');
  const app = await NestFactory.create(ClientAppModule);

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
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-HTTP-Method-Override'],
    optionsSuccessStatus: 204,
  });

  const appTimezone = process.env.APP_TIMEZONE || process.env.DB_TIMEZONE || 'Asia/Shanghai';
  DateUtil.setTimezone(appTimezone);

  const clientPort = Number(process.env.CLIENT_PORT) || 3000;
  await app.listen(clientPort);
}
void bootstrap();


