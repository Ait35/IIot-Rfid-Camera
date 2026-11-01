import { Helper } from '../Class_service.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateData } from '../../Repository/updataQuery.js';
import { CreateIP_CamInput, UpdateIP_CamInput, ProbeIP_CamInput } from '../../schemas/ip_cam.schema.js';
import { probeCamera } from '../../Infra/ONVIF/onvif.js';
import { SubProcess } from './SubProsessIP_Cam.js';
import { getData } from '../../Repository/ReadQuery.js';

export const IP_CamWrite = {
    async post_IP_cam(Input_data: CreateIP_CamInput, By_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: post_IP_cam service -----');
        try{
            //ถ้ามี ONVIF_url และยังไม่มีข้อมูลครบ ให้ลอง Probe ดูก่อน
            let res;
            if (Input_data.ONVIF_url && (!Input_data.mac || !Input_data.rtsp_url || !Input_data.snapshot_url || !Input_data.brand || !Input_data.model)) {
                res = await probeCamera(
                    Input_data.ONVIF_url,
                    Input_data.cam_username || '',
                    Input_data.cam_password || ''
                );
                if (res?.success) {
                    if (!Input_data.mac && res.mac) Input_data.mac = res.mac;
                    if (!Input_data.brand && res.brand) Input_data.brand = res.brand;
                    if (!Input_data.model && res.model) Input_data.model = res.model;
                    if (!Input_data.rtsp_url && res.rtsp_url) Input_data.rtsp_url = res.rtsp_url;
                    if (!Input_data.snapshot_url && res.snapshot_url) Input_data.snapshot_url = res.snapshot_url;
                }
            }

            // ถ้าสุดท้ายแล้ว ยังไม่มี MAC ค่อย Fallback ไป Ping + ARP
            if (!Input_data.mac) {
                const ping = await Helper.Service.pingIP(Input_data.ip);
                if (ping) {
                    const arpMac = await Helper.Service.getMacFromArp(Input_data.ip);
                    if (arpMac) {
                        Input_data.mac = arpMac;
                        console.log('✅ Get MAC Address from Arp Successful:', arpMac);
                    } else {
                        return {
                            success: false,
                            status: 400,
                            error: 'พบ IP กล้อง แต่ไม่สามารถอ่าน MAC Address ได้ (อาจอยู่คนละ Subnet) กรุณาระบุ MAC ด้วยตนเอง'
                        };
                    }
                } else {
                    console.log('❌ Unable to get MAC Address from Arp!');
                    return {
                        success: false,
                        status: 500,
                        error: 'Error: Unable to probe camera',
                        details: "ping ไม่เจอ ip กล้อง"
                    };
                }
            }

            let KeepAlivePort: number = 80;
            if(Input_data.snapshot_url){
                Input_data.snapshot_url = await Helper.Service.cleanUrl(Input_data.snapshot_url);
                KeepAlivePort = SubProcess.getCameraPort(Input_data.snapshot_url);
            }else if(Input_data.rtsp_url){
                Input_data.rtsp_url = await Helper.Service.cleanUrl(Input_data.rtsp_url);
                KeepAlivePort = SubProcess.getCameraPort(Input_data.rtsp_url);
            }else if(Input_data.ONVIF_url){
                KeepAlivePort = SubProcess.getCameraPort(Input_data.ONVIF_url);
            }
          
            let detectedAuth = null;
            if (Input_data.auth && Input_data.auth !== 'auto') {
                detectedAuth = Input_data.auth;
            } else {
                detectedAuth = await SubProcess.CheckAuthType(
                    Input_data.cam_username ? Input_data.cam_username : null,
                    Input_data.cam_password ? Input_data.cam_password : null,
                    Input_data.snapshot_url ? Input_data.snapshot_url : null
                ) || 'query';
            }

            const insertPayload = {
                ...Input_data,
                by_user_id: By_user_id,
                keep_alive_port: Input_data.keep_alive_port && Input_data.keep_alive_port !== 'auto' ? Number(Input_data.keep_alive_port) : KeepAlivePort,
                auth: detectedAuth
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
            if (updatePayload.ONVIF_url) {
                updatePayload.ONVIF_url = await Helper.Service.cleanUrl(updatePayload.ONVIF_url);
                // ถ้าไม่ได้ส่ง snapshot_url หรือ rtsp_url มาใน PATCH ให้ลอง Probe ดึงมาเติมให้
                if (!updatePayload.snapshot_url || !updatePayload.rtsp_url) {
                    let camData: any = null;
                    const user = updatePayload.cam_username;
                    const pass = updatePayload.cam_password;
                    if (!user || !pass) {
                        camData = (await getData('ip_camera', 'ip_cam_id', ip_cam_id, true)).data;
                    }
                    const finalUser = user || camData?.cam_username || '';
                    const finalPass = pass || camData?.cam_password || '';

                    const probeRes = await probeCamera(updatePayload.ONVIF_url, finalUser, finalPass);
                    if (probeRes?.success) {
                        if (!updatePayload.brand && probeRes.brand) updatePayload.brand = probeRes.brand;
                        if (!updatePayload.model && probeRes.model) updatePayload.model = probeRes.model;
                        if (!updatePayload.rtsp_url && probeRes.rtsp_url) updatePayload.rtsp_url = probeRes.rtsp_url;
                        if (!updatePayload.snapshot_url && probeRes.snapshot_url) updatePayload.snapshot_url = probeRes.snapshot_url;
                    }
                }
            }
            if (updatePayload.rtsp_url) updatePayload.rtsp_url = await Helper.Service.cleanUrl(updatePayload.rtsp_url);
            if (updatePayload.snapshot_url) updatePayload.snapshot_url = await Helper.Service.cleanUrl(updatePayload.snapshot_url);

            const url = updatePayload.snapshot_url || updatePayload.rtsp_url || updatePayload.ONVIF_url;

            if (updatePayload.keep_alive_port === 'auto' && url) {
                const port = SubProcess.getCameraPort(url);
                updatePayload.keep_alive_port = port || 80;

            }else if(updatePayload.keep_alive_port === 'auto' && !url){
                const currentCam = await getData('ip_camera', 'ip_cam_id', ip_cam_id , true);
                const get_Url = currentCam.data?.snapshot_url || currentCam.data?.rtsp_url || currentCam.data?.onvif_url;

                const port = SubProcess.getCameraPort(get_Url);
                updatePayload.keep_alive_port = port || 80;
            };

            if (updatePayload.auth === 'auto') {
                let data ;
                if(!url || !updatePayload.cam_username || !updatePayload.cam_password){
                    data = (await getData('ip_camera', 'ip_cam_id', ip_cam_id , true)).data;
                }

                const detectedAuth = await SubProcess.CheckAuthType(
                    updatePayload.cam_username? updatePayload.cam_username : data.cam_username ,
                    updatePayload.cam_password? updatePayload.cam_password : data.cam_password, 
                    url? url : (data.snapshot_url || data.rtsp_url || data.onvif_url)
                );
                updatePayload.auth = (detectedAuth? detectedAuth : "query") as UpdateIP_CamInput['auth']; 
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
    },

    async probe_IP_cam(Input_data: ProbeIP_CamInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: probe_IP_cam service -----');
        try {
            let ip = Input_data.ip;
            let onvifUrl = Input_data.ONVIF_url;
            let user = Input_data.cam_username;
            let pass = Input_data.cam_password;

            // ถ้าส่ง ip_cam_id มา ให้ดึงข้อมูลที่มีอยู่ใน DB มาเป็นค่าเริ่มต้น
            if (Input_data.ip_cam_id) {
                const currentCam = await getData('ip_camera', 'ip_cam_id', Input_data.ip_cam_id, true);
                if (currentCam.success && currentCam.data) {
                    ip = ip || currentCam.data.ip;
                    onvifUrl = onvifUrl || currentCam.data.onvif_url;
                    user = user !== undefined ? user : currentCam.data.cam_username;
                    pass = pass !== undefined ? pass : currentCam.data.cam_password;
                }
            }

            if (onvifUrl) {
                onvifUrl = await Helper.Service.cleanUrl(onvifUrl);
            }

            let probeResult: any = null;
            if (onvifUrl) {
                probeResult = await probeCamera(onvifUrl, user || '', pass || '');
            }

            // ค้นหา MAC จาก ONVIF หรือ ARP
            let mac: string | null = probeResult?.mac || null;
            if (!mac && ip) {
                const ping = await Helper.Service.pingIP(ip);
                if (ping) {
                    mac = await Helper.Service.getMacFromArp(ip);
                }
            }

            let rtspUrl = probeResult?.rtsp_url || null;
            let snapshotUrl = probeResult?.snapshot_url || null;
            if (snapshotUrl) snapshotUrl = await Helper.Service.cleanUrl(snapshotUrl);
            if (rtspUrl) rtspUrl = await Helper.Service.cleanUrl(rtspUrl);

            const targetUrl = snapshotUrl || rtspUrl || onvifUrl || null;
            const port = targetUrl ? SubProcess.getCameraPort(targetUrl) : 80;
            const auth = (user && pass && snapshotUrl)
                ? await SubProcess.CheckAuthType(user, pass, snapshotUrl) || 'query'
                : 'query';

            return {
                success: true,
                status: 200,
                data: {
                    ip: ip || null,
                    mac: mac || null,
                    brand: probeResult?.brand || null,
                    model: probeResult?.model || null,
                    serial: probeResult?.serial || null,
                    ONVIF_url: onvifUrl || null,
                    rtsp_url: rtspUrl,
                    snapshot_url: snapshotUrl,
                    keep_alive_port: port,
                    auth: auth
                }
            };
        } catch (error: any) {
            console.error('Error in probe_IP_cam:', error);
            return { success: false, status: 500, error: error?.message || 'Error occurred while probing camera' };
        }
    }
};  
