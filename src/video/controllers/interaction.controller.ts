import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { BaseController } from '../controllers/base.controller';
import { EpisodeInteractionService, EpisodeReactionType } from '../services/episode-interaction.service';

class EpisodeReactionDto {
  type: EpisodeReactionType; // 'like' | 'dislike' | 'favorite'
}

@Controller('video/episode')
export class InteractionController extends BaseController {
  constructor(private readonly interactionService: EpisodeInteractionService) { super(); }

  @Post(':id/reaction')
  async react(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: EpisodeReactionDto
  ) {
    if (!dto?.type || !['like','dislike','favorite'].includes(dto.type)) {
      return this.error('type必须是 like|dislike|favorite', 400);
    }
    await this.interactionService.increment(id, dto.type);
    return this.success({ id, type: dto.type }, '更新成功');
  }
}


