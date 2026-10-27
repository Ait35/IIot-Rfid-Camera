// import { DeviceQuery } from '../Class_service.js'
import { Helper } from '../Class_service.js';
import { publishMessage } from '../../Infra/Mqtt.infra.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateAndGet1Table} from '../../Repository/updataQuery.js';
import { getData } from '../../Repository/ReadQuery.js';

interface user_req {
    by_user_id?: string;
    device_name?: string;
    device_type?: string;
    group_id?: number;
    mac?: string;
    ip?: string;
    subnet?: string;
    gate_way?: string;
    last_active_at?: string;
    hw_uptime?: number;
    local?: string;
    is_delete?: boolean;
    status?: boolean;
    key_api?: string;
 } 

export const DeviceWrite = {
    async post_device(
        device_name: string, mac: string, local: string, by_user_id: string, group_id: number,
        type: string, ip_address: string, userAgent: string
    ) {
        const req = {
            key_api: Helper.Service.GenKeyApi(),
            device_name, mac, local, group_id, device_type: type, by_user_id,
            ip: "127.0.0.1", gate_way: "127.0.0.1", subnet: "255.255.255.0",
        };

        return await Helper.Service.executeWithLog(
            'post_device service', 'device_info', 'INSERT', by_user_id,
            async (transaction) => {
                const res_query = await InsertData('device_info', req, transaction);
                
                return {
                    result: res_query,
                    recordId: res_query.data.device_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { device_name, mac, group_id, local, ip_address, user_agent: userAgent }
                };
            }
        );
    },
    async update_device(
        device_id : number,
        device_name : string | undefined ,
        device_type : string | undefined,
        group_id: number | undefined,
        // mac อัพไม่ได้
        ip:string | undefined,
        subnet:string | undefined,
        gate_way:string | undefined,
        last_active_at: string | undefined,
        hw_uptime: number | undefined,
        local:string | undefined,
        is_delete:boolean | undefined,
        status:boolean | undefined,
        key_api:string | undefined,

        by_user_id: string,
        ip_address:string,
        userAgent:string)
    {
        
        const req : user_req = {
            ...(device_name !== undefined && {device_name}),
            ...(device_type !== undefined && {device_type}),
            ...(group_id !== undefined && {group_id}),
            ...(ip !== undefined && {ip}),
            ...(subnet !== undefined && {subnet}),
            ...(gate_way !== undefined && {gate_way}),
            ...(last_active_at !== undefined && {last_active_at}),
            ...(hw_uptime !== undefined && {hw_uptime}),
            ...(local !== undefined && {local}),
            ...(is_delete !== undefined && {is_delete}),
            ...(status !== undefined && {status}),
            ...(key_api !== undefined && {key_api})
        }

        const action = is_delete !== undefined ? (is_delete ? 'DELETE' : 'RESTORE') : 'UPDATE';

        return await Helper.Service.executeWithLog(
            'update_device service', 'device_info', action, by_user_id,
            async (transaction) => {
                let result;

                if (is_delete !== undefined) {
                    result = await Helper.Query.Tran_SetDelete('device_info', 'device_id', device_id, is_delete, transaction);
                } else {
                    
                    result = await updateAndGet1Table('device_info', 'device_id', device_id, req, 'mqtt', 'group_id', 'group_id', transaction);
                }
                const Gettopic = await getData ('mqtt', 'group_id', result.data.group_id, true, transaction);
                const topicCMD = 
                    `${process.env.MQTT_TOPIC_PUBLISH_CMD}/group${result.data.group_id}/${Gettopic.data.topic}/${result.data.mac}`;
                console.log('📩 TopicCam : ', topicCMD);
                await publishMessage(topicCMD, JSON.stringify({CMD : "disconnect"}));
                return { 
                    result, 
                    recordId: device_id, 
                    logPayload : { ...req, ip_address, user_agent: userAgent , mqtt: "disconnect" } };
            }
        );
    }
}