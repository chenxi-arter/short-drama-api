import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { BaseController } from '../controllers/base.controller';
import { EpisodeInteractionService, EpisodeReactionType } from '../services/episode-interaction.service';
import { EpisodeService } from '../services/episode.service';

// 保留类型声明以供内部复用

class EpisodeActivityDto {
  shortId: string; // episode short id
  type: 'play' | EpisodeReactionType; // 'play' | 'like' | 'dislike' | 'favorite'
}

@Controller('video/episode')
export class InteractionController extends BaseController {
  constructor(
    private readonly interactionService: EpisodeInteractionService,
    private readonly episodeService: EpisodeService,
  ) { super(); }

  // 合并接口：通过短ID提交单一动作（播放或互动）
  // Body: { shortId: string, type: 'play' | 'like' | 'dislike' | 'favorite' }
  @Post('activity')
  async activity(
    @Body() body: EpisodeActivityDto
  ) {
    const shortId = body?.shortId?.trim();
    if (!shortId) throw new BadRequestException('shortId 必填');

    const episode = await this.episodeService.getEpisodeByShortId(shortId);
    if (!episode) return this.error('剧集不存在', 404);

    const type = body?.type;
    if (!type) return this.error('type 必填', 400);

    if (type === 'play') {
      await this.episodeService.incrementPlayCount(episode.id);
      return this.success({ episodeId: episode.id, shortId, type: 'play' }, '已更新');
    }

    if (!['like','dislike','favorite'].includes(type)) {
      return this.error('type 必须是 play|like|dislike|favorite', 400);
    }

    await this.interactionService.increment(episode.id, type);
    return this.success({ episodeId: episode.id, shortId, type }, '已更新');
  }
}


