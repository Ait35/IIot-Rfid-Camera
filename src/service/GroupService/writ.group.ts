import { Helper } from '../Class_service.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateData } from '../../Repository/updataQuery.js';

interface user_req {
    group_name?: string;
    by_user_id?: string;
}

export const GroupWrite = {
    async post_group(group_name : string, By_user_id: string, ip_address:string , userAgent:string) {

        console.log('----- API action: post_group service -----');
        const req : user_req = {
            group_name : group_name,
            by_user_id : By_user_id
        }
        
        return await Helper.Service.executeWithLog(
            'post_device group', 'device_group', 'INSERT', By_user_id,
            async (transaction) => {
                const res_query = await InsertData('device_group', req, transaction);
                
                return {
                    result: res_query,
                    recordId: res_query.data.group_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { group_name , ip_address, user_agent: userAgent }
                };
            }
        );
    },
    async update_group(
        group_id : number, 
        group_name : string | undefined = undefined,
        by_user_id: string,
        ip_address:string , 
        userAgent:string , 
        is_delete: boolean | undefined = undefined)
    {
        interface req  {
            group_name?: string;
            is_delete?: boolean
        }
        const req : req = {
            ...(group_name !== undefined && {group_name}),
            ...(is_delete !== undefined && {is_delete})
        }

       return await Helper.Service.executeWithLog(
            'update_device group', 'device_group', 'UPDATE', by_user_id,
            async (transaction) => {
                let result;

                if(is_delete !== undefined){
                    result = await Helper.Query.Tran_SetDelete('device_group', 'group_id', group_id , is_delete , transaction);
                }else{
                    result = await updateData('device_group', 'group_id', group_id, true, req, transaction);
                }
     
                return {
                    result,
                    recordId: group_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { ...req , ip_address, user_agent: userAgent }
                };
            }
        );
    }
}