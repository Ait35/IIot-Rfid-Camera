import { Router , Request , Response} from 'express';
import{ authMiddleware } from '../../Middlewares/auth.middleware.js';
import { rateLimitReadAcc, rateLimitReadIP } from '../../Middlewares/rateLimit.Middleware.js';
import { Log_get_control, SystemLog_get_control } from '../../Controller/LogReader_control/read.control.js';

const router = Router();

router.get('/iiot/get/log', rateLimitReadIP, authMiddleware, rateLimitReadAcc, Log_get_control);
router.get('/iiot/get/system-log', rateLimitReadIP, authMiddleware, rateLimitReadAcc, SystemLog_get_control);

export default router;