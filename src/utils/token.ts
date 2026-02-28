import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXP = process.env.JWT_ACCESS_TIME || '40m';
const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS || 7);
const REFRESH_TOKEN_EXP = `${REFRESH_DAYS}d`;

export const REFRESH_TOKEN_REDIS_EXP = REFRESH_DAYS * 24 * 60 * 60;

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXP as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXP as jwt.SignOptions['expiresIn'],
  });
};
