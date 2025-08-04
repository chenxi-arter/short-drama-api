// src/video/category.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './services/category.service';
import { CategoryListDto, CategoryListResponse } from './dto/category-list.dto';

/**
 * 分类控制器
 * 处理分类相关的API请求
 */
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 获取分类列表
   * @param dto 请求参数
   * @returns 分类列表响应
   */
  @Get('list')
  async getCategoryList(@Query() dto: CategoryListDto) {
    return this.categoryService.getCategoryList(dto.versionNo);
  }
}