import { Helper } from '../Class_service.js';
import { updateData } from '../../Repository/updataQuery.js';
import { UpdateTagInput } from '../../schemas/tag.schema.js';

export const Map_tagWrite = {
    async update_map_tag(inputData: UpdateTagInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- action: update map_tag service -----');
        const { epc_id, is_delete, ...updatePayload } = inputData;
        const req = {
            ...updatePayload,
            by_user_id: by_user_id
        };

        return await Helper.Service.executeWithLog(
            'update_Map_tag service',
            'map_tag',
            'UPDATE',
            by_user_id,
            async (transaction) => {
                let result;

                if (is_delete !== undefined) {
                    result = await Helper.Query.Tran_SetDelete('map_tag', 'epc_id', epc_id, is_delete, transaction);
                } else {
                    result = await updateData('map_tag', 'epc_id', epc_id, true, req, transaction);
                }
     
                return {
                    result,
                    recordId: epc_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { ...inputData, ip_address, user_agent: userAgent }
                };
            }
        );
    }
};
