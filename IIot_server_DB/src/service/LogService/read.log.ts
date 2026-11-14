import { getLogFilteredPage } from '../../Repository/ReadQuery/Read.Log.Query.js';
import Service from '../helper_func.js';

export const LogRead = {
    async get_tag(page: number, limit: number, device_id?: number, search?: string) {
        return await Service.executeRead('get_Log', async () => {
            const res_query = await getLogFilteredPage(page, limit, device_id, search);
            return res_query.data;
        });
    }
};
