import { getTagFilteredPage } from '../../Repository/ReadQuery/Read.Tag.Query.js';
import Service from '../helper_func.js';

export const TagRead = {
    async get_tag(page: number, limit: number, status?: string, search?: string) {
        return await Service.executeRead('get_tag', async () => {
            const res_query = await getTagFilteredPage(page, limit, status, search);
            return res_query.data;
        });
    }
};
