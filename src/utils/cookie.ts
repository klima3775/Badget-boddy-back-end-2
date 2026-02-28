import { Response } from 'express';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshDays: number,
): void => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: 40 * 60 * 1000, // 40 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: refreshDays * 24 * 60 * 60 * 1000,
  });
};
