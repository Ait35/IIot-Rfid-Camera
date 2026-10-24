import { Helper } from '../Class_service.js';
import { updateData } from '../../Repository/updataQuery.js';
import { QueryRedis } from '../../Infra/Redis/cache.js';

export const update_acc = async (
    user_id : number, 
    password : string | undefined = undefined,
    role : string | undefined = undefined,
    ip_address: string = 'Unknown IP',
    userAgent: string = 'Unknown Device',
    is_delete: boolean | undefined = undefined
) => {
        
    interface req  {
        password?: string;
        role?: string;
        is_delete?: boolean
    }
    const req : req = {
        ...(password !== undefined && {password}),
        ...(role !== undefined && {role}),
        ...(is_delete !== undefined && {is_delete})
    }

    return await Helper.Service.executeWithLog(
        'update_User', 'users', 'UPDATE', String(user_id),
        async (transaction) => {
            let result: any = null;

            if (password !== undefined || role !== undefined) {
                result = await updateData('users', 'user_id', user_id, true, req, transaction);
            }

            if (is_delete !== undefined) {
                result = await Helper.Query.Tran_SetDelete('users', 'user_id', user_id , is_delete , transaction);
                if (is_delete === true) {
                    await QueryRedis.delCache(String(user_id), 'session');
                }
            }
    
            if (result?.data?.password) {
                delete result.data.password;
            }

            return {
                result: result || { success: true, status: 200, data: null },
                recordId: user_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                logPayload: { ...req , ip_address, user_agent: userAgent }
            };
        }
    );
}