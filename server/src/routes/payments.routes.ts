import { Router } from 'express';
import { getPaymentsHandler, getPaymentByIdHandler } from '../controllers/payments.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { getPaymentsQuerySchema, getPaymentParamsSchema } from '../validators/payment.validator.js';

const router = Router();

router.get('/', validateRequest(getPaymentsQuerySchema), getPaymentsHandler);
router.get('/:id', validateRequest(getPaymentParamsSchema), getPaymentByIdHandler);

export default router;
