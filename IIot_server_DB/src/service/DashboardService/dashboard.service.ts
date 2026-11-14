import { DashboardQuery } from '../../Repository/ReadQuery/DashboardQuery.js';
import Service from '../helper_func.js';

export const DashboardService = {
    async get_dashboardSummary(_userId?: number, _ip_address?: string, _userAgent?: string) {
        console.log('----- API action: get_dashboardSummary service -----');

        return await Service.executeRead('get_dashboardSummary', async () => {
            const statsRes = await DashboardQuery.getDashboardStats();
            const recentScansRes = await DashboardQuery.getRecentScans(10);

            return {
                stats: statsRes.success ? statsRes.data : null,
                recentScans: recentScansRes.success ? recentScansRes.data : []
            };
        });
    }
};
