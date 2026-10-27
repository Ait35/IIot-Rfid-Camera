import { getDataOneCoulum } from '../../Repository/ReadQuery.js';
import net from 'net';
import Service from '../helper_func.js';
import { updateMoreThen1 } from '../../Repository/updataQuery.js';

export const Process  = {
    async checkCameraAlive (group_id : number){
        console.log("==============================================")
        console.log(`Keep Alive Ip cam group ${group_id}`)
        try{
            const res = await getDataOneCoulum(
                        "ip_camera",
                        ["ip_cam_id" ,"ip" ,"rtsp_url" ,"onvif_url","snapshot_url" ,"status"], 
                        ["group_id", "is_delete"],
                        [group_id , false],
                        "group_id ASC"
                    );
            if(!res.success || !res.data || res.data.length === 0){
                return res;
            }
            const results = await Promise.allSettled(
                res.data.map(camInfo => Process.Socket_TCP_Check(camInfo))
            );

            return await Service.executeWithLog(
                'checkCameraAlive', 'ip_camera', 'UPDATE', null,
                async (transaction) => {
                    const res_query = await updateMoreThen1(
                        'ip_camera' , 
                        "ip_cam_id",
                        res.data.map(obj => +(obj.ip_cam_id)),
                        ["status" , "last_active_at"],
                        [
                            results.map(obj => (obj as any).value?.status ?? false),
                            results.map(obj => (obj as any).value?.date ?? null)
                        ],
                        ["is_delete"],
                        [false],
                        transaction
                    );

                    return {
                        result: res_query,
                        recordId: group_id, // บันทึกว่า Action นี้อัปเดตกล้องของกลุ่ม group_id ไหน
                        logPayload: {
                            group_id,
                            cameras: results.map((r: any) => r.value)
                        }
                    };
                }
            );
        }catch (error: any){
            console.error(`❌ checkCameraAlive group ${group_id} error:`, error?.message || error);
            return { success: false, status: 500, error: error?.message || 'Check camera alive failed' };
        }
    },
    async Socket_TCP_Check (camInfo :any):Promise<any>{
        return new Promise(resolve => {
            const port = Service.getCameraPort(
                camInfo.rtsp_url,
                camInfo.onvif_url,
                camInfo.snapshot_url
            )
            const socket = new net.Socket();
            socket.setTimeout(300);

            socket.on('connect', () => {
                socket.destroy();

                console.log(`IP: ${camInfo.ip} port: ${port} -> ✅ success`)
                resolve({ip_cam_id: camInfo.ip_cam_id , status: true ,date: new Date()}); // กล้องเปิดอยู่และตอบสนอง!
            });
            socket.on('timeout', () => {
                socket.destroy();

                console.log(`IP: ${camInfo.ip} port: ${port} -> ❌ time out`)
                resolve({ip_cam_id: camInfo.ip_cam_id , status: false, date: null});
            });
            socket.on('error', () => {
                socket.destroy();
    
                console.log(`IP: ${camInfo.ip} port: ${port} -> ❌ error`)
                resolve({ip_cam_id: camInfo.ip_cam_id , status: false, date: null});
            });
            
            socket.connect(port, camInfo.ip);
        }
    )}
}
