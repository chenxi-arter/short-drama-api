/**
 * 用户实体类
 * 存储系统用户的基本信息
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BeforeInsert } from 'typeorm';
import { Comment } from '../../video/entity/comment.entity';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
// import { BrowseHistory } from '../../video/entity/browse-history.entity';
import { ShortIdUtil } from '../../shared/utils/short-id.util';

@Entity('users')
export class User {
  /** 
   * 用户主键ID 
   * 使用自增ID，统一标识用户
   */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  /** 
   * 邮箱地址
   * 用于账号密码登录，可为空
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  /** 
   * 密码哈希
   * 存储加密后的密码，用于账号密码登录
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string;

  /** 
   * Telegram用户ID
   * 用于Telegram登录，可为空
   */
  @Column({ type: 'bigint', unique: true, nullable: true })
  telegram_id: number;

  /** 
   * 短ID标识符（防枚举攻击）
   * 用于外部API访问的安全标识符，11位类似base64编码
   */
  @Column({ type: 'varchar', length: 11, unique: true, nullable: true, name: 'short_id' })
  shortId: string;

  /** 
   * 用户名字 
   * 用户的名字
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name: string;

  /** 
   * 用户姓氏 
   * 用户的姓氏
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name: string;

  /** 
   * 用户名 
   * 用户的唯一标识符，用于登录
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  username: string;

  /** 
   * 昵称 
   * 用户的显示昵称，可重复
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string;

  /** 
   * Telegram头像URL 
   * 用户的Telegram头像链接
   */
  @Column({ type: 'text', nullable: true })
  photo_url: string | null;

  /** 
   * 是否激活 
   * 标识用户账号是否处于激活状态
   */
  @Column({ type: 'tinyint', default: 1 })
  is_active: boolean;

  /** 
   * 是否为游客用户
   * 0=正式用户, 1=游客用户
   */
  @Column({ type: 'tinyint', default: 0, name: 'is_guest' })
  isGuest: boolean;

  /** 
   * 游客唯一标识token
   * 用于前端识别和追踪游客身份，游客转正后此字段保留
   */
  @Column({ type: 'varchar', length: 64, unique: true, nullable: true, name: 'guest_token' })
  guestToken: string;

  /** 
   * 创建时间 
   * 记录用户账号创建的时间戳
   */
  @CreateDateColumn()
  created_at: Date;
  
  /** 
   * 一对多关系：用户评论 
   * 一个用户可以发表多条评论
   */
  @OneToMany(() => Comment, c => c.user) 
  comments: Comment[];
  
  /** 
   * 一对多关系：观看进度 
   * 一个用户可以有多条观看进度记录
   */
  @OneToMany(() => WatchProgress, wp => wp.user) 
  watchProgresses: WatchProgress[];
  
  /** 
   * 一对多关系：浏览记录 
   * 一个用户可以有多条浏览记录
   */
  // @OneToMany(() => BrowseHistory, bh => bh.user) 
  // browseHistories: BrowseHistory[];
  
  /**
   * 在插入前自动生成短ID
   */
  @BeforeInsert()
  generateShortId() {
    if (!this.shortId) {
      this.shortId = ShortIdUtil.generate();
    }
  }
}
