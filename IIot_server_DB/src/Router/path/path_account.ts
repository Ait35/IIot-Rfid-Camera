import { Router } from 'express';
import { Signin_control, Login_control, Logout_control, update_acc_control, get_accounts_control } from '../../Controller/user_control.js';
import {
    rateLimitLoginAndSignin,
    rateLimitReadAcc,
    rateLimitReadIP,
    reqLimitUpdateAcc,
} from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware, firstDevOrAuthMiddleware } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { LoginSchema, SigninSchema, UpdateAccountSchema } from '../../schemas/auth.schema.js';

const router = Router();

router.post('/iiot/login', rateLimitLoginAndSignin, validate(LoginSchema), Login_control);
router.post('/iiot/register-account', rateLimitLoginAndSignin, firstDevOrAuthMiddleware, validate(SigninSchema), Signin_control);
router.post('/iiot/logout', authMiddleware, Logout_control);
router.get('/iiot/get/users', rateLimitReadIP, authMiddleware, rateLimitReadAcc, get_accounts_control);
// router.get('/iiot/get/me', rateLimitReadIP, authMiddleware, rateLimitReadAcc, get_my_profile_control);
router.patch('/iiot/patch/account', authMiddleware, reqLimitUpdateAcc, validate(UpdateAccountSchema), update_acc_control);

export default router;
