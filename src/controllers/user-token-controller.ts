import { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const updateMonobankToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { monobankToken: token },
    });

    res.status(200).json({ message: 'Token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating token' });
  }
};
