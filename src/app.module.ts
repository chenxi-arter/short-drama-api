import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { TestModule } from './test/test.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      synchronize: true, // 开发环境开启
      autoLoadEntities: true, // ✅ 自动加载所有 forFeature 里注册的实体
    }),
    UserModule,
    VideoModule
  ],
})
export class AppModule {}
