import { fetchUserDashboardData } from '../models/transactionModel.ts';

export class DashboardService {
  static async getDashboardOverview(user_id: string) {
    return await fetchUserDashboardData(user_id);
  }
}
