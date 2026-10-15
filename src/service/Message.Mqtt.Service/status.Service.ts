import { updateData } from '../../Repository/updataQuery.js';
import { Helper } from '../Class_service.js';

interface C_Status {
    up_time? : string;
    hw_uptime? : string;
    status? : boolean;
    last_active_at : string;
}

export const updateStatusService =  async (payload : any) => {
    console.log('----- Mqtt action: update status -----');
    const statusDevice : C_Status = {
        ...(payload.up_time !== undefined && { up_time : payload.up_time }),
        ...(payload.hw_uptime !== undefined && { hw_uptime : payload.hw_uptime }),
        ...(payload.status !== undefined && { status : payload.status }),
        last_active_at : 'now()' 
    }

    if(statusDevice.status === false){
        console.log('🔴 Device down');
    }else if(statusDevice.status === true){
        console.log('🟢 Device up');
    }
    return await Helper.Service.executeWithLog(
            'update_device service', 'device_info', 'UPDATE',null,
                async (transaction) => {
                    const result = await updateData('device_info', 'device_id', payload.device_id, true ,statusDevice, transaction);
                    console.log('Save status in DB : ', result.data);
                    return { 
                        result, 
                        recordId:  payload.device_id , 
                        logPayload : { ...statusDevice, ip_address : result.data.ip, mac_address: result.data.mac} 
                    };
                }
            )

}
            // return await Helper.Service.executeWithLog(
            // 'update_device service', 'device_info', 'UPDATE',null,
            //     async (transaction) => {
            //         const result = await updateData('device_info', 'device_id', payload.device_id, statusDevice, transaction);
            //         console.log('Save result in DB : ', result);
            //         return { 
            //             result, 
            //             recordId:  payload.device_id , 
            //             logPayload : { ...statusDevice, ip_address : result.data.ip, mac_address: result.data.mac} 
            //         };
            //     }
            // )