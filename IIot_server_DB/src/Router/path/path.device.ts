import { Router } from 'express';
import { Auth_reqConnect } from '../../Middlewares/auth.reqConnect.js';
import {
    rateLimitReadAcc,
    rateLimitReadIP,
    rateLimitWriteAcc,
    rateLimitWriteIP,
    rateLimitIotConnect,
} from '../../Middlewares/rateLimit.Middleware.js';
import { device_post_control, device_update_control } from '../../Controller/Device_control/write.control.js';
import { device_get_control } from '../../Controller/Device_control/read.control.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { CreateDeviceSchema, UpdateDeviceSchema } from '../../schemas/device.schema.js';

const router = Router();

router.post('/iiot/post/device', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(CreateDeviceSchema), device_post_control);
router.post('/iiot/post/req_connect', rateLimitIotConnect, Auth_reqConnect);
router.get('/iiot/get/device', rateLimitReadIP, authMiddleware, rateLimitReadAcc, device_get_control);
router.patch('/iiot/patch/device', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(UpdateDeviceSchema), device_update_control);

export default router;
