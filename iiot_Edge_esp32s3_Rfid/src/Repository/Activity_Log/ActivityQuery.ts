import {db} from '../../Infra/connect_db.js';

export const ActivityLogService = {
    async Insert_logAction(
        userId: number | null, 
        actionType: string, 
        targetTable: string , 
        targetId: number | null | string,
        payload: any, transaction:any | null = null) {

        if(!db) throw new Error('ไม่มีการเชื่อมต่อกับ DB ได้');
            
        const sql = `
            INSERT INTO activity_log (User_id, action_type, target_table, target_id, payload)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [userId, actionType, targetTable, targetId, JSON.stringify(payload)];

        try {
            if (transaction) {
                await transaction.query(sql, values);
                return { success: true, status: 200, data: null };
            } else {
                const result = await db.query(sql, values);
                return { success: true, status: 200, data: result.rows[0] };
            }
        } catch (error) {
            console.error('❌ Failed to insert Activity_Log:', error);

            if (transaction) throw error;
            return { success: false, status: 500, error: 'Failed to insert table Activity_Log' };
        }
    }
}