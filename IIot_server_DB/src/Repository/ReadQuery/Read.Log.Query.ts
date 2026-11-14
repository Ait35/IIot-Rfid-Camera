import { db } from '../../Infra/connect_db.js';

export const getLogFilteredPage = async (
    page: number,
    limit: number,
    device_id?: number,
    search?: string
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (device_id && !Number.isNaN(device_id)) {
        conditions.push(`T1.device_id = $${idx}`);
        values.push(device_id);
        idx++;
    }

    if (search) {
        conditions.push(`(
            T3.epc ILIKE $${idx}
            OR T3.tag ILIKE $${idx}
            OR T4.device_name ILIKE $${idx}
            OR T4.local ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitIdx = idx++;
    const offsetIdx = idx++;
    values.push(limit, (page - 1) * limit);

    const sql = `
        SELECT
            T1.*,
            T2.image_path,
            T3.epc,
            T3.tag,
            T3.status AS tag_status,
            T4.device_name,
            T4.local
        FROM log_rfid AS T1
        LEFT JOIN log_images AS T2 ON T1.log_id = T2.log_id
        LEFT JOIN map_tag AS T3 ON T1.epc_id = T3.epc_id
        LEFT JOIN device_info AS T4 ON T1.device_id = T4.device_id
        ${whereClause}
        ORDER BY T1.log_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getLogFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered logs' };
    }
};
