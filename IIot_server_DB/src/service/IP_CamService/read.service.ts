import { getIPCamFilteredPage } from '../../Repository/ReadQuery/Read.IPCam.Query.js';
import Service from '../helper_func.js';

export const IP_CamRead = {
    async get_IP_cam(
        page: number,
        limit: number,
        status?: string,
        group_id?: number,
        search?: string,
        is_delete: boolean = false
    ) {
        return await Service.executeRead('get_IP_cam', async () => {
            const res_query = await getIPCamFilteredPage(page, limit, status, group_id, search, is_delete);
            return res_query.data;
        });
    }
};
