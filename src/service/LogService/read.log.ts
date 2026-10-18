import { get2TablePage } from '../../Repository/ReadQuery.js';
import { Helper } from '../Class_service.js';

 export const LogRead = {
    async get_tag(page: number, limit: number, userId: number, ip: string, userAgent: string) {
        console.log('----- API action: get_Tag service -----');
        const table1 = 'log_rfid';
        const table2 = 'log_images';
        const SelectT1 = '*';
        const SelectT2 = 'image_path';
        const OnT1 = 'log_id';
        const OnT2 = 'log_id';
        const sort_by = 'log_id';
        const order = 'DESC';
     
        const res_query = await Helper.Service.readAndWriteLog('get_Log' , table1 , userId , null, 
            async ()=>{
            const res_query = await get2TablePage(
                table1 ,
                table2, 
                SelectT1, 
                SelectT2, 
                OnT1, 
                OnT2, 
                sort_by , 
                order, 
                page , 
                limit , false, false
            );
            return {
                result : res_query.data ,
                logPayload : {
                    ip_address : ip,
                    userAgent : userAgent, 
                    joined_table: table2, page, limit, sort_by, order}
            };
        });

        if(!res_query.success){
            console.log(res_query);
            return res_query;
        }
    
        console.log(res_query);
        return res_query;
    }
}