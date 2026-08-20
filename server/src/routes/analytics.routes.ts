import { Router } from 'express';
import { getAnalyticsHandler } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/', getAnalyticsHandler);

export default router;
