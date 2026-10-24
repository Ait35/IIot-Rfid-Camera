import { Router , Request , Response} from 'express';
import{ Auth_reqConnect } from '../../Middlewares/auth.reqConnect.js';
import { rateLimitAccGlobal , rateLimitIPGlobal, rateLimitIotConnect } from '../../Middlewares/rateLimit.Middleware.js';
import { device_post_control, device_update_control } from '../../Controller/Device_control/write.control.js';
import { device_get_control } from '../../Controller/Device_control/read.control.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';

const router = Router();

router.post('/iiot/post/device', rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal , device_post_control );
router.post('/iiot/post/req_connect', rateLimitIotConnect, Auth_reqConnect);
router.get('/iiot/get/device',  rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal , device_get_control);
router.patch('/iiot/patch/device', rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal , device_update_control);

export default router;