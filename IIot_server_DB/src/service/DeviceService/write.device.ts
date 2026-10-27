import { Helper } from '../Class_service.js';
import { publishMessage } from '../../Infra/Mqtt.infra.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateAndGet1Table } from '../../Repository/updataQuery.js';
import { getData } from '../../Repository/ReadQuery.js';
import { CreateDeviceInput, UpdateDeviceInput } from '../../schemas/device.schema.js';

export const DeviceWrite = {
    async post_device(inputData: CreateDeviceInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: post_device service -----');
        const { type, ...rest } = inputData;
        const req = {
            ...rest,
            device_type: type,
            key_api: Helper.Service.GenKeyApi(),
            by_user_id,
            ip: "127.0.0.1",
            gate_way: "127.0.0.1",
            subnet: "255.255.255.0",
        };

        return await Helper.Service.executeWithLog(
            'post_device service', 'device_info', 'INSERT', by_user_id,
            async (transaction) => {
                const res_query = await InsertData('device_info', req, transaction);
                
                return {
                    result: res_query,
                    recordId: res_query.data.device_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { ...inputData, ip_address, user_agent: userAgent }
                };
            }
        );
    },

    async update_device(inputData: UpdateDeviceInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: update_device service -----');
        const { device_id, is_delete, ...updatePayload } = inputData;
        const action = is_delete !== undefined ? (is_delete ? 'DELETE' : 'RESTORE') : 'UPDATE';

        return await Helper.Service.executeWithLog(
            'update_device service', 'device_info', action, by_user_id,
            async (transaction) => {
                let result;

                if (is_delete !== undefined) {
                    result = await Helper.Query.Tran_SetDelete('device_info', 'device_id', device_id, is_delete, transaction);
                } else {
                    result = await updateAndGet1Table('device_info', 'device_id', device_id, updatePayload, 'mqtt', 'group_id', 'group_id', transaction);
                }
                const Gettopic = await getData('mqtt', 'group_id', result.data.group_id, true, transaction);
                const topicCMD = `${process.env.MQTT_TOPIC_PUBLISH_CMD}/group${result.data.group_id}/${Gettopic.data.topic}/${result.data.mac}`;
                console.log('📩 TopicCam : ', topicCMD);
                await publishMessage(topicCMD, JSON.stringify({ CMD: "disconnect" }));
                return { 
                    result, 
                    recordId: device_id, 
                    logPayload: { ...inputData, ip_address, user_agent: userAgent, mqtt: "disconnect" }
                };
            }
        );
    }
};
