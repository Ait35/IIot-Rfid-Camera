import { Router } from 'express';
import { rateLimitSseIP } from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import { registerSseClient } from '../../Infra/SSE.js';
const router = Router();

router.get('/iiot/events/stream', rateLimitSseIP, authMiddleware, (req, res) => {
  registerSseClient(req, res);
});

export default router;