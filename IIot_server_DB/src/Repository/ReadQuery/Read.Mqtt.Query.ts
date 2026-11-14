import { db } from '../../Infra/connect_db.js';

export const getMqttFilteredPage = async (
    page: number,
    limit: number,
    group_id?: number,
    search?: string
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = ['T1.is_delete = FALSE'];
    const values: any[] = [];
    let idx = 1;

    if (group_id && !Number.isNaN(group_id)) {
        conditions.push(`T1.group_id = $${idx}`);
        values.push(group_id);
        idx++;
    }

    if (search) {
        conditions.push(`(
            T1.topic ILIKE $${idx}
            OR T1.user_mqtt ILIKE $${idx}
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
        FROM mqtt AS T1
        LEFT JOIN users AS T2 ON T1.by_user_id = T2.user_id AND T2.is_delete = FALSE
        LEFT JOIN device_group AS T3 ON T1.group_id = T3.group_id AND T3.is_delete = FALSE
        ${whereClause}
        ORDER BY T1.mqtt_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getMqttFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered mqtt configs' };
    }
};
