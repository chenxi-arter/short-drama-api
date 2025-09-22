import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { TelegramAuthService } from '../telegram-auth.service';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  constructor(
    private configService: ConfigService,
    private telegramAuthService: TelegramAuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super();
  }

  async validate(req: any): Promise<any> {
    const initData = req.body?.initData || req.headers['x-telegram-init-data'];
    
    if (!initData) {
      throw new UnauthorizedException('缺少Telegram初始化数据');
    }

    // 验证Telegram Web App数据
    const userData = this.telegramAuthService.verifyInitData(initData);
    
    if (!userData) {
      throw new UnauthorizedException('Telegram数据验证失败');
    }

    // 查找或创建用户
    let user = await this.userRepository.findOne({
      where: { id: userData.id }
    });

    if (!user) {
      // 创建新用户
      user = this.userRepository.create({
        id: userData.id,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username || `user_${userData.id}`,
        is_active: true,
      });
      await this.userRepository.save(user);
    } else {
      // 更新用户信息
      user.first_name = userData.first_name || user.first_name;
      user.last_name = userData.last_name || user.last_name;
      user.username = userData.username || user.username;
      
      // 如果短ID为空，生成新的短ID
      if (!user.shortId) {
        const { ShortIdUtil } = await import('../../shared/utils/short-id.util');
        user.shortId = ShortIdUtil.generate();
      }
      
      await this.userRepository.save(user);
    }

    return user;
  }
}
