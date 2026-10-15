import { DashboardQuery } from '../../Repository/DashboardQuery.js';
import { Helper } from '../Class_service.js';

export const DashboardService = {
    async get_dashboardSummary(userId: number, ip_address: string, userAgent: string) {
        console.log('----- API action: get_dashboardSummary service -----');

        const res_query = await Helper.Service.readAndWriteLog('get_dashboardSummary', 'dashboard', userId, null,
            async () => {
                // Get both stats and recent scans
                const statsRes = await DashboardQuery.getDashboardStats();
                const recentScansRes = await DashboardQuery.getRecentScans(10); // Limit to 10 recent scans

                const data = {
                    stats: statsRes.success ? statsRes.data : null,
                    recentScans: recentScansRes.success ? recentScansRes.data : []
                };

                return {
                    result: data,
                    logPayload: {
                        ip_address: ip_address,
                        userAgent: userAgent,
                        action: 'view_dashboard'
                    }
                };
            }
        );

        return res_query;
    }
};
