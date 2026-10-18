import { Helper } from './Class_service.js';
import { InsertData } from '../Repository/insertQuery.js';
import { PoolClient } from 'pg';
import { getData } from '../Repository/ReadQuery.js';

interface Log_img { 
    log_id: string;
    camera_device_id : number;
    image_path: string;
}

export const ImageService = {
    async processUploadedImage(log_id: string , device_id: number , group_id: number , imagePath: string) {
        console.log('----- API action: UploadedImage service -----');
        try{
            //ส่ง ecp / log id มา เอามาเช็ค cache ถ้าไม่เจอก็เข้าไปหาใน log rfid 
            const result = await Helper.Service.ChackCacheAndSave('log_id', log_id, 'log_rfid', 'log_id' , false);
            //return ค่าของ log_rfid ออกมาหมดเลย
            if(!result.success){
                console.log(result);
                return result;
            }
            if(result.data === null){
                console.log('ไม่พบ log_rfid ที่ต้องการส่งรูปภาพ');
                return {success: false, status: 404, error: 'ไม่พบ log_rfid ที่ต้องการส่งรูปภาพ'};
            }

            // ดึงข้อมูลเครื่อง RFID ที่สร้าง log นี้ขึ้นมา
            const rfidDevice = await getData("device_info", "device_id", result.data.device_id, true);
            if (!rfidDevice.success || rfidDevice.data === null) {
                return { success: false, status: 404, error: 'ไม่พบข้อมูลเครื่อง RFID ที่เกี่ยวข้อง' };
            }
            // ตรวจสอบว่าเครื่อง RFID กับ กล้องอยู่กลุ่มเดียวกันไหม
            if (rfidDevice.data.group_id !== group_id) {
                console.log('กล้องและเครื่อง RFID ไม่ได้อยู่กลุ่มเดียวกัน!');
                return { success: false, status: 400, error: 'กล้องและเครื่อง RFID ไม่ได้อยู่ในกลุ่มเดียวกัน' };
            }
            
            const log_img : Log_img = {
                log_id,
                camera_device_id :device_id,
                image_path : imagePath
            }
            
            return await Helper.Service.executeWithLog('UploadedImage service', 'log_images', 'INSERT', null ,
                async (transaction: PoolClient)=>{
                    const result = await InsertData('log_images', log_img, transaction);

                    return {
                        result,
                        recordId: result.data.image_id,
                        logPayload: log_img
                    }
                });
        }catch(error){
            console.error('Error occurred while checking cache or fetching data from database:', error);
            throw error;
        }
    }
}