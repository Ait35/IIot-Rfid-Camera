import { db } from '../Infra/connect_db.js';

//login
export const LoginQuery = {
    async Login (university_id:string, password:string) {
        console.log('----- API action: findUser  -----');
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }

        const sql = `
            SELECT * FROM users 
            WHERE university_id = $1 AND is_delete = FALSE;
        `;
        const values = [university_id];

        try { 
            const result = await db.query(sql, values);
            const userInfo = result.rows[0];

            if (userInfo === 0 || !userInfo) {
                return { success: false, status: 404, error: `not find user` };
            }
            if(userInfo.password !== password){
                return { success: false, status: 400, error: `Invalid password` };
            }
            delete userInfo.password;
            console.log('----- Select Successful! -----');
            return { success: true, status: 200, data: userInfo};
        } catch (error) {
            console.error('❌ Database error not found user:', error);
            return { success: false, status: 404, error: 'error not found user' };
        } 
    }
};