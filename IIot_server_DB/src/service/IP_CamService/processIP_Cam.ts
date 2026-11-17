import { getDataOneCoulum } from '../../Repository/ReadQuery/helper.Read.Query.js';
import Helper from '../helper_func.js';
import { updateMoreThen1 } from '../../Repository/updataQuery.js';
import { SubProcess } from './SubProsessIP_Cam.js';
import { PoolClient } from 'pg';
import { MultiInsert } from '../../Repository/insertQuery/helper.insert.Query.js';
import { broadcastSse } from '../../Infra/SSE.js';
import { db } from '../../Infra/connect_db.js';

const CAMERA_ALIVE_COLUMNS = [
    "ip_cam_id",
    "ip",
    "rtsp_url",
    "onvif_url",
    "snapshot_url",
    "keep_alive_port",
    "up_time",
    "status",
];

async function chunkCamAndStartCheck(cameras: any[], chunkSize: number) {
    const tcpCheckResults: PromiseSettledResult<any>[] = [];

    for (let i = 0; i < cameras.length; i += chunkSize) {
        const cameraBatch = cameras.slice(i, i + chunkSize);
        const batchResults = await Promise.allSettled(
            cameraBatch.map(cam => SubProcess.Socket_TCP_Check(cam))
        );
        tcpCheckResults.push(...batchResults);
    }

    return tcpCheckResults;
}

async function updateCamStatusAndLog(
    cameras: any[],
    tcpCheckResults: PromiseSettledResult<any>[],
    logContext: string
) {
    if (db === null) {
        return { success: false, status: 500, message: 'DB not connect => Check camera alive failed' };
    }

    const {
        allCamIds,
        allStatuses,
        allActiveDates,
        ChangedCameras,
        activityLogCamIds,
        activityLogPayloads,
    } = cameras.reduce(
        (acc, cam, index) => {
            const tcpResult = (tcpCheckResults[index] as any)?.value;
            const isAlive = Boolean(tcpResult?.status ?? false);
            const activeDate = tcpResult?.date ?? null;

            acc.allCamIds.push(+cam.ip_cam_id);
            acc.allStatuses.push(isAlive);
            acc.allActiveDates.push(activeDate);

            // เก็บเฉพาะกล้องที่สถานะเปลี่ยน เพื่อส่ง SSE และลง activity_log
            if (Boolean(cam.status) !== isAlive) {
                acc.ChangedCameras.push({
                    kind: 'ip_camera',
                    ip_cam_id: cam.ip_cam_id,
                    status: isAlive,
                    up_time: cam.up_time,
                    last_active_at: activeDate,
                });
                acc.activityLogCamIds.push(cam.ip_cam_id);
                acc.activityLogPayloads.push({
                    status: isAlive,
                    up_time: cam.up_time,
                });
            }

            return acc;
        },
        {
            allCamIds: [] as number[],
            allStatuses: [] as boolean[],
            allActiveDates: [] as (Date | null)[],
            ChangedCameras: [] as {
                kind: string;
                ip_cam_id: number;
                status: boolean;
                up_time: number;
                last_active_at: Date | null;
            }[],
            activityLogCamIds: [] as number[],
            activityLogPayloads: [] as { status: boolean; up_time: number }[],
        }
    );

    const transaction = await db.connect();
    try {
        await transaction.query('BEGIN');
        const updateResult = await updateMoreThen1(
            'ip_camera',
            'ip_cam_id',
            allCamIds,
            ['status', 'last_active_at', 'up_time'],
            [allStatuses, allActiveDates, allActiveDates], // ใช้ allActiveDates ซ้ำสำหรับ last_active_at และ up_time
            ['is_delete'],
            [false],
            transaction
        );

        if (updateResult.success && ChangedCameras.length > 0) {
            broadcastSse('DevicesUpdate', ChangedCameras);
            await MultiInsert(
                'activity_log',
                ['user_id', 'action_type', 'target_table', 'target_id', 'payload'],
                [
                    Array(ChangedCameras.length).fill(null),
                    Array(ChangedCameras.length).fill('UPDATE'),
                    Array(ChangedCameras.length).fill('ip_camera'),
                    activityLogCamIds,
                    activityLogPayloads,
                ],
                transaction
            );
        }

        await transaction.query('COMMIT');
        return updateResult;
    } catch (error: any) {
        await transaction.query('ROLLBACK');
        console.error(`❌ ${logContext} error:`, error?.message || error);
        return { success: false, status: 500, error: error?.message || 'Check camera alive failed' };
    } finally {
        transaction.release();
    }
}

