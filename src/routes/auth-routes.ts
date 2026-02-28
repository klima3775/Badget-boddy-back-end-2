import express from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe, refresh } from '../controllers/auth-controllers.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('monobankToken').notEmpty().withMessage('Monobank token is required'),
  ],
  register,
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  login,
);
router.get('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

export default router;
