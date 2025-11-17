import * as crypto from 'crypto';

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
}

export class CampaignUtils {
  private static readonly PLATFORM_CODES = {
    'tiktok': 'TK',
    'wechat': 'WX',
    'baidu': 'BD',
    'google': 'GG',
    'weibo': 'WB',
    'xiaohongshu': 'XHS',
    'kuaishou': 'KS',
    'other': 'OT'
  };

  /**
   * 生成唯一的投放计划代码
   * @param platform 平台代码
   * @returns 格式: {PLATFORM}_{YYYYMMDD}_{RANDOM}
   */
  static generateCampaignCode(platform: string): string {
    const platformCode = this.PLATFORM_CODES[platform] || 'OT';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    return `${platformCode}_${dateStr}_${randomStr}`;
  }

  /**
   * 从IP地址获取地理位置信息
   * @param ipAddress IP地址
   * @returns 地理位置信息
   */
  static async getLocationFromIp(ipAddress: string): Promise<LocationInfo> {
    try {
      // 使用免费的 ip-api.com 服务
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          country: data.country,
          region: data.regionName,
          city: data.city
        };
      }
    } catch (error) {
      console.error('获取地理位置失败:', error);
    }
    
    return { country: undefined, region: undefined, city: undefined };
  }

  /**
   * 计算转化耗时
   * @param firstClickTime 首次点击时间
   * @param conversionTime 转化时间
   * @returns 耗时（秒）
   */
  static calculateTimeToConversion(firstClickTime: Date, conversionTime: Date): number {
    return Math.floor((conversionTime.getTime() - firstClickTime.getTime()) / 1000);
  }

  /**
   * 计算转化率
   * @param conversions 转化数
   * @param clicks 点击数
   * @returns 转化率（小数）
   */
  static calculateConversionRate(conversions: number, clicks: number): number {
    return clicks > 0 ? conversions / clicks : 0;
  }

  /**
   * 计算CPC（单次点击成本）
   * @param cost 总成本
   * @param clicks 点击数
   * @returns CPC
   */
  static calculateCPC(cost: number, clicks: number): number {
    return clicks > 0 ? cost / clicks : 0;
  }

  /**
   * 计算CPA（单次获客成本）
   * @param cost 总成本
   * @param conversions 转化数
   * @returns CPA
   */
  static calculateCPA(cost: number, conversions: number): number {
    return conversions > 0 ? cost / conversions : 0;
  }
}
