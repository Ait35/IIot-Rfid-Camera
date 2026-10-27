import { PoolClient } from 'pg';
import { db } from '../Infra/connect_db.js';

export const updateData = async (
    tableName:string ,
    target_name_id:string ,
    target_id:number ,
    is_delete:boolean ,
    user_req: Record<any, any>,
    transaction: PoolClient) => 
    {
        console.log('----- API action: Update Query -----');
    
        let current_index = 0;
        let sql = `UPDATE ${tableName} SET `;
        let values : any[] = [];
        Object.keys(user_req).forEach((key)=> {
            if(key === 'is_delete') return ;
            if(typeof user_req[key] === 'string' && user_req[key].toLowerCase() === 'now()'){
                sql += `${key} = NOW() ,`;
                return;
            }
            current_index++;
            sql += `${key} = $${current_index} ,`;
            values.push(user_req[key]);
        });
        values.push(target_id);
        sql = sql.slice(0, -1) + ` WHERE ${is_delete? `is_delete = FALSE AND` : ``} ${target_name_id} = $${current_index+1} RETURNING *`;
        // console.log('SQL :' , sql);
        // console.log('values :' , values);
        try{
            const result = await transaction.query(sql, values);
            if(result.rowCount === 0){
                throw new Error('Failed to update group');
            }

            return { success: true, status: 200, data: result.rows[0] };
        }catch(error : any){
            if(error.code === '23505'){
                throw new Error(`This data in ${tableName} already exists. Please try again.`, { cause: error });
            }
            throw error;
        }
    }  

export const updateAndGet1Table = async (
    tableName:string ,
    target_name_id:string ,
    target_id:number ,
    user_req: Record<any, any>,
    tableName2:string ,
    FK_name_id1:string ,
    FK_name_id2:string ,
    transaction: PoolClient) => 
{
    console.log('----- API action: Update Query -----');

    let current_index = 0;
    let sql = `UPDATE ${tableName} AS T1 SET `;
    let values : any[] = [];
    Object.keys(user_req).forEach((key)=> {
        if(key === 'is_delete') return ;
        current_index++;
        sql += `${key} = $${current_index} ,`;
        values.push(user_req[key]);
    });
    values.push(target_id);
    sql = sql.slice(0, -1) + 
        `FROM ${tableName2} AS T2
        WHERE T1.${FK_name_id1} = T2.${FK_name_id2}
        AND T2.is_delete = FALSE
        AND T1.is_delete = FALSE
        AND ${target_name_id} = $${current_index+1} RETURNING T1.*,T2.*`;
    console.log('SQL :' , sql);
    console.log('values :' , values);
    try{
        const result = await transaction.query(sql, values);
        if(result.rowCount === 0){
            throw new Error('Failed to update group');
        }

        return { success: true, status: 200, data: result.rows[0] };
    }catch(error : any){
        if(error.code === '23505'){
            throw new Error(`This data in ${tableName} already exists. Please try again.`, { cause: error });
        }
        throw error;
    }
}  
export const updateMoreThen1 = async (
    table: string,
    name_table_id: string,
    id: number[],
    name_column : string[],
    value : unknown[][],
    where : string[],
    whereValue: (boolean|string|number)[],
    transaction?: PoolClient,
    coalesceColumns: string[] = ['last_active_at']
) =>{
    console.log('----- API action: update More Then 1 -----');
    let sql = 
    `UPDATE ${table} 
    SET `;
    const s = name_column.map((item) => {
        if (coalesceColumns.includes(item)) {
            return `${item} = COALESCE(u.${item}, ${table}.${item})`;
        }
        return `
        ${item} = u.${item}`;
    }).join(', ')

    sql +=`${s}
    FROM UNNEST(
        $1::int[]`

    value.map((item , index) =>{
    //หาค่าใน array item 1 ถ้าเจอ null ,undefined ให้ข้ามไปตัวถัดไป จนกว่าจพไม่เจอ null ,undefined แล้วเอาตัวน้ัน
        const sample = item.find(val => val !== null && val !== undefined);
        let type: string = 'varchar';
        if (sample instanceof Date || (name_column[index] as string).endsWith('_at')) {
            type = "timestamptz";
        } else if (typeof sample === "number") {
            //เช็ค Float ไหม return true/false
            type = Number.isInteger(sample) ? "int" : "numeric";
        } else if (typeof sample === "boolean") {
            type = "boolean";
        } else if (typeof sample === "string") {
            type = "varchar";
        }
        sql += `,
        $${index+2}::${type}[]`
    })
    
    sql += `
    ) AS u(${name_table_id}, ${name_column.join(', ')})
    WHERE
        ${table}.${name_table_id} = u.${name_table_id}`
    
    where.map((item , index)=>{
        sql += `
         AND ${table}.${item} = $${index+2+value.length}`
    })
    sql += `
    RETURNING ${table}.${name_table_id}, ${name_column.map(col => `${table}.${col}`).join(', ')};`

    console.log(sql)
    console.log([ id, ...value ,...whereValue])
    if(!db) return { success: false, status: 500, error: `Failed to get data ${table}`}
    try{
        const result = transaction?     
            await transaction.query(sql, [ id, ...value ,...whereValue]) : 
            await db.query(sql, [ id, ...value ,...whereValue]) 
        if(result.rowCount === 0){
            throw new Error('Failed to update');
        }
        return { success: true, status: 200, data: result.rows };
    }catch(error : any){
        if(error.code === '23505'){
            throw new Error(`This data in ${table} already exists. Please try again.`, { cause: error });
        }
        throw error;
    }
}

// export const updateMoreThen1 = async (
//     table: string,
//     name_table_id: string,
//     id: number[],
//     name_column : string[],
//     value : (boolean|string|number)[],
//     where : string[],
//     whereValue: (boolean|string|number)[],
//     transaction?: PoolClient
// ) =>{
//     console.log('----- API action: update More Then 1 -----');
//     let sql = 
//         `INSERT INTO ${table} 
//         (${name_table_id}, ${name_column.join(`, `)})
//         VALUES`;

//     id.map((ID , index) =>{
//         sql += `
//         (${ID} , $${index+1}`
//         for(let i = 0 ; i < name_column.length-1 ; i++){
//             sql += `, $${index+1 + i + name_column.length}`
//         }
//         sql += `)`
//     })
    
//     sql +=  `
//     ON CONFLICT (${name_table_id})
//     DO UPDATE SET `
//     const t = name_column.map((item, index) => {
//         return `
//         ${item} = EXCLUDED.${item}`
//     }).join(', ')

//     sql += t + `
//     WHERE`;
  
//    where.map((item, index) => {
//         sql += `
//         ${item} = $${index+1 +value.length}`
//     })
//     console.log(sql)
//     console.log([...value , ...whereValue])

// }