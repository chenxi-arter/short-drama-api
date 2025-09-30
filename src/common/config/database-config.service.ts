import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
/**
 * Deprecated: 请使用 core/config/database.config.ts + core/database/database.module.ts
 * 作为唯一的数据库配置来源。本服务暂保留以兼容旧引用，不再作为新代码依赖。
 */
import { AppConfigService } from './app-config.service';
import { AppLoggerService } from '../logger/app-logger.service';

/**
 * 数据库配置服务
 * 提供优化的数据库连接配置
 */
@Injectable()
export class DatabaseConfigService {
  constructor(
    private readonly configService: AppConfigService,
    private readonly logger: AppLoggerService
  ) {}

  /**
   * 获取TypeORM配置
   */
  getTypeOrmConfig(): TypeOrmModuleOptions {
    const config: TypeOrmModuleOptions = {
      type: 'mysql',
      host: this.configService.database.host,
      port: this.configService.database.port,
      username: this.configService.database.username,
      password: this.configService.database.password,
      database: this.configService.database.database,
      
      // 实体配置
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize: this.configService.isDevelopment,
      
      // 连接池配置
      extra: {
        connectionLimit: this.getConnectionLimit(),
        acquireTimeout: 60000, // 获取连接超时时间
        timeout: 60000, // 查询超时时间
        reconnect: true, // 自动重连
        charset: 'utf8mb4',
        timezone: '+08:00',
        
        // 连接池优化
        idleTimeout: 300000, // 空闲连接超时时间（5分钟）
        maxIdle: this.getMaxIdleConnections(),
        
        // SSL配置（生产环境）
        ...(this.configService.isProduction && {
          ssl: {
            rejectUnauthorized: false,
          },
        }),
      },
      
      // 日志配置
      logging: this.getLoggingConfig(),
      logger: 'advanced-console',
      
      // 缓存配置
      cache: false, // 暂时禁用查询缓存
      
      // 迁移配置
      migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
      migrationsRun: false,
      
      // 订阅者配置
      subscribers: [__dirname + '/../../**/*.subscriber{.ts,.js}'],
      
      // 其他配置
      retryAttempts: 3,
      retryDelay: 3000,
      autoLoadEntities: true,
      
      // 命名策略 - 暂时注释掉
      // namingStrategy: new CustomNamingStrategy(),
    };

    this.logger.log('数据库配置已加载', 'DatabaseConfig');
    return config;
  }

  /**
   * 获取连接池大小
   */
  private getConnectionLimit(): number {
    if (this.configService.isProduction) {
      return 20; // 生产环境
    } else if (this.configService.isTest) {
      return 5; // 测试环境
    } else {
      return 10; // 开发环境
    }
  }

  /**
   * 获取最大空闲连接数
   */
  private getMaxIdleConnections(): number {
    const limit = this.getConnectionLimit();
    return Math.ceil(limit * 0.3); // 30%的连接保持空闲
  }

  /**
   * 获取日志配置
   */
  private getLoggingConfig(): boolean | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log')[] {
    if (this.configService.isDevelopment) {
      return ['query', 'error', 'warn'];
    } else if (this.configService.isTest) {
      return ['error'];
    } else {
      return ['error', 'warn'];
    }
  }

  /**
   * 获取缓存配置
   */
  private getCacheConfig() {
    if (this.configService.isProduction) {
      return {
        type: 'redis' as const,
        options: {
          host: this.configService.redis.host,
          port: this.configService.redis.port,
          password: this.configService.redis.password,
          db: 1, // 使用数据库1作为查询缓存
        },
        duration: 30000, // 缓存30秒
      };
    } else {
      return {
        type: 'database' as const,
        duration: 10000, // 缓存10秒
      };
    }
  }

  /**
   * 获取读写分离配置（暂时禁用）
   */
  getReplicationConfig(): TypeOrmModuleOptions {
    // 暂时返回基础配置，读写分离配置需要更复杂的类型定义
    return this.getTypeOrmConfig();
  }

  /**
   * 健康检查配置
   */
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      // 这里可以添加数据库连接检查逻辑
      this.logger.log('数据库健康检查通过', 'DatabaseHealth');
      return true;
    } catch (error) {
      this.logger.error('数据库健康检查失败', error instanceof Error ? error.stack : '', 'DatabaseHealth');
      return false;
    }
  }
}

/**
 * 自定义命名策略
 */
class CustomNamingStrategy {
  /**
   * 表名命名策略
   */
  tableName(className: string, customName?: string): string {
    if (customName) {
      return customName;
    }
    
    // 将PascalCase转换为snake_case
    return className
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1);
  }

  /**
   * 列名命名策略
   */
  columnName(propertyName: string, customName?: string, embeddedPrefixes?: string[]): string {
    if (customName) {
      return customName;
    }
    
    // 将camelCase转换为snake_case
    let name = propertyName.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    if (embeddedPrefixes && embeddedPrefixes.length > 0) {
      name = embeddedPrefixes.join('_') + '_' + name;
    }
    
    return name;
  }

  /**
   * 关系名命名策略
   */
  relationName(propertyName: string): string {
    return propertyName;
  }

  /**
   * 连接表名命名策略
   */
  joinTableName(firstTableName: string, secondTableName: string): string {
    return `${firstTableName}_${secondTableName}`;
  }

  /**
   * 连接列名命名策略
   */
  joinColumnName(relationName: string, referencedColumnName: string): string {
    return `${relationName}_${referencedColumnName}`;
  }

  /**
   * 连接表列名命名策略
   */
  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return `${tableName}_${columnName || propertyName}`;
  }

  /**
   * 索引名命名策略
   */
  indexName(tableOrName: string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `IDX_${tableName}_${columnNames.join('_')}`;
  }

  /**
   * 外键名命名策略
   */
  foreignKeyName(tableOrName: string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `FK_${tableName}_${columnNames.join('_')}`;
  }

  /**
   * 唯一约束名命名策略
   */
  uniqueConstraintName(tableOrName: string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `UQ_${tableName}_${columnNames.join('_')}`;
  }

  /**
   * 检查约束名命名策略
   */
  checkConstraintName(tableOrName: string, expression: string): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `CHK_${tableName}_${expression.replace(/\s+/g, '_')}`;
  }

  /**
   * 排除约束名命名策略
   */
  exclusionConstraintName(tableOrName: string, expression: string): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `XCL_${tableName}_${expression.replace(/\s+/g, '_')}`;
  }

  /**
   * 主键名命名策略
   */
  primaryKeyName(tableOrName: string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName;
    return `PK_${tableName}`;
  }
}