import { Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';
import { HomeVideosDto } from './dto/home-videos.dto';

/**
 * 模块控制器基类
 * 提供通用的视频模块API接口
 */
export abstract class BaseModuleController {
  constructor(protected readonly videoService: VideoService) {}

  /**
   * 获取模块的默认频道ID
   */
  protected abstract getDefaultChannelId(): number;

  /**
   * 获取模块视频列表的服务方法名
   */
  protected abstract getModuleVideosMethod(): (channeid: number, page: number) => Promise<any>;

  /**
   * 获取模块首页视频列表
   * @param dto 请求参数
   * @returns 模块首页视频列表数据
   */
  @Get('gethomemodules')
  async getHomeVideos(@Query() dto: HomeVideosDto): Promise<any> {
    // 如果没有传入channeid参数，返回提示信息
    if (dto.channeid === undefined || dto.channeid === null) {
      return {
        data: null,
        code: 400,
        msg: '请选择具体的频道分类，不支持显示全部分类'
      };
    }
    
    const method = this.getModuleVideosMethod();
    return await method.call(this.videoService, dto.channeid, dto.page || 1);
  }

  /**
   * 获取模块筛选器标签
   * @param channeid 频道ID
   * @returns 筛选器标签列表
   */
  @Get('getfilterstags')
  async getFiltersTags(@Query('channeid') channeid: string) {
    return this.videoService.getFiltersTags(channeid || this.getDefaultChannelId().toString());
  }

  /**
   * 获取模块筛选器列表数据
   * @param channeid 频道ID
   * @param ids 筛选条件ID
   * @param page 页码
   * @returns 筛选后的模块列表
   */
  @Get('getfiltersdata')
  async getFiltersData(
    @Query('channeid') channeid: string,
    @Query('ids') ids: string,
    @Query('page') page: string
  ) {
    return this.videoService.getFiltersData(
      channeid || this.getDefaultChannelId().toString(),
      ids || '0,0,0,0,0',
      page || '1'
    );
  }
}