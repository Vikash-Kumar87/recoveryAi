import { Request, Response, NextFunction } from 'express';
import { Settings } from '../models/Settings.js';

export const getSettingsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        enableAiRecovery: true,
        autoStartRecovery: true,
        autoSendMessages: false,
        recoveryThreshold: 70,
        maxRetryAttempts: 3,
        emailAlerts: true,
        smsAlerts: false,
        alertEmail: 'merchant@recoverai.in',
        webhookEnabled: false,
      });
    }
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
