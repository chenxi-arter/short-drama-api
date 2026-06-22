/**
 * 用户操作日志服务 - 记录关键用户行为
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOperationLog } from '../entity/user-operation-log.entity';

type OperationLogInput = {
  userId: number;
  method: string;
  path: string;
  action?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class UserOperationLogService implements OnModuleInit {
  private readonly logger = new Logger(UserOperationLogService.name);

  constructor(
    @InjectRepository(UserOperationLog)
    private readonly operationLogRepo: Repository<UserOperationLog>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTable();
  }

  async record(input: OperationLogInput): Promise<void> {
    try {
      await this.operationLogRepo.insert({
        userId: input.userId,
        method: input.method.slice(0, 20),
        path: input.path.slice(0, 500),
        action: input.action?.slice(0, 100) ?? null,
        ipAddress: input.ipAddress?.slice(0, 45) ?? null,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
      });
    } catch (error) {
      this.logger.warn(`record operation log failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async ensureTable(): Promise<void> {
    try {
      await this.operationLogRepo.query(`
        CREATE TABLE IF NOT EXISTS user_operation_logs (
          id INT NOT NULL AUTO_INCREMENT,
          user_id BIGINT NOT NULL,
          method VARCHAR(20) NOT NULL,
          path VARCHAR(500) NOT NULL,
          action VARCHAR(100) NULL,
          ip_address VARCHAR(45) NULL,
          user_agent VARCHAR(500) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_user_operation_logs_user_created (user_id, created_at),
          CONSTRAINT fk_user_operation_logs_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (error) {
      this.logger.warn(`ensure operation log table failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
