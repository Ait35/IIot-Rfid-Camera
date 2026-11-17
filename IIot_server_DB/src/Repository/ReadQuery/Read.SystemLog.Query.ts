import { db } from '../../Infra/connect_db.js';

export type SystemLogSearchBy = 'all' | 'user' | 'target_id' | 'payload';

export interface SystemLogFilterOptions {
    action_type?: string | undefined;
    target_table?: string | undefined;
    search?: string | undefined;
    search_by?: SystemLogSearchBy | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}
//แปลง data type จาก str เป็นของจริง
function parseTypedJsonValue(raw: string): string | number | boolean {
    const trimmed = raw.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
    return trimmed;
}

export const getSystemLogFilteredPage = async (
    page: number,
    limit: number,
    filters: SystemLogFilterOptions = {}
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const { action_type, target_table, search, search_by = 'all', start_date, end_date } = filters;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (action_type) {
        conditions.push(`UPPER(T1.action_type) = UPPER($${idx})`);
        values.push(action_type);
        idx++;
    }

    if (target_table) {
        conditions.push(`LOWER(T1.target_table) = LOWER($${idx})`);
        values.push(target_table);
        idx++;
    }

    if (start_date) {
        conditions.push(`T1.time_action >= $${idx}::timestamp`);
        values.push(start_date);
        idx++;
    }

    if (end_date) {
        conditions.push(`T1.time_action < ($${idx}::date + INTERVAL '1 day')`);
        values.push(end_date);
        idx++;
    }

    if (search) {
        if(search_by === 'user') {
            conditions.push(`(
                T2.first_name ILIKE $${idx}
                OR T2.last_name ILIKE $${idx}
                OR T2.university_id ILIKE $${idx}
            )`);
            values.push(`%${search}%`);
            idx++;
        }else if (search_by === 'target_id') {
            if (/^\d+$/.test(search)) {
                conditions.push(`T1.target_id = $${idx}`);
                values.push(Number(search));
            } else {
                conditions.push(`CAST(T1.target_id AS TEXT) ILIKE $${idx}`);
                values.push(`%${search}%`);
            }
            idx++;
        }else if (search_by === 'payload') {
            const kvMatch = search.match(/^([a-zA-Z0-9_]+)=(.+)$/);
            if (kvMatch) { //match retrun array และ ดึงออกจาก array in 1 ,2 เว้น 0 ไว้ 
                const [, key, rawVal] = kvMatch;
                //แปลงเป็น key value สำหรับ เข้า DB 
                const typedObj = { [key as string]: parseTypedJsonValue(rawVal as string) };
                // Uses GIN index idx_activity_payload (jsonb_path_ops)
                conditions.push(`T1.payload @> $${idx}::jsonb`);
                values.push(JSON.stringify(typedObj));
            }else {
                conditions.push(`CAST(T1.payload AS TEXT) ILIKE $${idx}`);
                values.push(`%${search}%`);
            }
            idx++;
        }else {
            conditions.push(`(
                T1.action_type ILIKE $${idx}
                OR T1.target_table ILIKE $${idx}
                OR CAST(T1.target_id AS TEXT) ILIKE $${idx}
                OR CAST(T1.payload AS TEXT) ILIKE $${idx}
                OR T2.first_name ILIKE $${idx}
                OR T2.last_name ILIKE $${idx}
                OR T2.university_id ILIKE $${idx}
            )`);
            values.push(`%${search}%`);
            idx++;
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countValues = [...values];

    const limitIdx = idx++;
    const offsetIdx = idx++;
    values.push(limit, (page - 1) * limit);

    const countSql = `
        SELECT COUNT(*)::int AS total
        FROM activity_log AS T1
        LEFT JOIN users AS T2 ON T1.user_id = T2.user_id
        ${whereClause};
    `;

    const dataSql = `
        SELECT
            T1.activity_id,
            T1.user_id,
            T1.action_type,
            T1.target_table,
            T1.target_id,
            T1.payload,
            T1.time_action,
            T2.first_name,
            T2.last_name,
            T2.university_id,
            T2.role
        FROM activity_log AS T1
        LEFT JOIN users AS T2 ON T1.user_id = T2.user_id
        ${whereClause}
        ORDER BY T1.activity_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const [countRes, dataRes] = await Promise.all([
            db.query(countSql, countValues),
            db.query(dataSql, values),
        ]);
        const total = countRes.rows[0]?.total ?? 0;
        return {
            success: true,
            status: 200,
            data: {
                items: dataRes.rows,
                total,
                page,
                limit,
            },
        };
    } catch (error) {
        console.error('❌ Database in getSystemLogFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get system activity logs' };
    }
};
