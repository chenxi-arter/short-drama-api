/**
 * Ingest 结果类型定义
 * 用于标准化数据导入接口（/api/admin/ingest 等）的返回数据结构：
 * - IngestItem: 单条结果（成功或失败），包含状态码/标识/错误详情
 * - IngestSummary: 汇总统计（created/updated/failed/total）
 * - IngestResponseData: summary + items 的统一响应载荷
 *
 * 使用位置：
 * - 控制器：统一声明方法返回值类型，便于编译期校验
 * - 拦截器：包装单条/批量处理结果为统一结构
 */
export type IngestAction = 'created' | 'updated';

export interface IngestItemSuccess {
  statusCode: number; // 200
  seriesId: number;
  shortId: string | null;
  externalId: string | null;
  action: IngestAction;
  title?: string;
}

export interface IngestItemError {
  statusCode: number; // 4xx
  error: string;
  details?: any;
  externalId?: string | null;
  title?: string;
}

export type IngestItem = IngestItemSuccess | IngestItemError;

export interface IngestSummary {
  created: number;
  updated: number;
  failed: number;
  total: number;
}

export interface IngestResponseData {
  summary: IngestSummary;
  items: IngestItem[];
}

