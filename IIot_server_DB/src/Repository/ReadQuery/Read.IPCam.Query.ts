import { db } from '../../Infra/connect_db.js';

export const getIPCamFilteredPage = async (
    page: number,
    limit: number,
    status?: string,
    group_id?: number,
    search?: string,
    is_delete: boolean = false
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = ['T1.is_delete = $1'];
    const values: any[] = [is_delete];
    let idx = 2;

    if (status) {
        conditions.push(`T1.status = $${idx}`);
        values.push(status);
        idx++;
    }

    if (group_id && !Number.isNaN(group_id)) {
        conditions.push(`T1.group_id = $${idx}`);
        values.push(group_id);
        idx++;
    }

    if (search) {
        conditions.push(`(
            T1.cam_name ILIKE $${idx}
            OR T1.ip ILIKE $${idx}
            OR T1.mac ILIKE $${idx}
            OR T1.local ILIKE $${idx}
            OR T3.group_name ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitIdx = idx++;
    const offsetIdx = idx++;
    values.push(limit, (page - 1) * limit);

    const sql = `
        SELECT T1.*, T2.first_name, T2.first_name AS by_user_name, T3.group_name
        FROM ip_camera AS T1
        LEFT JOIN users AS T2 ON T1.by_user_id = T2.user_id AND T2.is_delete = FALSE
        LEFT JOIN device_group AS T3 ON T1.group_id = T3.group_id AND T3.is_delete = FALSE
        ${whereClause}
        ORDER BY T1.ip_cam_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getIPCamFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered IP cameras' };
    }
};
