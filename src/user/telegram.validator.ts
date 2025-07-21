import { createHash, createHmac } from 'crypto';
import { TelegramUserDto } from './dto/telegram-user.dto';

export function verifyTelegramHash(
  botToken: string,
  data: TelegramUserDto,
): boolean {
  const { hash, ...userData } = data;
  const checkString = Object.keys(userData)
    .sort()
    .map((k) => `${k}=${userData[k]}`)
    .join('\n');
  const secretKey = createHash('sha256').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');
  return calculatedHash === hash;
}
