import { Router , Request , Response} from 'express';
import{ authMiddleware } from '../../Middlewares/auth.middleware.js';
import { rateLimitAccGlobal , rateLimitIPGlobal } from '../../Middlewares/rateLimit.Middleware.js';
import { Tag_get_control } from '../../Controller/LogReader_control/read.control.js';

const router = Router();

router.get('/iiot/get/log',  rateLimitIPGlobal , authMiddleware, rateLimitAccGlobal , Tag_get_control );    

export default router;