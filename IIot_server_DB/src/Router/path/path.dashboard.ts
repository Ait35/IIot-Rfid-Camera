import { Router } from 'express';
import { getDashboardSummary } from '../../Controller/DashboardController/dashboard.controller.js';
import { rateLimitReadAcc, rateLimitReadIP } from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';

const router = Router();

router.get('/iiot/get/dashboard', rateLimitReadIP, authMiddleware, rateLimitReadAcc, getDashboardSummary);

export default router;
