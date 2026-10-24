import { Request, Response } from 'express';
import { DashboardService } from '../../service/DashboardService/dashboard.service.js';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).payload?.user_id || 1; // get from authMiddleware
        const ip_address = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        const result = await DashboardService.get_dashboardSummary(userId, ip_address, userAgent);

        if (!result.success) {
            res.status(result.status || 500).json({
                success: false,
                message: result.error || 'Failed to fetch dashboard summary',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: (result as any).data
        });

    } catch (error) {
        console.error('❌ Error in getDashboardSummary Controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};
