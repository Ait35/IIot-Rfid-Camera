import { getLogFilteredPage } from '../../Repository/ReadQuery/Read.Log.Query.js';
import { getSystemLogFilteredPage, type SystemLogFilterOptions } from '../../Repository/ReadQuery/Read.SystemLog.Query.js';
import Service from '../helper_func.js';

export const LogRead = {
    async get_tag(
        page: number,
        limit: number,
        device_id?: number,
        search?: string,
        start_date?: string,
        end_date?: string
    ) {
        return await Service.executeRead('get_Log', async () => {
            const res_query = await getLogFilteredPage(page, limit, device_id, search, start_date, end_date);
            return res_query.data;
        });
    },

    async get_system_log(page: number, limit: number, filters: SystemLogFilterOptions = {}) {
        return await Service.executeRead('get_SystemLog', async () => {
            const res_query = await getSystemLogFilteredPage(page, limit, filters);
            if (!res_query.success) {
                throw new Error(res_query.error || 'Failed to get system activity logs');
            }
            return res_query.data;
        });
    },
};
