import { Helper } from '../Class_service.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateData } from '../../Repository/updataQuery.js';
import { CreateGroupInput, UpdateGroupInput } from '../../schemas/group.schema.js';
import { updataTatalGroup } from '../../index.js';

export const GroupWrite = {
    async post_group(inputData: CreateGroupInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: post_group service -----');
        const req = {
            group_name: inputData.group_name,
            by_user_id: by_user_id
        };
        
        return await Helper.Service.executeWithLog(
            'post_device group', 'device_group', 'INSERT', by_user_id,
            async (transaction) => {
                const res_query = await InsertData('device_group', req, transaction);
                await updataTatalGroup(transaction);
                return {
                    result: res_query,
                    recordId: res_query.data.group_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { group_name: inputData.group_name, ip_address, user_agent: userAgent }
                };
            }
        );
    },

    async update_group(inputData: UpdateGroupInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: update_group service -----');
        const { group_id, is_delete, ...updatePayload } = inputData;
        const action = is_delete !== undefined ? (is_delete ? 'DELETE' : 'RESTORE') : 'UPDATE';

        return await Helper.Service.executeWithLog(
            'update_device group', 'device_group', action, by_user_id,
            async (transaction) => {
                let result;

                if (is_delete !== undefined) {
                    result = await Helper.Query.Tran_SetDelete('device_group', 'group_id', group_id, is_delete, transaction);
                    await updataTatalGroup(transaction);
                } else {
                    result = await updateData('device_group', 'group_id', group_id, true, updatePayload, transaction);
                }
     
                return {
                    result,
                    recordId: group_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { ...inputData, ip_address, user_agent: userAgent }
                };
            }
        );
    }
};
