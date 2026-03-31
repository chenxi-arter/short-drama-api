import { Global, Module, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from '../config/database.config';
import { DataSource } from 'typeorm';

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
      dataSourceFactory: async (options) => {
        const logger = new Logger('DatabaseModule');
        const dataSource = new DataSource(options!);
        await dataSource.initialize();
        const dbOpts = options as any;
        logger.log(
          `\x1b[36m🗄️  MySQL connected ✔  ${dbOpts.host}:${dbOpts.port}  db=${dbOpts.database}\x1b[0m`,
        );
        return dataSource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}