export const MainProcess = {
    async checkGroupCamAlive(group_id: number, chunkSize = 30) {
        if (db === null) {
            return { success: false, status: 500, message: 'DB not connect => Check camera alive failed' };
        }

        const groupCamerasRes = await getDataOneCoulum(
            "ip_camera",
            CAMERA_ALIVE_COLUMNS,
            ["group_id", "is_delete"],
            [group_id, false],
            "group_id ASC"
        );
        if (!groupCamerasRes.success || !groupCamerasRes.data || groupCamerasRes.data.length === 0) {
            return groupCamerasRes;
        }

        const tcpCheckResults = await chunkCamAndStartCheck(groupCamerasRes.data, chunkSize);
        return updateCamStatusAndLog(groupCamerasRes.data, tcpCheckResults, `checkGroupCamerasAlive (group ${group_id})`);
    },
    async checkAllCamAlive(chunkSize = 30) {
        if (db === null) {
            return { success: false, status: 500, message: 'DB not connect => Check camera alive failed' };
        }

        const allCamerasRes = await getDataOneCoulum(
            "ip_camera",
            CAMERA_ALIVE_COLUMNS,
            ["is_delete"],
            [false],
            "ip_cam_id ASC"
        );
        if (!allCamerasRes.success || !allCamerasRes.data || allCamerasRes.data.length === 0) {
            return allCamerasRes;
        }

        const tcpCheckResults = await chunkCamAndStartCheck(allCamerasRes.data, chunkSize);
        return updateCamStatusAndLog(allCamerasRes.data, tcpCheckResults, 'checkAllCamerasAlive');
    },
    async Prosecc_snapshot(log_id: string | number, group_id: number ){
        console.log("Prosecc_snapshot");
        try{
            const get_data = await getDataOneCoulum(
                    "ip_camera",
                    [
                        "ip_cam_id" ,
                        "ip", 
                        "cam_username" , 
                        "cam_password" , 
                        "cam_name",
                        "snapshot_url",
                        "auth"
                    ], //snapshot_url 
                    ["group_id", "status" ,"is_delete" ],
                    [group_id , true ,false ],
                    "group_id ASC"
                );

            if(!get_data.success){
                return {success: false, status: 400, error: "not sucess"};
            }
            if(!get_data.data){
                console.log("not found 404")
                return {success: false, status: 400, error: "not have img"};
            }  
            const result = await Promise.allSettled(
                get_data.data.map(item => SubProcess.fetch_snapshot(
                    +log_id, 
                    item.ip ,
                    item.snapshot_url ,
                    item.cam_username, 
                    item.cam_password,
                    item.auth
                ))
            );

            return await Helper.executeWithLog('Save snapshot Image', 'log_images', 'INSERT', null ,
                async (transaction: PoolClient)=>{
                    const res = await MultiInsert(
                        "log_images",
                        ["log_id", "ip_cam_id", "MCU_cam_id", "image_path"],
                        [
                            Array(get_data.data.length).fill(+log_id),
                            get_data.data.map(obj => +(obj.ip_cam_id)),
                            Array( get_data.data.length).fill(null),
                            result.map(obj => (obj as any).value?.path?? null)
                        ],
                        transaction
                    );

                    return {
                        result: res,
                        recordId: res.data[0]?.image_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                        logPayload: { 
                            image_id : res.data.map((r: any) => r.image_id),
                            ip_cam_id : res.data.map((r: any) => r.ip_cam_id),
                            image_path : res.data.map((r: any) => r.image_path)
                        }
                    };
                }
            );
        }
        catch{
            console.log("Error in get_URL_snapshot");
            return { success: false, status: 500, error: 'Error occurred while updating data to database' };
        }
    }
   
}
