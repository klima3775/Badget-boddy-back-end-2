import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import { encryptToken } from '../utils/encryption.js';
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_REDIS_EXP,
} from '../utils/token.js';
import { setAuthCookies } from '../utils/cookie.js';

const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS || 7);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, monobankToken } = req.body;

    // 2. Validate monobankToken
    if (!monobankToken) {
      res.status(400).json({ message: 'Monobank token is required' });
      return;
    }

    // 3. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ message: 'Користувач з таким email вже існує' });
      return;
    }
    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Encrypt Monobank token
    const encryptedMonobankToken = encryptToken(monobankToken);

    // 6. Create user in Postgres (Prisma)
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        monobankToken: encryptedMonobankToken,
      },
    });

    const userId = newUser.id;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_REDIS_EXP);

    setAuthCookies(res, accessToken, refreshToken, REFRESH_DAYS);

    res.status(201).json({ userId, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // 1. Find user (Prisma)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(400).json({ message: 'user not found' });
      return;
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    // 3. Generate tokens
    const userId = user.id;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // 4. Update Refresh Token in Redis
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_REDIS_EXP);

    setAuthCookies(res, accessToken, refreshToken, REFRESH_DAYS);

    res.json({ userId, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// === LOGOUT===
export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.accessToken;

  if (token) {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload & { id: string };
      if (decoded?.id) {
        await redis.del(`refresh_token:${decoded.id}`);
      }
    } catch (_) {}
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        monobankToken: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'Користувача не знайдено' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }

    // 1. Verify refresh token signature
    let userData: jwt.JwtPayload & { id: string };
    try {
      userData = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      ) as jwt.JwtPayload & { id: string };
    } catch {
      res.status(401).json({ message: 'Refresh token expired or invalid' });
      return;
    }

    // 2. Check if token exists in Redis
    const storedToken = await redis.get(`refresh_token:${userData.id}`);
    if (!storedToken || storedToken !== refreshToken) {
      res.status(403).json({ message: 'Refresh token revoked' });
      return;
    }

    // 3. Generate new access + refresh tokens (rotation)
    const newAccessToken = generateAccessToken(userData.id);
    const newRefreshToken = generateRefreshToken(userData.id);

    // 4. Save new refresh token in Redis
    await redis.set(`refresh_token:${userData.id}`, newRefreshToken, 'EX', REFRESH_TOKEN_REDIS_EXP);

    setAuthCookies(res, newAccessToken, newRefreshToken, REFRESH_DAYS);

    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};
