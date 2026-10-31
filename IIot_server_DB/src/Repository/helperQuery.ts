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
    },
async set_Default(
        table: string,
        nameColoumn_id: string, 
        id: number[],
        columnUpdata: string[],
        UpdataValue: (string|boolean|number)[],
        where: string[],
        whereValue: string[],
        except: string[],
        transaction: PoolClient
    ) {
        console.log('----- API action: Set Default  -----');

        try {
            // หาคอลัมน์ที่ต้องเซ็ตเป็น DEFAULT
            // รวมคอลัมน์ที่ต้องการยกเว้นทั้งหมด (id และ except)
            const excludeCols = [nameColoumn_id, ...(except || [])];
            
            const getColsQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = $1 
                  AND column_name != ALL($2::text[]) -- ใช้ตรวจสอบค่า Array ใน Postgres
            `;
            // ไปดึงชื่อคอลัมน์มาก่อน
            const colResult = await transaction.query(getColsQuery, [table, excludeCols]);           
            // สร้าง Array เตรียมไว้ เช่น ['"col1" = DEFAULT', '"col2" = DEFAULT']
            const setClauses: string[] = colResult.rows.map(r => `"${r.column_name}" = DEFAULT`);

            let sql = `UPDATE "${table}" SET `;
            const values: any[] = [];
            let paramIndex = 1;

            //เพิ่มคอลัมน์ที่ต้องการอัปเดตแบบระบุค่าเอง
            if (columnUpdata && columnUpdata.length > 0) {
                columnUpdata.forEach((col, idx) => {
                    setClauses.push(`"${col}" = $${paramIndex}`);
                    values.push(UpdataValue[idx]); // เก็บ Value ลง Array
                    paramIndex++;
                });
            }

            // ถ้าไม่มีคอลัมน์ให้อัปเดตเลย ให้ Error ออกไปเพื่อป้องกันคำสั่งพัง
            if (setClauses.length === 0) {
                throw new Error('No columns to update');
            }
            
            sql += setClauses.join(', '); // รวมชุด SET 

            // ใส่เงื่อนไข WHERE
            // เนื่องจาก id รับมาเป็น Array เราจึงต้องใช้ = ANY($X) แทนการใช้ = ธรรมดา
            sql += ` WHERE "${nameColoumn_id}" = ANY($${paramIndex})`;
            values.push(id);
            paramIndex++;

            // เพิ่ม WHERE เพิ่มเติม (ถ้ามี)
            if (where && where.length > 0) {
                const whereClauses = where.map((col, idx) => {
                    const clause = `"${col}" = $${paramIndex}`;
                    values.push(whereValue[idx]);
                    paramIndex++;
                    return clause;
                });
                sql += ` AND ${whereClauses.join(' AND ')}`;
            }

            // 2.3 เติม RETURNING * เพื่อให้ Postgres ส่งข้อมูลที่ถูกแก้ไขกลับมา
            sql += ` RETURNING *;`;

            // รันคำสั่ง UPDATE
            // โค้ดส่วนนี้จะรันได้สมบูรณ์ และผูกตัวแปรได้อย่างปลอดภัย
            const result = await transaction.query(sql, values);
            
            if (result.rowCount === 0) {
                throw new Error('Failed to update');
            }
            
            return { success: true, status: 200, data: result.rows };

        } catch (error: any) {
            if (error.code === '23505') {
                throw new Error(`This data in ${table} already exists. Please try again.`, { cause: error });
            }
            throw error;
        }
    }
}