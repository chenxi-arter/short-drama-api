/**
 * 安全相关环境变量的统一校验
 *
 * 背景（安全审计 XG-01 / XG-03）：
 * 历史版本里 JWT_SECRET=very-secret-key、APP_SECRET 未配置时回退 'default_secret'，
 * 使任意人可离线伪造 token / 枚举播放地址。这里把「弱密钥、缺密钥」变成启动即失败，
 * 而不是运行期静默降级。
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('SecurityEnv');

/** 已知弱密钥（历史泄露值或常见占位值），命中即拒绝 */
const WEAK_SECRETS = new Set([
  'very-secret-key',
  'default_secret',
  'default-secret',
  'secret',
  'changeme',
  'change-me',
  'password',
  'your-secret-key',
  'your_jwt_secret',
  'your_secret',
]);

/** 短密钥（可枚举）直接拒绝，48 位 base64 约 64 字符 */
const MIN_SECRET_LENGTH = 16;

/**
 * 占位值形态（照抄 .env.example / 文档模板就会命中）
 *
 * 只做长度和弱值清单校验是不够的：`your_jwt_secret_key_here_at_least_32_characters`
 * 长度 49、不在弱值清单里，会被放行 —— 等于用了一个公开可猜的密钥。
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^your[_-]/i, // your_jwt_secret_key_here
  /[_-]here$/i, // xxx_key_here
  /change[_-]?(me|in[_-]?production)/i, // changeme / change_in_production
  /placeholder/i,
  /^x{8,}$/i, // xxxxxxxx
  /^example/i,
];

/** 全是同一个字符（aaaa…、1111…）也属于可猜值 */
function isRepeatedChar(value: string): boolean {
  return value.length > 0 && new Set(value).size === 1;
}

function isPlaceholder(value: string): boolean {
  if (isRepeatedChar(value)) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}

function normalize(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  return value.length > 0 ? value : undefined;
}

/**
 * 读取并强制校验一个高熵密钥，缺失/弱值/过短都会抛错（用于启动阶段 fail-fast）
 */
export function assertStrongSecret(name: string, rawValue?: string): string {
  const fallback = rawValue === undefined ? process.env[name] : rawValue;
  const value = normalize(fallback);

  if (!value) {
    throw new Error(
      `[安全配置] 缺少环境变量 ${name}。请参考 .env.example 配置；` +
        `可用 \`openssl rand -base64 48\` 生成高熵随机值。`,
    );
  }
  if (WEAK_SECRETS.has(value.toLowerCase())) {
    throw new Error(
      `[安全配置] ${name} 仍是已知弱密钥（历史泄露值），请立即轮换为高熵随机值。`,
    );
  }
  if (isPlaceholder(value)) {
    throw new Error(
      `[安全配置] ${name} 看起来仍是占位值（如 your_xxx_here / changeme），` +
        `请用 \`openssl rand -base64 48\` 生成真实密钥。`,
    );
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[安全配置] ${name} 长度不足 ${MIN_SECRET_LENGTH} 位，请使用高熵随机值。`,
    );
  }
  return value;
}

/**
 * 读取一个可选的过渡期旧密钥
 * 只认显式配置的环境变量，代码里不再有任何默认值（否则后门永久存在）
 */
export function optionalSecret(name: string, rawValue?: string): string | undefined {
  const fallback = rawValue === undefined ? process.env[name] : rawValue;
  const value = normalize(fallback);
  if (!value) return undefined;

  logger.warn(
    `[安全配置] 检测到过渡期旧密钥 ${name}，旧 token 仍会被接受。` +
      `迁移完成后请从环境变量中删除该配置。`,
  );
  return value;
}

export type ServiceRole = 'client' | 'admin' | 'all';

/**
 * 进程启动前调用：三个密钥缺一不可
 * - JWT_SECRET：用户 token，两个进程都会用到
 * - ADMIN_JWT_SECRET：管理员 token，client-api 的 admin 写接口同样需要校验
 * - APP_SECRET：派生播放访问密钥（防枚举）
 */
export function validateSecurityEnv(): void {
  assertStrongSecret('JWT_SECRET');
  assertStrongSecret('ADMIN_JWT_SECRET');
  assertStrongSecret('APP_SECRET');
}
