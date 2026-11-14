import { db } from '../../Infra/connect_db.js';

export const getGroupFilteredPage = async (
    page: number,
    limit: number,
    search?: string,
    is_delete: boolean = false
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = ['T1.is_delete = $1'];
    const values: any[] = [is_delete];
    let idx = 2;

    if (search) {
        conditions.push(`(T1.group_name ILIKE $${idx} OR T2.first_name ILIKE $${idx} OR CAST(T1.group_id AS TEXT) = $${idx + 1})`);
        values.push(`%${search}%`, search);
        idx += 2;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitIdx = idx++;
    const offsetIdx = idx++;
    values.push(limit, (page - 1) * limit);

    const sql = `
        SELECT
            T1.*,
            T2.first_name,
            T2.first_name AS by_user_name,
            COALESCE(D.device_count, 0)::int AS device_count,
            COALESCE(C.ip_cam_count, 0)::int AS ip_cam_count
        FROM device_group AS T1
        LEFT JOIN users AS T2 ON T1.by_user_id = T2.user_id AND T2.is_delete = FALSE
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS device_count
            FROM device_info
            WHERE group_id = T1.group_id AND is_delete = FALSE
        ) D ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS ip_cam_count
            FROM ip_camera
            WHERE group_id = T1.group_id AND is_delete = FALSE
        ) C ON TRUE
        ${whereClause}
        ORDER BY T1.group_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getGroupFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered groups' };
    }
};
