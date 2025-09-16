/**
 * Refresh Token 实体类
 * 用于存储和管理用户的刷新令牌，实现无缝的token续期功能
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  /** 
   * 主键ID 
   * 自增长的唯一标识符
   */
  @PrimaryGeneratedColumn()
  id: number;

  /** 
   * 用户ID 
   * 外键，关联到users表的id字段
   */
  @Column({ name: 'user_id' })
  userId: number;

  /** 
   * Refresh Token 值 
   * 唯一的刷新令牌字符串，用于换取新的access token
   */
  @Column({ unique: true, length: 255 })
  token: string;

  /** 
   * 过期时间 
   * Refresh token的过期时间戳
   */
  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  /** 
   * 创建时间 
   * 记录refresh token创建的时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 是否已撤销 
   * 标识refresh token是否已被撤销或失效
   */
  @Column({ name: 'is_revoked', type: 'tinyint', default: 0 })
  isRevoked: boolean;

  /** 
   * 设备信息 
   * 可选字段，用于记录token关联的设备信息
   */
  @Column({ name: 'device_info', type: 'varchar', length: 500, nullable: true })
  deviceInfo?: string;

  /** 
   * IP地址 
   * 记录token创建时的IP地址，用于安全审计
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  /** 
   * 多对一关系：用户 
   * 关联到refresh token所属的用户
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}