import { Router } from 'express';
import { IP_cam_post_control, Ip_cam_update_control } from '../../Controller/IP_camController/write.control.js';
import { IP_cam_get_control } from '../../Controller/IP_camController/read.control.js';
import { rateLimitAccGlobal, rateLimitIPGlobal } from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import { CreateIP_CamSchema, UpdateIP_CamSchema } from '../../schemas/ip_cam.schema.js';
import { validate } from '../../Middlewares/validate.middleware.js';

const router = Router();

router.post(
    '/iiot/post/ip_cam',
    rateLimitIPGlobal, 
    authMiddleware, 
    rateLimitAccGlobal, 
    validate(CreateIP_CamSchema),
    IP_cam_post_control
);

router.get(
    '/iiot/get/ip_cam',
    rateLimitIPGlobal,
    authMiddleware,
    rateLimitAccGlobal,
    IP_cam_get_control
);

router.patch(
    '/iiot/patch/ip_cam', 
    rateLimitIPGlobal, 
    authMiddleware, 
    rateLimitAccGlobal, 
    validate(UpdateIP_CamSchema),
    Ip_cam_update_control
);

export default router;
