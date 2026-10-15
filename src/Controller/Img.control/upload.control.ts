import { Response , Request} from 'express';
import { ImageService } from '../../service/image.service.js';

export const upload_img_control = async ( req:Request , res:Response ) => {
    try{    
        const { log_id , device_id ,mac} = JSON.parse(req.body.Jsondata);
        const file = req.file;
        
        if (!file) {
            console.log('ไม่พบไฟล์รูปภาพ');
            return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });;
        }
        if (!log_id  || !device_id || !mac) {
            console.log('not found log id or ecp');
            return  res.status(400).json({ error: 'not found log id or ecp' });
        }
        console.log('uploading file');
        const imagePath = `/uploads/${file.filename}`;

        const result = await ImageService.processUploadedImage(log_id , device_id , imagePath);
        if (!result.success) {
            console.log(result);
            return res.status(result.status).json(result);
        }
        
        return res.status(200).json(result);
    }catch(error){
        console.error('Upload Error:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการจัดการรูปภาพ' });
    }
}