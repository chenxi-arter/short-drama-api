import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 增强的字符串长度验证
 * 支持中文字符按2个字符计算
 */
@ValidatorConstraint({ name: 'enhancedStringLength', async: false })
export class EnhancedStringLengthConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    const [min, max] = args.constraints;
    const length = this.getStringLength(value);
    
    return length >= min && length <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const [min, max] = args.constraints;
    return `字符长度必须在 ${min} 到 ${max} 之间（中文字符按2个字符计算）`;
  }

  private getStringLength(str: string): number {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      // 中文字符范围
      if ((char >= 0x4e00 && char <= 0x9fff) || 
          (char >= 0x3400 && char <= 0x4dbf) || 
          (char >= 0x20000 && char <= 0x2a6df)) {
        length += 2;
      } else {
        length += 1;
      }
    }
    return length;
  }
}

export function EnhancedStringLength(min: number, max: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: EnhancedStringLengthConstraint,
    });
  };
}

/**
 * 视频URL验证
 */
@ValidatorConstraint({ name: 'videoUrl', async: false })
export class VideoUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    // 检查是否为有效的URL格式
    try {
      const url = new URL(value);
      
      // 检查协议
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }

      // 检查文件扩展名
      const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m3u8'];
      const pathname = url.pathname.toLowerCase();
      
      return allowedExtensions.some(ext => pathname.endsWith(ext)) || pathname.includes('.m3u8');
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return '必须是有效的视频URL地址';
  }
}

export function IsVideoUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: VideoUrlConstraint,
    });
  };
}

/**
 * 图片URL验证
 */
@ValidatorConstraint({ name: 'imageUrl', async: false })
export class ImageUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      const url = new URL(value);
      
      // 检查协议
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }

      // 检查文件扩展名
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const pathname = url.pathname.toLowerCase();
      
      return allowedExtensions.some(ext => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return '必须是有效的图片URL地址';
  }
}

export function IsImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ImageUrlConstraint,
    });
  };
}

/**
 * 手机号验证（支持中国大陆）
 */
@ValidatorConstraint({ name: 'chinesePhoneNumber', async: false })
export class ChinesePhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    // 中国大陆手机号正则表达式
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return '请输入有效的中国大陆手机号码';
  }
}

export function IsChinesePhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ChinesePhoneNumberConstraint,
    });
  };
}

/**
 * 密码强度验证
 */
@ValidatorConstraint({ name: 'strongPassword', async: false })
export class StrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    const [minLength = 8] = args.constraints;
    
    // 至少包含一个数字、一个小写字母、一个大写字母或特殊字符
    const hasNumber = /\d/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasUpperCaseOrSpecial = /[A-Z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    
    return value.length >= minLength && hasNumber && hasLowerCase && hasUpperCaseOrSpecial;
  }

  defaultMessage(args: ValidationArguments) {
    const [minLength = 8] = args.constraints;
    return `密码必须至少${minLength}位，且包含数字、小写字母和大写字母或特殊字符`;
  }
}

export function IsStrongPassword(minLength: number = 8, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minLength],
      validator: StrongPasswordConstraint,
    });
  };
}

/**
 * 数组长度验证
 */
@ValidatorConstraint({ name: 'arrayLength', async: false })
export class ArrayLengthConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!Array.isArray(value)) {
      return false;
    }

    const [min, max] = args.constraints;
    return value.length >= min && value.length <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const [min, max] = args.constraints;
    return `数组长度必须在 ${min} 到 ${max} 之间`;
  }
}

export function ArrayLength(min: number, max: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: ArrayLengthConstraint,
    });
  };
}

/**
 * 数值范围验证（支持小数）
 */
@ValidatorConstraint({ name: 'numberRange', async: false })
export class NumberRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'number' || isNaN(value)) {
      return false;
    }

    const [min, max] = args.constraints;
    return value >= min && value <= max;
  }

  defaultMessage(args: ValidationArguments) {
    const [min, max] = args.constraints;
    return `数值必须在 ${min} 到 ${max} 之间`;
  }
}

export function NumberRange(min: number, max: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: NumberRangeConstraint,
    });
  };
}