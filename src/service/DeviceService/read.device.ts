import { get2TablePage } from '../../Repository/ReadQuery.js';
import { Helper } from '../Class_service.js';

export const DeviceRead = {
    async get_deviceInfo(page: number, limit: number, userId: number, ip_address: string, userAgent: string) {
        console.log('----- API action: get_device service -----');
        const table1 = 'device_info';
        const table2 = 'users';
        const SelectT1 = '*';
        const SelectT2 = 'first_name';
        const OnT1 = 'by_user_id';
        const OnT2 = 'user_id';
        const sort_by = 'device_id';
        const order = 'DESC';
     
        const res_query = await Helper.Service.readAndWriteLog('get_deviceInfo' , table1 , userId , null,
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
                limit , true, true
            );
            return {
                result : res_query.data ,
                logPayload : {
                    ip_address : ip_address,
                    userAgent : userAgent, 
                    joined_table: table2, page, limit, sort_by, order}
            };
        });

        if(!res_query.success){
            console.log(res_query);
            return res_query;
        }
        if(res_query.success && (res_query as any).data === null){
            console.log(res_query);
            return res_query;
        }
    
        console.log(res_query);
        return res_query;
    }
}