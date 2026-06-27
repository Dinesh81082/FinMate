import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.ts';
import { getDashboardStats } from '../controllers/dashboardController.ts';

const router = Router();

router.use(authenticateJWT as any);

router.get('/stats', getDashboardStats as any);

export default router;
