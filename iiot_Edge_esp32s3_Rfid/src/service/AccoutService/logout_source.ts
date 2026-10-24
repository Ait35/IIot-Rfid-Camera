import { QueryRedis } from '../../Infra/Redis/cache.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';

export const LogoutService = {
    async logout(user_id: string, ip: string, userAgent: string) {
        console.log('----- API action: logout service -----');
        try {
            //ลบ Token ออกจาก Redis เพื่อเตะออกจากระบบทันที
            await QueryRedis.delCache(String(user_id), 'session');
            console.log(`✅ Deleted session cache for user_id: ${user_id}`);
            
            await ActivityLogService.Insert_logAction(
                Number(user_id), 
                'LOGOUT', 
                'User', 
                Number(user_id), 
                {
                    ip_address: ip,
                    user_agent: userAgent,
                    logout_at: new Date()
                }
            );
            console.log('----- Add System Log (Logout) Successful! -----');

            return { success: true, status: 200, message: 'Logged out successfully' };
        } catch (error) {
            console.error('❌ Error in Logout Service:', error);
            return { success: false, status: 500, error: 'Internal server error during logout' };
        }
    }
};
