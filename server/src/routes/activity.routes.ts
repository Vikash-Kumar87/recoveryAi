import { Router } from 'express';
import { getActivityHandler } from '../controllers/activity.controller.js';

const router = Router();

router.get('/', getActivityHandler);

export default router;
