import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 数据库配置类
 * 统一管理数据库相关配置项
 */
export class DatabaseConfig {
  @IsString()
  @Transform(({ value }) => value || 'localhost')
  host: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 3306)
  port: number = 3306;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  database?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || 'utf8mb4')
  charset?: string = 'utf8mb4';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || 'Asia/Shanghai')
  timezone?: string = 'Asia/Shanghai';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  synchronize?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  logging?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 10)
  maxConnections?: number = 10;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 0)
  minConnections?: number = 0;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 30000)
  acquireTimeout?: number = 30000;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 10000)
  timeout?: number = 10000;

  /**
   * 获取TypeORM配置对象
   */
  getTypeOrmConfig() {
    const useSqlite = (process.env.DB_TYPE === 'sqlite') || !this.username || !this.database;
    if (useSqlite) {
      return {
        type: 'sqlite' as const,
        database: process.env.SQLITE_DB_PATH || ':memory:',
        synchronize: true,
        logging: false,
        autoLoadEntities: true,
      };
    }
    return {
      type: 'mysql' as const,
      host: this.host,
      port: this.port,
      username: this.username!,
      password: this.password!,
      database: this.database!,
      charset: 'utf8mb4',
      timezone: '+08:00',
      synchronize: this.synchronize,
      logging: this.logging,
      extra: {
        connectionLimit: this.maxConnections,
        charset: 'utf8mb4',
        // Ensure driver treats zero-datetime values safely
        dateStrings: true,
        typeCast: function (field: any, next: () => any) {
          if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
            const val = field.string();
            if (val === '0000-00-00 00:00:00') {
              return null;
            }
            return val;
          }
          return next();
        },
      },
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 3000,
    };
  }
}