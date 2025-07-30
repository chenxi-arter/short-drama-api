import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Refresh Token DTO
 * 用于验证refresh token相关请求的数据传输对象
 */
export class RefreshTokenDto {
  /**
   * Refresh Token 值
   * 用于刷新access token的令牌字符串
   */
  @IsString({ message: 'refresh_token 必须是字符串' })
  @IsNotEmpty({ message: 'refresh_token 不能为空' })
  refresh_token: string;
}

/**
 * 登录响应 DTO
 * 包含access token和refresh token的响应格式
 */
export class LoginResponseDto {
  /**
   * 访问令牌
   * 短期有效的JWT token
   */
  access_token: string;

  /**
   * 刷新令牌
   * 长期有效的refresh token
   */
  refresh_token: string;

  /**
   * 过期时间（秒）
   * access token的有效期
   */
  expires_in: number;

  /**
   * 令牌类型
   * 通常为 "Bearer"
   */
  token_type: string;
}

/**
 * Token 刷新响应 DTO
 * 刷新token时的响应格式
 */
export class RefreshResponseDto {
  /**
   * 新的访问令牌
   */
  access_token: string;

  /**
   * 过期时间（秒）
   */
  expires_in: number;

  /**
   * 令牌类型
   */
  token_type: string;
}