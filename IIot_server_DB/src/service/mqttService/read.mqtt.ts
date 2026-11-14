import { getMqttFilteredPage } from '../../Repository/ReadQuery/Read.Mqtt.Query.js';
import Service from '../helper_func.js';

export const MqttRead = {
    async get_mqtt(page: number, limit: number, group_id?: number, search?: string) {
        return await Service.executeRead('get_mqtt', async () => {
            const res_query = await getMqttFilteredPage(page, limit, group_id, search);
            return res_query.data;
        });
    }
};
