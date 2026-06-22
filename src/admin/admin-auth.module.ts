import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h' },
    }),
    TypeOrmModule.forFeature([AdminUser]),
  ],
  providers: [AdminAuthService, AdminJwtAuthGuard],
  exports: [JwtModule, TypeOrmModule, AdminAuthService, AdminJwtAuthGuard],
})
export class AdminAuthModule {}
