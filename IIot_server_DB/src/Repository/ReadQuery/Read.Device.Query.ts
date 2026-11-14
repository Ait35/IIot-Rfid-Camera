import { db } from '../../Infra/connect_db.js';

export const getDeviceFilteredPage = async (
    page: number,
    limit: number,
    device_type?: string,
    status?: string,
    group_id?: number,
    search?: string,
    is_delete: boolean = false
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = ['T1.is_delete = $1'];
    const values: any[] = [is_delete];
    let idx = 2;

    if (device_type) {
        conditions.push(`T1.device_type = $${idx}`);
        values.push(device_type);
        idx++;
    }

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
            T1.device_name ILIKE $${idx}
            OR T1.mac ILIKE $${idx}
            OR T1.ip ILIKE $${idx}
            OR T1.local ILIKE $${idx}
            OR T3.group_name ILIKE $${idx}
            OR EXISTS (
                SELECT 1 FROM ip_camera C
                WHERE C.group_id = T1.group_id
                  AND C.is_delete = FALSE
                  AND (C.cam_name ILIKE $${idx} OR C.ip ILIKE $${idx} OR C.mac ILIKE $${idx})
            )
        )`);
        values.push(`%${search}%`);
        idx++;
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
            T3.group_name,
            COALESCE(CAM.ip_cameras, '[]'::json) AS ip_cameras
        FROM device_info AS T1
        LEFT JOIN users AS T2 ON T1.by_user_id = T2.user_id AND T2.is_delete = FALSE
        LEFT JOIN device_group AS T3 ON T1.group_id = T3.group_id AND T3.is_delete = FALSE
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                    'ip_cam_id', C.ip_cam_id,
                    'cam_name', C.cam_name,
                    'mac', C.mac,
                    'ip', C.ip,
                    'local', C.local,
                    'status', C.status,
                    'up_time', C.up_time,
                    'last_active_at', C.last_active_at,
                    'snapshot_url', C.snapshot_url,
                    'rtsp_url', C.rtsp_url
                )
                ORDER BY C.ip_cam_id DESC
            ) AS ip_cameras
            FROM ip_camera AS C
            WHERE C.group_id = T1.group_id AND C.is_delete = FALSE
        ) AS CAM ON TRUE
        ${whereClause}
        ORDER BY T1.device_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getDeviceFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered devices' };
    }
};
