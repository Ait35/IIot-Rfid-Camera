import { Router } from 'express';
import { getDashboardSummary } from '../../Controller/DashboardController/dashboard.controller.js';
import { rateLimitAccGlobal , rateLimitIPGlobal } from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';

const router = Router();

// /iiot/get/dashboard - Following the existing naming convention
router.get('/iiot/get/dashboard', rateLimitIPGlobal, authMiddleware, rateLimitAccGlobal, getDashboardSummary);

export default router;
