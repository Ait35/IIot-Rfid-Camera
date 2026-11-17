import { Router } from 'express';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import {
    rateLimitReadAcc,
    rateLimitReadIP,
    rateLimitWriteAcc,
    rateLimitWriteIP,
} from '../../Middlewares/rateLimit.Middleware.js';
import { group_post_control, Group_update_control } from '../../Controller/Group_control/write.control.js';
import { Group_get_control } from '../../Controller/Group_control/read.control.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { CreateGroupSchema, UpdateGroupSchema } from '../../schemas/group.schema.js';

const router = Router();

router.post('/iiot/post/group', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(CreateGroupSchema), group_post_control);
router.get('/iiot/get/group', rateLimitReadIP, authMiddleware, rateLimitReadAcc, Group_get_control);
router.patch('/iiot/patch/group', rateLimitWriteIP, authMiddleware, rateLimitWriteAcc, validate(UpdateGroupSchema), Group_update_control);

export default router;
