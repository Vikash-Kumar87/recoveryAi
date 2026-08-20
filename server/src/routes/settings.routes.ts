import { Router } from 'express';
import {
  getSettingsHandler,
  updateSettingsHandler,
} from '../controllers/settings.controller.js';

const router = Router();

router.get('/', getSettingsHandler);
router.put('/', updateSettingsHandler);
router.post('/', updateSettingsHandler);

export default router;
