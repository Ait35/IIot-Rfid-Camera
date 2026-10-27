import { Helper } from '../Class_service.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateData } from '../../Repository/updataQuery.js';
import { CreateIP_CamInput, UpdateIP_CamInput } from '../../schemas/ip_cam.schema.js';
import { probeCamera } from '../../Infra/ONVIF/onvif.js';

export const IP_CamWrite = {
    async post_IP_cam(Input_data: CreateIP_CamInput, By_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: post_IP_cam service -----');
        try{
            if(Input_data.ONVIF_url){
                Input_data.ONVIF_url = await Helper.Service.cleanUrl(Input_data.ONVIF_url);
            }

            if(!Input_data.mac && Input_data.ONVIF_url){
                const probe_res = await probeCamera(
                    Input_data.ONVIF_url,
                    Input_data.cam_username? Input_data.cam_username : '',
                    Input_data.cam_password? Input_data.cam_password : ''
                );
                if(!probe_res.success || !probe_res.mac){
                    if(await Helper.Service.pingIP(Input_data.ip)){
                        const arpMac = await Helper.Service.getMacFromArp(Input_data.ip);
                        if (arpMac) {
                            Input_data.mac = arpMac;
                            console.log('✅ Get MAC Address from Arp Successful:', arpMac);
                        } else {
                            // 🌟 ถ้า Ping เจอ แต่ ARP ไม่ได้ MAC (เช่น อยู่นอกวง Subnet)
                            return {
                                success: false,
                                status: 400,
                                error: 'พบ IP กล้อง แต่ไม่สามารถอ่าน MAC Address ได้ (อาจอยู่คนละ Subnet) กรุณาระบุ MAC ด้วยตนเอง'
                            };
                        }
                    }else{
                        console.log('❌ Unable to get MAC Address from Arp!');

                        return {
                            success: false,
                            status: 500,
                            error: 'Error: Unable to probe camera',
                            details: probe_res.error
                        };
                    }
                }else{
                    Input_data.mac = probe_res.mac;
                }
                probe_res.rtsp_url? Input_data.rtsp_url = probe_res.rtsp_url : '';
                probe_res.snapshot_url? Input_data.snapshot_url = probe_res.snapshot_url : '';
            }

            if(Input_data.rtsp_url){
                Input_data.rtsp_url = await Helper.Service.cleanUrl(Input_data.rtsp_url);
            }
            if(Input_data.snapshot_url){
                Input_data.snapshot_url = await Helper.Service.cleanUrl(Input_data.snapshot_url);
            }
            const insertPayload = {
                ...Input_data,
                by_user_id: By_user_id,
            };

            return await Helper.Service.executeWithLog(
                'post_IP_cam', 'ip_camera', 'INSERT', By_user_id,
                async (transaction) => {
                    const res_query = await InsertData('ip_camera', insertPayload, transaction);
                    
                    return {
                        result: res_query,
                        recordId: res_query.data.ip_cam_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                        logPayload: { id_cam: res_query.data.ip_cam_id, ip_address, user_agent: userAgent }
                    };
                }
            );
        }catch(error){
            console.error('Error occurred while saving data to database:', error);
            return { success: false, status: 500, error: 'Error occurred while saving data to database' };
        }
    },

    async update_IP_cam(Input_data: UpdateIP_CamInput, By_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: patch_IP_cam service -----');
        try{
            // แยก ip_cam_id ออกจากฟิลด์ที่จะ UPDATE (เพื่อไม่ให้ชนกับ Identity column ของ Postgres)
            const { ip_cam_id, ...updatePayload } = Input_data; 

            if(updatePayload.ONVIF_url){
                updatePayload.ONVIF_url = await Helper.Service.cleanUrl(updatePayload.ONVIF_url);
            }
            if(updatePayload.rtsp_url){
                updatePayload.rtsp_url = await Helper.Service.cleanUrl(updatePayload.rtsp_url);
            }
            if(updatePayload.snapshot_url){
                updatePayload.snapshot_url = await Helper.Service.cleanUrl(updatePayload.snapshot_url);
            }

            return await Helper.Service.executeWithLog(
                'update_ip_cam', 'ip_camera', 'UPDATE', By_user_id,
                async (transaction) => {
                    let result;

                    if (updatePayload.is_delete !== undefined) {
                        result = await Helper.Query.Tran_SetDelete(
                            'ip_camera', 
                            'ip_cam_id', 
                            ip_cam_id,
                            updatePayload.is_delete,
                            transaction
                        );
                    } else {
                        result = await updateData(
                            'ip_camera', 
                            'ip_cam_id', 
                            ip_cam_id,
                            true, 
                            updatePayload, 
                            transaction
                        );
                    }
        
                    return {
                        result,
                        recordId: ip_cam_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                        logPayload: { ...Input_data, ip_address, user_agent: userAgent }
                    };
                }
            );
        }catch(error){
            console.error('Error occurred while updating data to database:', error);
            return { success: false, status: 500, error: 'Error occurred while updating data to database' };
        }
    }
};  
