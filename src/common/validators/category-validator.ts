import { Injectable } from '@nestjs/common';
import { CategoryService } from '../../video/services/category.service';

/**
 * 分类验证器
 * 提供动态的分类ID验证，不写死分类选项
 */
@Injectable()
export class CategoryValidator {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * 验证分类ID是否有效
   * @param categoryId 分类ID
   * @returns 返回验证结果 { valid: boolean, category?: Category, message?: string }
   */
  async validateCategoryId(categoryId: number): Promise<{
    valid: boolean;
    category?: any;
    message?: string;
  }> {
    // 检查分类是否存在
    const category = await this.categoryService.getCategoryById(categoryId);
    
    if (!category) {
      return {
        valid: false,
        message: `分类ID ${categoryId} 不存在，请使用有效的分类ID`
      };
    }

    // 检查分类是否启用
    if (!category.isEnabled) {
      return {
        valid: false,
        message: `分类"${category.name}"已禁用，无法使用`
      };
    }

    return {
      valid: true,
      category
    };
  }

  /**
   * 获取所有可用的分类选项（用于错误提示）
   * @returns 返回所有启用的分类列表
   */
  async getAvailableCategories(): Promise<Array<{ id: number; name: string; categoryId: string }>> {
    const categories = await this.categoryService.getRawCategories() as any[];
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      categoryId: cat.categoryId
    }));
  }

  /**
   * 格式化可用分类列表为字符串（用于错误提示）
   * @returns 返回格式化的分类列表字符串
   */
  async formatAvailableCategoriesMessage(): Promise<string> {
    const categories = await this.getAvailableCategories();
    if (categories.length === 0) {
      return '当前没有可用的分类';
    }
    const categoryList = categories.map(cat => `${cat.id}-${cat.name}`).join('、');
    return `可用的分类: ${categoryList}`;
  }
}

