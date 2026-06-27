import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { DashboardService } from '../services/dashboardService.ts';

/**
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user?.id || 'usr_mock_01';
    const data = await DashboardService.getDashboardOverview(user_id);

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};
