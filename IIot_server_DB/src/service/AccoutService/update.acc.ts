import { Helper } from '../Class_service.js';
import { updateData } from '../../Repository/updataQuery.js';
import { QueryRedis } from '../../Infra/Redis/cache.js';
import { UpdateAccountInput } from '../../schemas/auth.schema.js';

export const update_acc = async (
    inputData: UpdateAccountInput,
    user_id: number,
    ip_address: string = 'Unknown IP',
    userAgent: string = 'Unknown Device'
) => {
    const { is_delete, ...updatePayload } = inputData;

    return await Helper.Service.executeWithLog(
        'update_User', 'users', 'UPDATE', String(user_id),
        async (transaction) => {
            let result: any = null;

            if (Object.keys(updatePayload).length > 0) {
                result = await updateData('users', 'user_id', user_id, true, updatePayload, transaction);
            }

            if (is_delete !== undefined) {
                result = await Helper.Query.Tran_SetDelete('users', 'user_id', user_id, is_delete, transaction);
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
                logPayload: { ...inputData, ip_address, user_agent: userAgent }
            };
        }
    );
};
