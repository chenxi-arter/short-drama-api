import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { Banner } from '../entity/banner.entity';
import { CreateBannerDto, UpdateBannerDto, BannerQueryDto, BannerResponseDto } from '../dto/banner.dto';
import { BannerItem } from '../dto/home-videos.dto';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  /**
   * 创建轮播图
   */
  async createBanner(createBannerDto: CreateBannerDto): Promise<BannerResponseDto> {
    // 验证开始时间和结束时间
    if (createBannerDto.startTime && createBannerDto.endTime) {
      const startTime = new Date(createBannerDto.startTime);
      const endTime = new Date(createBannerDto.endTime);
      if (startTime >= endTime) {
        throw new BadRequestException('开始时间必须早于结束时间');
      }
    }

    const banner = this.bannerRepo.create({
      ...createBannerDto,
      startTime: createBannerDto.startTime ? new Date(createBannerDto.startTime) : undefined,
      endTime: createBannerDto.endTime ? new Date(createBannerDto.endTime) : undefined,
    });

    const savedBanner = await this.bannerRepo.save(banner);
    return this.formatBannerResponse(savedBanner);
  }

  /**
   * 更新轮播图
   */
  async updateBanner(id: number, updateBannerDto: UpdateBannerDto): Promise<BannerResponseDto> {
    const banner = await this.bannerRepo.findOne({
      where: { id },
      relations: ['category', 'series'],
    });

    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    // 验证开始时间和结束时间
    if (updateBannerDto.startTime && updateBannerDto.endTime) {
      const startTime = new Date(updateBannerDto.startTime);
      const endTime = new Date(updateBannerDto.endTime);
      if (startTime >= endTime) {
        throw new BadRequestException('开始时间必须早于结束时间');
      }
    }

    Object.assign(banner, {
      ...updateBannerDto,
      startTime: updateBannerDto.startTime ? new Date(updateBannerDto.startTime) : banner.startTime,
      endTime: updateBannerDto.endTime ? new Date(updateBannerDto.endTime) : banner.endTime,
    });

    const savedBanner = await this.bannerRepo.save(banner);
    return this.formatBannerResponse(savedBanner);
  }

  /**
   * 删除轮播图
   */
  async deleteBanner(id: number): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    await this.bannerRepo.remove(banner);
  }

  /**
   * 获取轮播图详情
   */
  async getBannerById(id: number): Promise<BannerResponseDto> {
    const banner = await this.bannerRepo.findOne({
      where: { id },
      relations: ['category', 'series'],
    });

    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    return this.formatBannerResponse(banner);
  }

  /**
   * 获取轮播图列表
   */
  async getBanners(queryDto: BannerQueryDto): Promise<{
    data: BannerResponseDto[];
    total: number;
    page: number;
    size: number;
  }> {
    const { categoryId, isActive, page = 1, size = 10 } = queryDto;
    const skip = (page - 1) * size;

    const whereConditions: any = {};
    
    if (categoryId !== undefined) {
      whereConditions.categoryId = categoryId;
    }
    
    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    const [banners, total] = await this.bannerRepo.findAndCount({
      where: whereConditions,
      relations: ['category', 'series'],
      order: {
        weight: 'DESC',
        createdAt: 'DESC',
      },
      skip,
      take: size,
    });

    return {
      data: banners.map(banner => this.formatBannerResponse(banner)),
      total,
      page,
      size,
    };
  }

  /**
   * 获取活跃的轮播图（用于首页展示）
   */
  async getActiveBanners(categoryId?: number, limit: number = 5): Promise<BannerItem[]> {
    const now = new Date();
    const whereConditions: any = {
      isActive: true,
    };

    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }

    // 添加时间范围条件
    const queryBuilder = this.bannerRepo.createQueryBuilder('banner')
      .leftJoinAndSelect('banner.category', 'category')
      .leftJoinAndSelect('banner.series', 'series')
      .where('banner.isActive = :isActive', { isActive: true })
      .andWhere('(banner.startTime IS NULL OR banner.startTime <= :now)', { now })
      .andWhere('(banner.endTime IS NULL OR banner.endTime >= :now)', { now });

    if (categoryId) {
      queryBuilder.andWhere('banner.categoryId = :categoryId', { categoryId });
    }

    const banners = await queryBuilder
      .orderBy('banner.weight', 'DESC')
      .addOrderBy('banner.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return banners.map(banner => ({
      showURL: banner.imageUrl,
      title: banner.title,
      id: banner.seriesId || banner.id,
      uuid: banner.series?.uuid,
      channeID: banner.categoryId,
      url: banner.linkUrl || (banner.seriesId ? banner.seriesId.toString() : banner.id.toString()),
    }));
  }

  /**
   * 批量更新轮播图权重
   */
  async updateBannerWeights(updates: { id: number; weight: number }[]): Promise<void> {
    const updatePromises = updates.map(({ id, weight }) =>
      this.bannerRepo.update(id, { weight })
    );
    
    await Promise.all(updatePromises);
  }

  /**
   * 启用/禁用轮播图
   */
  async toggleBannerStatus(id: number, isActive: boolean): Promise<BannerResponseDto> {
    const banner = await this.bannerRepo.findOne({
      where: { id },
      relations: ['category', 'series'],
    });

    if (!banner) {
      throw new NotFoundException('轮播图不存在');
    }

    banner.isActive = isActive;
    const savedBanner = await this.bannerRepo.save(banner);
    return this.formatBannerResponse(savedBanner);
  }

  /**
   * 格式化轮播图响应数据
   */
  private formatBannerResponse(banner: Banner): BannerResponseDto {
    return {
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      seriesId: banner.seriesId,
      categoryId: banner.categoryId,
      linkUrl: banner.linkUrl,
      weight: banner.weight,
      isActive: banner.isActive,
      startTime: banner.startTime,
      endTime: banner.endTime,
      description: banner.description,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
      category: banner.category ? {
        id: banner.category.id,
        name: banner.category.name,
      } : undefined,
      series: banner.series ? {
        id: banner.series.id,
        title: banner.series.title,
        uuid: banner.series.uuid,
      } : undefined,
    };
  }
}