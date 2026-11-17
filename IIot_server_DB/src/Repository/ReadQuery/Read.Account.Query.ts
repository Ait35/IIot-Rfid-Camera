import { db } from '../../Infra/connect_db.js';
import { Query } from '../helperQuery.js';

export const getAccountsFilteredPage = async (
    page: number,
    limit: number,
    role?: string,
    search?: string,
    is_delete: boolean = false,
    start_date?: string,
    end_date?: string
) => {
    if (!db) return { success: false, status: 500, error: 'Database not connected' };

    const conditions: string[] = ['is_delete = $1'];
    const values: any[] = [is_delete];
    let idx = 2;

    if (role && role !== 'all') {
        conditions.push(`role = $${idx}`);
        values.push(role);
        idx++;
    }

    if (search) {
        conditions.push(`(
            university_id ILIKE $${idx}
            OR first_name ILIKE $${idx}
            OR last_name ILIKE $${idx}
            OR role ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
    }

    idx = Query.addDateRangeFilter('last_login_at', start_date, end_date, conditions, values, idx);

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limitIdx = idx++;
    const offsetIdx = idx++;
    values.push(limit, (page - 1) * limit);

    const sql = `
        SELECT
            user_id,
            university_id,
            first_name,
            last_name,
            role,
            created_at,
            last_login_at,
            is_delete
        FROM users
        ${whereClause}
        ORDER BY user_id DESC
        LIMIT $${limitIdx}
        OFFSET $${offsetIdx};
    `;

    try {
        const res = await db.query(sql, values);
        return { success: true, status: 200, data: res.rows };
    } catch (error) {
        console.error('❌ Database in getAccountsFilteredPage:', error);
        return { success: false, status: 500, error: 'Failed to get filtered users' };
    }
};
