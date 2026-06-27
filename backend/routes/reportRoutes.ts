import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.ts';
import { getReports, exportReportsCsv } from '../controllers/reportController.ts';

const router = Router();

router.use(authenticateJWT as any);

router.get('/', getReports as any);
router.get('/export', exportReportsCsv as any);

export default router;
