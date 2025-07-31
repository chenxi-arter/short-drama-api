import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from '../config/database.config';

/**
 * 全局数据库模块
 * 提供TypeORM配置和连接管理
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (databaseConfig: DatabaseConfig) => {
        return databaseConfig.getTypeOrmConfig();
      },
      inject: [DatabaseConfig],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}