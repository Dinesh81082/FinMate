import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.ts';

const router = Router();

router.get('/health', getHealthStatus);

export default router;
