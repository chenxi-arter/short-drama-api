import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvertisingPlatform } from '../entity';
import { CreatePlatformDto, UpdatePlatformDto, UpdatePlatformStatusDto, UpdatePlatformSortDto } from '../dto';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(AdvertisingPlatform)
    private platformRepository: Repository<AdvertisingPlatform>,
  ) {}

  async findAll(enabled?: boolean): Promise<AdvertisingPlatform[]> {
    const queryBuilder = this.platformRepository.createQueryBuilder('platform');
    
    if (enabled !== undefined) {
      queryBuilder.where('platform.isEnabled = :enabled', { enabled });
    }
    
    return queryBuilder
      .orderBy('platform.sortOrder', 'ASC')
      .addOrderBy('platform.createdAt', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<AdvertisingPlatform> {
    const platform = await this.platformRepository.findOne({ where: { id } });
    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }
    return platform;
  }

  async findByCode(code: string): Promise<AdvertisingPlatform> {
    const platform = await this.platformRepository.findOne({ where: { code } });
    if (!platform) {
      throw new NotFoundException(`Platform with code ${code} not found`);
    }
    return platform;
  }

  async create(createPlatformDto: CreatePlatformDto, createdBy?: string): Promise<AdvertisingPlatform> {
    // 检查代码是否已存在
    const existingPlatform = await this.platformRepository.findOne({
      where: { code: createPlatformDto.code }
    });
    
    if (existingPlatform) {
      throw new ConflictException(`Platform with code ${createPlatformDto.code} already exists`);
    }

    const platform = this.platformRepository.create({
      ...createPlatformDto,
      createdBy,
    });

    return this.platformRepository.save(platform);
  }

  async update(id: number, updatePlatformDto: UpdatePlatformDto): Promise<AdvertisingPlatform> {
    const platform = await this.findOne(id);
    
    Object.assign(platform, updatePlatformDto);
    
    return this.platformRepository.save(platform);
  }

  async updateStatus(id: number, updateStatusDto: UpdatePlatformStatusDto): Promise<AdvertisingPlatform> {
    const platform = await this.findOne(id);
    
    platform.isEnabled = updateStatusDto.isEnabled;
    
    return this.platformRepository.save(platform);
  }

  async updateSort(updateSortDto: UpdatePlatformSortDto): Promise<void> {
    const queryRunner = this.platformRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of updateSortDto.platforms) {
        await queryRunner.manager.update(AdvertisingPlatform, item.id, {
          sortOrder: item.sortOrder
        });
      }
      
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    // 检查是否有关联的投放计划
    const platform = await this.platformRepository.findOne({
      where: { id },
      relations: ['campaigns']
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    if (platform.campaigns && platform.campaigns.length > 0) {
      throw new ConflictException('Cannot delete platform with existing campaigns');
    }

    await this.platformRepository.remove(platform);
  }
}
