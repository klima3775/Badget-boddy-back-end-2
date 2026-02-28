import crypto from 'crypto';

const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY as string, 'hex');
const iv = Buffer.from(process.env.TOKEN_ENCRYPTION_IV as string, 'hex');

export function encryptToken(token: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptToken(encryptedToken: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
