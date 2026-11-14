import { PoolClient } from 'pg';
import { db } from '../../Infra/connect_db.js';

export const getTagFilteredPage = async (
    page: number,
    limit: number,
    status?: string,
    search?: string
    ) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = ['T1.is_delete = FALSE'];
    const values: any[] = [];
    let idx = 1;

    // กรองตามสถานะ
    if (status) {
        conditions.push(`T1.status = $${idx}`);
        values.push(status);
        idx++;
    }

    //ค้นหาจาก EPC, ชื่อสิ่งของ (tag), หรือชื่อผู้ผูก (first_name)
    if (search) {
        conditions.push(`(T1.epc ILIKE $${idx} OR T1.tag ILIKE $${idx} OR T2.first_name ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitIdx = idx++;
    const offsetIdx = idx++;
    values.push(limit, (page - 1) * limit);

    const sql = `
        SELECT T1.*, T2.first_name AS by_user_name
        FROM map_tag AS T1
        LEFT JOIN users AS T2 ON T1.by_user_id = T2.user_id AND T2.is_delete = FALSE
        ${whereClause}
        ORDER BY T1.epc_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getTagFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered tags' };
    }
};