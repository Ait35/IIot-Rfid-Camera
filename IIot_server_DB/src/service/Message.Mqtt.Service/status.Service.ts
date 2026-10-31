import { updateData } from '../../Repository/updataQuery.js';

interface C_Status {
    up_time? : string;
    hw_uptime? : string;
    status? : boolean;
    last_active_at : string;
}

export const updateStatusService = async (payload : any) => {
    const statusDevice : C_Status = {
        ...(payload.up_time !== undefined && { up_time : payload.up_time }),
        ...(payload.hw_uptime !== undefined && { hw_uptime : payload.hw_uptime }),
        ...(payload.status !== undefined && { status : payload.status }),
        last_active_at : 'now()' 
    }

    if(statusDevice.status === false){
        console.warn(`🔴 [Device Offline] ID: ${payload.device_id}`);
    }else if(statusDevice.status === true){
        // Status is OK, keep silent to reduce log spam
    }

    // อัปเดตสถานะ device_info โดยตรง ไม่ต้องเขียนลง activity_log ซ้ำซากทุกรอบ heartbeat
    const result = await updateData('device_info', 'device_id', payload.device_id, true, statusDevice);
    return result;
}
