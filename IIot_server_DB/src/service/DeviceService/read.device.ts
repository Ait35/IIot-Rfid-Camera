import { getDeviceFilteredPage } from '../../Repository/ReadQuery/Read.Device.Query.js';
import Service from '../helper_func.js';

export const DeviceRead = {
    async get_deviceInfo(
        page: number,
        limit: number,
        device_type?: string,
        status?: string,
        group_id?: number,
        search?: string,
        is_delete: boolean = false
    ) {
        return await Service.executeRead('get_deviceInfo', async () => {
            const res_query = await getDeviceFilteredPage(page, limit, device_type, status, group_id, search, is_delete);
            return res_query.data;
        });
    }
};
