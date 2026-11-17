import { Router } from 'express';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import {
    rateLimitReadAcc,
    rateLimitReadIP,
    rateLimitWriteAcc,
    rateLimitWriteIP,
} from '../../Middlewares/rateLimit.Middleware.js';
import { MPost_control, Mqtt_updata_control } from '../../Controller/Mqtt_control/write.control.js';
import { MGet_control } from '../../Controller/Mqtt_control/read.control.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { CreateMqttSchema, UpdateMqttSchema } from '../../schemas/mqtt.schema.js';

const router = Router();

router.post('/iiot/post/mqtt', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(CreateMqttSchema), MPost_control);
router.get('/iiot/get/mqtt', rateLimitReadIP, authMiddleware, rateLimitReadAcc, MGet_control);
router.patch('/iiot/patch/mqtt', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(UpdateMqttSchema), Mqtt_updata_control);

export default router;
