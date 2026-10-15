import { Helper } from '../Class_service.js';
import { updateData } from '../../Repository/updataQuery.js';

interface user_req {
    tag?: string;
    status?: string; 
    is_delete?: boolean;
    by_user_id: string;
}

export const Map_tagWrite = {
    async update_map_tag(
        epc_id : number ,
        tag : string ,
        status : string ,
        is_delete : boolean ,
        by_user_id : string ,
        ip_address : string , 
        userAgent : string) 
    {
        console.log('----- action: update map_tag -----');

        const req : user_req = {
            ...(tag && {tag}),
            ...(status && {status}),
            ...(is_delete && {is_delete}),
            by_user_id : by_user_id
        };

        return await Helper.Service.executeWithLog(
                    'update_Map_tag service',
                    'map_tag',
                    'UPDATE',
                    by_user_id,
                    async (transaction) => {
                        let result;
        
                        if(is_delete !== undefined){
                            result = await Helper.Query.Tran_SetDelete('map_tag', 'epc_id', epc_id , is_delete , transaction);
                        }else{
                            result = await updateData('map_tag', 'epc_id', epc_id, true, req, transaction);
                        }
             
                        return {
                            result,
                            recordId: epc_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                            logPayload: { ...req , ip_address, user_agent: userAgent }
                        };
                    });
    }
}