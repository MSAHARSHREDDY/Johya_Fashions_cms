import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Setting from '../models/Setting.js';

const router = Router();

const DEFAULT_SETTINGS = {
  minAmount: 1000,
  basePoints: 50,
  incrementAmount: 500,
  pointsPerIncrement: 50,
};

// GET current point settings
router.get('/points', async (_req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    // Return default settings if DB disconnected
    return res.json({ success: true, data: DEFAULT_SETTINGS });
  }

  try {
    let setting = await Setting.findOne({ key: 'point_settings' });
    if (!setting) {
      setting = await Setting.create({
        key: 'point_settings',
        ...DEFAULT_SETTINGS,
      });
    }

    res.json({
      success: true,
      data: {
        minAmount: setting.minAmount,
        basePoints: setting.basePoints ?? setting.pointsPerIncrement ?? 50,
        incrementAmount: setting.incrementAmount,
        pointsPerIncrement: setting.pointsPerIncrement,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      data: DEFAULT_SETTINGS,
      error: error.message,
    });
  }
});

// UPDATE point settings
router.put('/points', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }

  try {
    const { minAmount, basePoints, incrementAmount, pointsPerIncrement } = req.body;

    const parsedMin = Math.max(0, Number(minAmount) || 0);
    const parsedStep = Math.max(1, Number(incrementAmount) || 1);
    const parsedPointsPerStep = Math.max(0, Number(pointsPerIncrement) || 0);
    const parsedBasePoints = basePoints !== undefined ? Math.max(0, Number(basePoints) || 0) : parsedPointsPerStep;

    const setting = await Setting.findOneAndUpdate(
      { key: 'point_settings' },
      {
        minAmount: parsedMin,
        basePoints: parsedBasePoints,
        incrementAmount: parsedStep,
        pointsPerIncrement: parsedPointsPerStep,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Point settings updated successfully',
      data: {
        minAmount: setting.minAmount,
        basePoints: setting.basePoints,
        incrementAmount: setting.incrementAmount,
        pointsPerIncrement: setting.pointsPerIncrement,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
});

export default router;
