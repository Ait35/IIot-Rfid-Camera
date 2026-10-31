import { PoolClient } from 'pg';

export const InsertData = async (
    tableName:string ,
    user_req: Record<any, unknown>,
    transaction: PoolClient) => 
    {
        console.log(`----- API action: Insert ${tableName} -----`);
        let sql = `INSERT INTO ${tableName} (`;
        let sql_values = ` VALUES (`;
        let values : unknown[] = [];
        Object.keys(user_req).forEach((key , index)=> {

            sql += `${key},`;
            sql_values += `$${index + 1} ,`;
            //เอาค่าใน key มาใส่
            values.push(user_req[key]);
        });

        sql = sql.slice(0, -1) + ')' + sql_values.slice(0, -1) + ')' + ' RETURNING *;'; 
        // console.log('SQL :' , sql);
        // console.log('values :' , values);
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
                throw new Error(`This data in ${tableName} is already`);
            }
            throw error;
        }
    }  
export const MultiInsert = async (
    table : string,
    column : string[],
    value : unknown[][],
    transaction: PoolClient
) =>{
    try{
        let sql = `INSERT INTO ${table} (${column.join(', ')})
        SELECT * FROM UNNEST(`;

        const Building = value.map((item, index) => {
            const data = item.find(val => val !== null && val !== undefined)
            let type = 'varchar';

            if (data instanceof Date || (column[index] as string).endsWith('_at')) {
                type = "timestamptz";
            } else if (typeof data === "number" || (column[index] as string).endsWith('_id')) {
                //เช็ค Float ไหม return true/false
                type = Number.isInteger(data) ? "int" : "numeric";
            } else if (typeof data === "boolean") {
                type = "boolean";
            } else if (typeof data === "string") {
                type = "varchar";
            }

            return `$${index+1}::${type}[]`;
        }).join(', ');

        sql += `
        ${Building}
        )
        RETURNING *;`

        const result = await transaction.query(sql, value);
            if(result.rowCount === 0){
                throw new Error('Failed to update mqtt');
            }
            if(result.rows[0].password){
                delete result.rows[0].password;
            }

            return { success: true, status: 200, data: result.rows };
    }catch(error: any){
        if(error.code === '23505'){
            throw new Error(`This data in ${table} is already try again`);
        }
        throw error;
    }
}

// INSERT INTO map_tag (epc, note, by_user_id)
// SELECT * FROM UNNEST(
//     $1::varchar[],   -- ['EPC_001', 'EPC_002', 'EPC_003']
//     $2::varchar[],   -- ['กล่องที่ 1', 'กล่องที่ 2', 'กล่องที่ 3']
//     $3::int[]        -- [1, 1, 1]
// )
// RETURNING *;