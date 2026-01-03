import { randomUUID } from 'crypto';
import * as path from 'path';

const generateRandomCode = (length = 6) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateFileName = (originalFileName: string) => {
  const fileExtension = path.extname(originalFileName) || '';
  const dateStr = Date.now().toString();
  const randomCode = generateRandomCode();
  return `${dateStr}-${randomCode}-${randomUUID()}${fileExtension}`;
};
