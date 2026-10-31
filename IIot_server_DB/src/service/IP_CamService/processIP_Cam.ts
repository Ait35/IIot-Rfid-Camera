import { getDataOneCoulum } from '../../Repository/ReadQuery.js';
import Helper from '../helper_func.js';
import { updateMoreThen1 } from '../../Repository/updataQuery.js';
import { SubProcess } from './SubProsessIP_Cam.js';
import { PoolClient } from 'pg';
import { MultiInsert } from '../../Repository/insertQuery.js';

export const MainProcess  = {
    async checkCameraAlive (group_id : number){
        try{
            const res = await getDataOneCoulum(
                        "ip_camera",
                        [
                            "ip_cam_id" ,
                            "ip" ,
                            "rtsp_url" ,
                            "onvif_url",
                            "snapshot_url" ,
                            "keep_alive_port",
                            "status"
                        ], 
                        ["group_id", "is_delete"],
                        [group_id , false],
                        "group_id ASC"
                    );
            if(!res.success || !res.data || res.data.length === 0){
                return res;
            }
            const results = await Promise.allSettled(
                res.data.map(camInfo => SubProcess.Socket_TCP_Check(camInfo))
            );

            // อัปเดตสถานะ status และ last_active_at โดยตรง (ไม่บันทึกลง activity_log เพื่อลดขยะใน DB)
            const res_query = await updateMoreThen1(
                'ip_camera' , 
                "ip_cam_id",
                res.data.map(obj => +(obj.ip_cam_id)),
                ["status" , "last_active_at" , "up_time"],
                [
                    results.map(obj => (obj as any).value?.status ?? false),
                    results.map(obj => (obj as any).value?.date ?? null),
                    results.map(obj => (obj as any).value?.date ?? null)
                ],
                ["is_delete"],
                [false]
            );
            if(res_query.success){
                console.log("✅ action: UPDATE Successful!");
            };
            return res_query;
        }catch (error: any){
            console.error(`❌ checkCameraAlive group ${group_id} error:`, error?.message || error);
            return { success: false, status: 500, error: error?.message || 'Check camera alive failed' };
        }
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
                    ["group_id", "is_delete"],
                    [group_id , false],
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
                            get_data.data.map(() => +(log_id)),
                            get_data.data.map(obj => +(obj.ip_cam_id)),
                            get_data.data.map(() => null),
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
