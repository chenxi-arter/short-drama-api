/**
 * 用户实体类
 * 存储系统用户的基本信息
 */
import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Comment } from '../../video/entity/comment.entity';
import { WatchProgress } from '../../video/entity/watch-progress.entity';

@Entity('users')
export class User {
  /** 
   * 用户主键ID 
   * 使用大整数类型，可能来自外部系统如Telegram
   */
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  /** 
   * 用户名字 
   * 用户的名字
   */
  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  /** 
   * 用户姓氏 
   * 用户的姓氏
   */
  @Column({ type: 'varchar', length: 255 })
  last_name: string;

  /** 
   * 用户名 
   * 用户的唯一标识符，用于登录
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  /** 
   * 是否激活 
   * 标识用户账号是否处于激活状态
   */
  @Column({ type: 'tinyint', default: 1 })
  is_active: boolean;

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
}
