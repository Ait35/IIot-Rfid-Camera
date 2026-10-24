import { db } from '../Infra/connect_db.js';

export const DashboardQuery = {
    async getRecentScans(limit: number = 10) {
        console.log('----- API action: getRecentScans -----');
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }

        const sql = `
            SELECT 
                lr.log_id,
                mt.epc,
                mt.tag AS equipment_name,
                mt.status AS tag_status,
                lr.distance,
                lr.time_stamp,
                di.device_name AS scanned_by_device,
                di.device_type,
                di.local AS location,
                li.image_path AS latest_image
            FROM log_rfid lr
            JOIN map_tag mt ON lr.epc_id = mt.epc_id
            JOIN device_info di ON lr.device_id = di.device_id
            LEFT JOIN LATERAL (
                SELECT image_path 
                FROM log_images 
                WHERE log_id = lr.log_id 
                ORDER BY created_at DESC 
                LIMIT 1
            ) li ON true
            ORDER BY lr.time_stamp DESC
            LIMIT $1;
        `;

        try {
            const res = await db.query(sql, [limit]);
            console.log('----- Query getRecentScans Successful! -----');
            return { success: true, status: 200, data: res.rows };
        } catch (error) {
            console.error('❌ Database Error in getRecentScans:', error);
            return { success: false, status: 500, error: 'Failed to get recent scans' };
        }
    },

    async getDashboardStats() {
        console.log('----- API action: getDashboardStats -----');
        if (!db) return { success: false, status: 500, error: 'Database not connected' };

        const sql = `
            SELECT
                (SELECT COUNT(*) FROM map_tag WHERE is_delete = false) AS total_tags,
                (SELECT COUNT(*) FROM map_tag WHERE status = 'active' AND is_delete = false) AS active_tags,
                (SELECT COUNT(*) FROM device_info WHERE is_delete = false) AS total_devices,
                (SELECT COUNT(*) FROM log_rfid WHERE time_stamp >= CURRENT_DATE) AS scans_today
        `;

        try {
            const res = await db.query(sql);
            console.log('----- Query getDashboardStats Successful! -----');
            return { success: true, status: 200, data: res.rows[0] };
        } catch (error) {
            console.error('❌ Database Error in getDashboardStats:', error);
            return { success: false, status: 500, error: 'Failed to get dashboard stats' };
        }
    }
};
