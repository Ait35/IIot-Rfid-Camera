import { Router, Request, Response } from 'express';
import { Signin_control, Login_control, Logout_control, update_acc_control, get_my_profile_control } from '../../Controller/user_control.js';
import { rateLimitLoginAndSignin, reqLimitUpdateAcc } from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validate.middleware.js';
import { LoginSchema, SigninSchema, UpdateAccountSchema } from '../../schemas/auth.schema.js';

const router = Router();

router.post('/iiot/login', rateLimitLoginAndSignin, validate(LoginSchema), Login_control);
router.post('/iiot/signin', rateLimitLoginAndSignin, validate(SigninSchema), Signin_control);
router.post('/iiot/logout', authMiddleware, Logout_control);
router.get('/iiot/get/me', authMiddleware, get_my_profile_control);
router.patch('/iiot/patch/account', authMiddleware, reqLimitUpdateAcc, validate(UpdateAccountSchema), update_acc_control);

export default router;
