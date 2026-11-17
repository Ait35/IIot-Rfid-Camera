import { Router } from 'express';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import {
    rateLimitReadAcc,
    rateLimitReadIP,
    rateLimitWriteAcc,
    rateLimitWriteIP,
} from '../../Middlewares/rateLimit.Middleware.js';
import { mapTag_update_control } from '../../Controller/MapTag_control/write.control.js';
import { Tag_get_control } from '../../Controller/MapTag_control/read.control.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { UpdateTagSchema } from '../../schemas/tag.schema.js';

const router = Router();

router.patch('/iiot/patch/tag', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(UpdateTagSchema), mapTag_update_control);
router.get('/iiot/get/tag', rateLimitReadIP, authMiddleware, rateLimitReadAcc, Tag_get_control);

export default router;
