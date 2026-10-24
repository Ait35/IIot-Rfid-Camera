import { PoolClient } from 'pg';

export const InsertData = async (
    tableName:string ,
    user_req: Record<any, any>,
    transaction: PoolClient) => 
    {
        console.log(`----- API action: Insert ${tableName} -----`);
        let sql = `INSERT INTO ${tableName} (`;
        let sql_values = ` VALUES (`;
        let values : any[] = [];
        Object.keys(user_req).forEach((key , index)=> {

            sql += `${key},`;
            sql_values += `$${index + 1} ,`;
            //เอาค่าใน key มาใส่
            values.push(user_req[key]);
        });

        sql = sql.slice(0, -1) + ')' + sql_values.slice(0, -1) + ')' + ' RETURNING *;'; 
        console.log('SQL :' , sql);
        console.log('values :' , values);
        try{
            const result = await transaction.query(sql, values);
            if(result.rowCount === 0){
                throw new Error('Failed to update mqtt');
            }
            if(result.rows[0].password){
                delete result.rows[0].password;
            }

            return { success: true, status: 200, data: result.rows[0] };
        }catch(error : any){
            if(error.code === '23505'){
                throw new Error(`This data in ${tableName} is already try again : ` , { cause: error });
            }
            throw error;
        }
    }  