import { Router } from 'express';
import { body } from 'express-validator';
import authMiddleware from '../middleware/auth-middleware.js';
import { updateMonobankToken } from '../controllers/user-token-controller.js';

const router = Router();

router.put(
  '/monobank-token',
  authMiddleware,
  body('token').notEmpty().withMessage('Token is required'),
  updateMonobankToken,
);

export default router;
