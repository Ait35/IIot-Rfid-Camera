import { updateData } from '../../Repository/updataQuery.js';
import { QueryRedis } from '../../Infra/Redis/cache.js';
import { broadcastSse } from '../../Infra/SSE.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';
import { db } from '../../Infra/connect_db.js';

interface C_Status {
    up_time? : string;
    hw_uptime? : string;
    status? : boolean;
    last_active_at : string;
}

export const updateStatusService = async (payload : any) => {
    const nowIso = new Date().toISOString();
    const statusDevice : C_Status = {
        ...(payload.up_time !== undefined && { up_time : payload.up_time }),
        ...(payload.hw_uptime !== undefined && { hw_uptime : payload.hw_uptime }),
        ...(payload.status !== undefined && { status : payload.status }),
        last_active_at : 'now()' 
    }
    const deviceKey = String(payload.device_id);
    const cached = await QueryRedis.getCache(deviceKey, 'device_status');
    const CachData = cached.status === 200 ? cached.data : null;

    if(statusDevice.status === false){
        console.warn(`🔴 [Device Offline] ID: ${payload.device_id}`);
    }

    // อัปเดตสถานะ device_info โดยตรง ไม่ต้องเขียนลง activity_log ซ้ำซากทุกรอบ heartbeat
    if(db === null) return{ success: false, status: 500, error: 'Database not connected' };
    const transaction = await db.connect();

    try{    
        await transaction.query('BEGIN');
        const result = await updateData('device_info', 'device_id', payload.device_id, true, statusDevice, transaction);
        if(result.success){
            console.log(`✅ [Device Status Updated] ID: ${payload.device_id}`);

            const hasIncomingStatus = statusDevice.status !== undefined;
            const newStatus = hasIncomingStatus ? Boolean(statusDevice.status) : Boolean(CachData?.status);
            const prevStatus = CachData?.status !== undefined ? Boolean(CachData.status) : undefined;
            const isStatusChanged = hasIncomingStatus && newStatus !== prevStatus;

            if (hasIncomingStatus) {
                await QueryRedis.setCache(deviceKey, 'device_status', {
                    status: newStatus,
                    last_seen: nowIso,
                });
            }

            if(isStatusChanged){
                broadcastSse('DevicesUpdate', [
                    {
                        kind: 'device',
                        device_id: Number(payload.device_id),
                        status: newStatus,
                        last_active_at: nowIso,
                    },
                ]);
                await ActivityLogService.Insert_logAction(
                    null ,
                    "UPDATE" ,
                    "device_info" ,
                    payload.device_id ,
                    {hw_uptime : result.data.hw_uptime, status: newStatus},
                    transaction
                );
            }
        }else{
            console.error(`❌ [Failed to Update Device Status] ID: ${payload.device_id}`);
        }

        await transaction.query('COMMIT');
        return result;
    }catch (error) {
        await transaction.query('ROLLBACK');
        console.error(`❌ Database ROLLBACK`)
        throw error; 
    } finally {
        transaction.release();
    }
}
