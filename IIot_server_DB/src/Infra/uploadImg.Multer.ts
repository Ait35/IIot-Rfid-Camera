import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../service/helper_func.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ให้เซฟไปที่โฟลเดอร์ public/uploads 
    cb(null, path.join(__dirname, '../../public/uploadsImg'));
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำกัน เช่น cam_G1_D1_DOOR1_1696312345.jpg
    try{
      const {log_id} = JSON.parse(req.body.Jsondata);
      console.log(log_id);
      if(!log_id){
      return cb(new Error('Missing required parameters: log_id' ),  file.originalname);
    }
      const uniqueSuffix = Service.getFormattedTimestamp() + '_' + Math.round(Math.random() * 1e4);
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `M_cam-l${log_id}-${uniqueSuffix}${ext}`);
      // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      // const ext = path.extname(file.originalname) || '.jpg';
      // cb(null, `cam_${uniqueSuffix}${ext}`);
    }
    catch (error) {
      console.error('Error parsing JSON:', error);
      return cb(new Error('Invalid JSON in request body') , file.originalname);
    }

    
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // จำกัดขนาดไฟล์สูงสุด 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  },
});