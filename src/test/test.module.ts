// src/test/test.module.ts
import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module'; // ✅ 必须导入 UserModule

@Module({
  imports: [AuthModule, UserModule], // ✅ 关键：导入 UserModule
  controllers: [TestController],
})
export class TestModule {}