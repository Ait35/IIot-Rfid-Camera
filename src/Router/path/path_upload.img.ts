import { Router } from 'express';
import { upload_img_control } from '../../Controller/Img.control/upload.control.js';
import {upload}  from '../../Infra/uploadImg.Multer.js';
import { Auth_uploadImg } from '../../Middlewares/auth.uploadImg.js';
import { rateLimitImageUpload } from '../../Middlewares/rateLimit.Middleware.js';

const path_upload_img = Router();

path_upload_img.post('/iiot/post/upload_img', rateLimitImageUpload, Auth_uploadImg, upload.single('img'), upload_img_control);

export default path_upload_img;