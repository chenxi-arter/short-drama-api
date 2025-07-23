import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';        // ✅ 新增
import { User } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';             // ✅ 新增

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,                                       // ✅ 新增
    JwtModule.register({}),                               // 保持动态读取
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],                  // ✅ 新增 JwtStrategy
  exports: [UserService], // ✅ 必须导出，否则其他模块无法使用
})
export class UserModule {}
