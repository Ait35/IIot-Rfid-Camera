import { db } from '../Infra/connect_db.js';
import { PoolClient } from 'pg';

export const Query = {
    async updateToken (user_id:string, accessToken:string){
        console.log('----- API action: updateToken  -----');
        if(!user_id || !accessToken){
            console.log('Missing university id or token');
            console.log('user id :' , user_id);
            console.log('access token :' , accessToken);
            return { success: false, status: 400, error: 'Missing university id or token' };
        }
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }

        const sql = `
            UPDATE users SET token = $1 WHERE user_id = $2
            RETURNING token;
        `;
        const values = [accessToken, user_id];

        try { 
            const result = await db.query(sql, values); //ถ้า error ลง catch
            console.log(result);
            if (result.rowCount === 0) {
                return { success: false, status: 404, error: 'Record not found' };
            }
            console.log('---- Set Successful! -----');
            return { success: true, status: 200, token : result.rows[0].token };
        }catch (error) {
            console.error('❌ Update Token error in user query:', error);
            return { success: false, status: 500, error: 'Update Token failed' };
        } 
    },
    
    async updateTime(tableName:string , field_traget : string, where : string , id:number) {
        console.log('----- API action: updateTime  -----');
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }
        //ใช้รูแบบ $1 กับพวก table  field where ไม่ได้
        const sql = `
            UPDATE ${tableName} SET ${field_traget} = NOW()
            WHERE ${where} = $1
            RETURNING ${field_traget};
            `; // user_id ไม่ใช่หรัสนักศึกษาโว้ยยย
        const values = [id];
        try { 
            const result = await db.query(sql , values);
            if (result.rowCount === 0) {
                return { success: false, status: 404, error: 'Record not found' };
            }

            console.log('---- Update Successful! -----');
            return { success: true, status: 200, time_updated : result.rows[0][field_traget] };
        }catch (error) {
            console.error('❌ Update Time error in user query:', error);
            return { success: false, status: 500, error: 'Update Time failed' };
        } 
    },
    async Tran_updateToken (user_id:string, accessToken:string , transaction: PoolClient){
        console.log('----- API action: Transation updateToken  -----');
        if(!user_id || !accessToken){
            throw new Error('Missing university id or token');
        }

        const sql = `
            UPDATE users SET token = $1 WHERE user_id = $2
            RETURNING token;
        `;
        const values = [accessToken, user_id];

        const result = await transaction.query(sql, values); 
        //console.log(result);
        if (result.rowCount === 0) {
            throw new Error('Update Token failed');
        }
        console.log('---- Set Successful! -----');
        return result.rows[0].token;
    },
    async Tran_updateTime(tableName:string , field_traget : string, where : string , id:number , transaction: PoolClient) {
        console.log('----- API action: Transation updateTime  -----');

        const sql = `
            UPDATE ${tableName} SET ${field_traget} = NOW()
            WHERE ${where} = $1
            RETURNING ${field_traget};
            `;
        const values = [id];
        
        const result = await transaction.query(sql , values);
        if (result.rowCount === 0) {
           throw new Error('Update Time failed');
        }

        console.log('---- Update Successful! -----');
    },
        async Tran_SetDelete(tableName:string , where : string , id:number , is_delete : boolean , transaction: PoolClient) {
        console.log('----- API action: SetDelete  -----');

        const sql = `
            UPDATE ${tableName} SET  is_delete = $2
            WHERE ${where} = $1
            RETURNING *;
            `;
        const values = [id , is_delete];

        try { 
            const result = await transaction.query(sql , values);

            if(is_delete){
                console.log('---- Delete Successful! -----');
            }else{
                console.log('---- Restore Successful! -----');
            }
            return { success: true, status: 200, data : result.rows[0]};
        }catch (error) {
            if(is_delete){
                console.log('---- Delete failed! -----');
                throw new Error('Delete failed');
            }

            console.log('---- Restore failed! -----');
            throw new Error('Restore failed');
        }
    },

    async SetDelete(tableName:string , where : string , id:number , is_delete : boolean) {
        console.log('----- API action: SetDelete  -----');
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }
        const sql = `
            UPDATE ${tableName} SET  is_delete = $2
            WHERE ${where} = $1
            RETURNING *;
            `;
        const values = [id , is_delete];

        try { 
            const result = await db.query(sql , values);

            if (result.rowCount === 0) {
                return { success: false, status: 404, error: 'Record not found' };
            }

            if(is_delete){
                console.log('---- Delete Successful! -----');
            }else{
                console.log('---- Restore Successful! -----');
            }
            return { success: true, status: 200, data : result.rows[0] };
        }catch (error) {
            if(is_delete){
                console.log('---- Delete failed! -----');
                return { success: false, status: 500, error: 'Delete failed' };
            }

            console.log('---- Restore failed! -----');
            return { success: false, status: 500, error: 'Restore failed' };
        }
    }
}