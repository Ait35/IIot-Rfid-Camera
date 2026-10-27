import { Router } from 'express';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import { rateLimitAccGlobal, rateLimitIPGlobal } from '../../Middlewares/rateLimit.Middleware.js';
import { group_post_control, Group_update_control } from '../../Controller/Group_control/write.control.js';
import { Group_get_control } from '../../Controller/Group_control/read.control.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { CreateGroupSchema, UpdateGroupSchema } from '../../schemas/group.schema.js';

const router = Router();

router.post('/iiot/post/group', rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal, validate(CreateGroupSchema), group_post_control);
router.get('/iiot/get/group', rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal, Group_get_control);
router.patch('/iiot/patch/group', rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal, validate(UpdateGroupSchema), Group_update_control);

export default router;
