import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entity/episode.entity';
import { CommentService } from './comment.service';

export type EpisodeReactionType = 'like' | 'dislike' | 'favorite';

@Injectable()
export class EpisodeInteractionService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    private readonly commentService: CommentService,
  ) {}

  async increment(episodeId: number, type: EpisodeReactionType): Promise<void> {
    switch (type) {
      case 'like':
        await this.episodeRepo.increment({ id: episodeId }, 'likeCount', 1);
        break;
      case 'dislike':
        await this.episodeRepo.increment({ id: episodeId }, 'dislikeCount', 1);
        break;
      case 'favorite':
        await this.episodeRepo.increment({ id: episodeId }, 'favoriteCount', 1);
        break;
      default:
        throw new Error('Unsupported reaction type');
    }
  }

  // === 评论回复功能（盖楼） ===
  
  async addReply(
    userId: number,
    episodeShortId: string,
    parentId: number,
    content: string,
  ) {
    return this.commentService.addReply(userId, episodeShortId, parentId, content);
  }

  async getCommentReplies(
    commentId: number,
    page: number,
    size: number,
  ) {
    return this.commentService.getCommentReplies(commentId, page, size);
  }
}


