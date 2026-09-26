import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Setting from '../models/Setting.js';

const router = Router();

export const DEFAULT_SETTINGS = {
  minAmount: 1000,
  basePoints: 50,
  incrementAmount: 1000,
  pointsPerIncrement: 50,
};

// Global in-memory settings cache so updates persist even across DB state transitions
export let inMemorySettings = { ...DEFAULT_SETTINGS };

export async function getActivePointSettings() {
  if (mongoose.connection.readyState === 1) {
    try {
      const setting = await Setting.findOne({ key: 'point_settings' });
      if (setting) {
        const points = Number(setting.basePoints ?? setting.pointsPerIncrement ?? 50);
        const spend = Math.max(1, Number(setting.minAmount ?? 1000));
        inMemorySettings = {
          minAmount: spend,
          basePoints: points,
          incrementAmount: spend,
          pointsPerIncrement: points,
        };
        return inMemorySettings;
      }
    } catch (e) {
      // ignore
    }
  }
  return inMemorySettings;
}

// GET current point settings
router.get('/points', async (_req: Request, res: Response) => {
  try {
    const current = await getActivePointSettings();
    res.json({
      success: true,
      data: {
        minAmount: current.minAmount,
        basePoints: current.basePoints,
        incrementAmount: current.incrementAmount,
        pointsPerIncrement: current.pointsPerIncrement,
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    res.json({
      success: true,
      data: inMemorySettings,
    });
  }
});

// UPDATE point settings
router.put('/points', async (req: Request, res: Response) => {
  try {
    const { minAmount, basePoints, incrementAmount, pointsPerIncrement } = req.body;

    const parsedMin = Math.max(1, Number(minAmount) || 1000);
    const parsedPoints = Math.max(0, Number(basePoints !== undefined ? basePoints : pointsPerIncrement) || 0);

    inMemorySettings = {
      minAmount: parsedMin,
      basePoints: parsedPoints,
      incrementAmount: parsedMin,
      pointsPerIncrement: parsedPoints,
    };

    let updatedAt = new Date();

    if (mongoose.connection.readyState === 1) {
      try {
        const setting = await Setting.findOneAndUpdate(
          { key: 'point_settings' },
          {
            minAmount: parsedMin,
            basePoints: parsedPoints,
            incrementAmount: parsedMin,
            pointsPerIncrement: parsedPoints,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        if (setting) {
          updatedAt = setting.updatedAt;
        }
      } catch (dbErr: any) {
        console.warn('Could not persist setting to MongoDB, maintained in memory:', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Point settings updated successfully',
      data: {
        minAmount: parsedMin,
        basePoints: parsedPoints,
        incrementAmount: parsedMin,
        pointsPerIncrement: parsedPoints,
        updatedAt,
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
