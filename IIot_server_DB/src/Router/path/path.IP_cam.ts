import { Router } from 'express';
import { IP_cam_post_control, Ip_cam_update_control, IP_cam_probe_control } from '../../Controller/IP_camController/write.control.js';
import { IP_cam_get_control } from '../../Controller/IP_camController/read.control.js';
import {
    rateLimitReadAcc,
    rateLimitReadIP,
    rateLimitWriteAcc,
    rateLimitWriteIP,
} from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import { CreateIP_CamSchema, UpdateIP_CamSchema, ProbeIP_CamSchema } from '../../schemas/ip_cam.schema.js';
import { validate } from '../../Middlewares/validate.middleware.js';

const router = Router();

router.post(
    '/iiot/post/ip_cam/probe',
    rateLimitWriteIP,
    authMiddleware,
    rateLimitWriteAcc,
    validate(ProbeIP_CamSchema),
    IP_cam_probe_control
);

router.post(
    '/iiot/post/ip_cam',
    rateLimitWriteIP,
    authMiddleware,
    rateLimitWriteAcc,
    validate(CreateIP_CamSchema),
    IP_cam_post_control
);

router.get(
    '/iiot/get/ip_cam',
    rateLimitReadIP,
    authMiddleware,
    rateLimitReadAcc,
    IP_cam_get_control
);

router.patch(
    '/iiot/patch/ip_cam',
    rateLimitWriteIP,
    authMiddleware,
    rateLimitWriteAcc,
    validate(UpdateIP_CamSchema),
    Ip_cam_update_control
);

export default router;
