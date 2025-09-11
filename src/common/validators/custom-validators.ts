import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 验证频道ID格式
 */
export function IsValidChannelId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidChannelId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return /^[1-9]\d*$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是有效的频道ID格式（正整数字符串）`;
        },
      },
    });
  };
}

/**
 * 验证筛选ID组合格式
 */
export function IsValidFilterIds(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidFilterIds',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // 格式：数字,数字,数字,数字,数字
          return /^\d+(,\d+)*$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是有效的筛选ID格式（如：0,1,2,3,4）`;
        },
      },
    });
  };
}

/**
 * 验证媒体类型
 */
export function IsValidMediaType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidMediaType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return ['short', 'series'].includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是有效的媒体类型（short 或 series）`;
        },
      },
    });
  };
}

/**
 * 验证排序类型
 */
export function IsValidSortType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidSortType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return ['latest', 'like', 'play'].includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是有效的排序类型（latest、like 或 play）`;
        },
      },
    });
  };
}

/**
 * 验证Telegram哈希
 */
@ValidatorConstraint({ name: 'isTelegramHash', async: false })
export class IsTelegramHashConstraint implements ValidatorConstraintInterface {
  validate(hash: string, args: ValidationArguments) {
    if (typeof hash !== 'string') return false;
    // Telegram哈希通常是64位十六进制字符串
    return /^[a-f0-9]{64}$/i.test(hash);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} 必须是有效的Telegram验证哈希`;
  }
}

export function IsTelegramHash(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTelegramHashConstraint,
    });
  };
}

/**
 * 验证URL格式
 */
export function IsValidUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是有效的URL格式`;
        },
      },
    });
  };
}

/**
 * 验证评论内容
 */
export function IsValidComment(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidComment',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          // 评论长度限制：1-500字符，不能只包含空白字符
          const trimmed = value.trim();
          return trimmed.length >= 1 && trimmed.length <= 500;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 长度必须在1-500字符之间，且不能只包含空白字符`;
        },
      },
    });
  };
}

/**
 * 验证时间戳（秒）
 */
export function IsValidTimestamp(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTimestamp',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'number') return false;
          // 时间戳应该是正数，且不能超过当前时间太多（允许1小时的时差）
          const now = Math.floor(Date.now() / 1000);
          const oneHour = 3600;
          return value > 0 && value <= now + oneHour;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是有效的时间戳（秒）`;
        },
      },
    });
  };
}