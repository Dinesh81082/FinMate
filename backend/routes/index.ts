import { Router } from 'express';
import healthRoutes from './healthRoutes.ts';
import authRoutes from './authRoutes.ts';
import transactionRoutes from './transactionRoutes.ts';
import dashboardRoutes from './dashboardRoutes.ts';
import budgetRoutes from './budgetRoutes.ts';
import aiRoutes from './aiRoutes.ts';
import reportRoutes from './reportRoutes.ts';

const router = Router();

router.use('/api', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/transactions', transactionRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/budgets', budgetRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/v1/ai', aiRoutes);
router.use('/api/ai', aiRoutes);

export default router;

