import { createHash, createHmac } from 'crypto';
import { TelegramUserDto } from './dto/telegram-user.dto';

export function verifyTelegramHash(
  botToken: string,
  data: TelegramUserDto,
): boolean {
  const { hash, loginType, deviceInfo, ...userData } = data;
  
  // 忽略loginType和deviceInfo，它们不参与hash验证
  // photo_url现在参与hash验证
  void loginType;
  void deviceInfo;

  // 过滤掉undefined值
  const filteredData = Object.fromEntries(
    Object.entries(userData).filter(([, value]) => value !== undefined),
  );

  const checkString = Object.keys(filteredData)
    .sort()
    .map((k) => `${k}=${filteredData[k]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  return calculatedHash === hash;
}
