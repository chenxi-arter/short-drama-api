import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AdminAppModule } from './app.admin.module';
import { DateUtil } from './common/utils/date.util';

async function bootstrap() {
  const app = await NestFactory.create(AdminAppModule);

  app.setGlobalPrefix('api');

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
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const appTimezone = process.env.APP_TIMEZONE || process.env.DB_TIMEZONE || 'Asia/Shanghai';
  DateUtil.setTimezone(appTimezone);

  const adminPort = Number(process.env.ADMIN_PORT) || 8080;
  await app.listen(adminPort);
}
void bootstrap();


