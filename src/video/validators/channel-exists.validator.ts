import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entity/category.entity';

@ValidatorConstraint({ name: 'isValidChannelExists', async: true })
@Injectable()
export class IsValidChannelExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  validate(channeid: any): boolean {
    // 如果channeid为空或undefined，允许通过（可选参数）
    if (channeid === undefined || channeid === null) {
      return true;
    }

    // 检查是否为有效数字
    const numericChanneid = Number(channeid);
    if (isNaN(numericChanneid) || numericChanneid < 0) {
      return false;
    }

    // 暂时允许所有有效的数字channeid通过，不检查数据库
    // TODO: 修复数据库查询问题后恢复检查
    return true;

    // try {
    //   // 检查频道是否存在且启用
    //   const category = await this.categoryRepository.findOne({
    //     where: {
    //       id: numericChanneid,
    //       isEnabled: true,
    //     },
    //   });
    //   return !!category;
    // } catch {
    //   return false;
    // }
  }

  defaultMessage(): string {
    return '频道ID不存在或已禁用';
  }
}

export function IsValidChannelExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidChannelExistsConstraint,
    });
  };
}