import { getGroupFilteredPage } from '../../Repository/ReadQuery/Read.Group.Query.js';
import Service from '../helper_func.js';

export const GroupRead = {
    async get_group(page: number, limit: number, search?: string, is_delete: boolean = false) {
        return await Service.executeRead('get_group', async () => {
            const res_query = await getGroupFilteredPage(page, limit, search, is_delete);
            return res_query.data;
        });
    }
};
