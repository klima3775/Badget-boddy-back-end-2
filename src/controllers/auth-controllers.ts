import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';

const ACCESS_TOKEN_EXP = process.env.JWT_ACCESS_TIME || '40m';
const REFRESH_DAYS = Number(process.env.JWT_REFRESH_DAYS || 7);
const REFRESH_TOKEN_EXP = `${REFRESH_DAYS}d`;
const REFRESH_TOKEN_REDIS_EXP = REFRESH_DAYS * 24 * 60 * 60;

const generateAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXP as jwt.SignOptions['expiresIn'],
  });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXP as jwt.SignOptions['expiresIn'],
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, monobankToken } = req.body;

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ message: 'Користувач з таким email вже існує' });
      return;
    }
    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user in Postgres (Prisma)
    // Note: encryptToken is currently skipped, or add import for your utility
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        monobankToken: monobankToken,
      },
    });

    const userId = newUser.id;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_REDIS_EXP);

    // 7. Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 40 * 60 * 1000, // 40 хв
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
    });

    // TODO: Тут буде логіка Monobank (fetchClientInfo)
    // const clientInfo = await fetchClientInfo(userId);
    // await saveClientInfoToRedis(userId, clientInfo);

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
      res.status(400).json({ message: 'Невірний логін або пароль' });
      return;
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Невірний логін або пароль' });
      return;
    }

    // 3. Generate tokens
    const userId = user.id;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // 4. Update Refresh Token in Redis
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_REDIS_EXP);

    // TODO: Update Monobank info
    // const clientInfo = await fetchClientInfo(userId);
    // await saveClientInfoToRedis(userId, clientInfo);

    // 5. Cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 40 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ userId, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// === LOGOUT===
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  // Можна також видалити токен з Redis, якщо ми знаємо userId з мідлвари
  // await redis.del(`refresh_token:${req.user.id}`);

  res.json({ message: 'Logged out successfully' });
};
