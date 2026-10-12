import { Router , Request , Response} from 'express';
import { Signin_control , Login_control, Logout_control }from '../../Controller/user_control.js';
import { rateLimitLoginAndSignin } from '../../Middlewares/rateLimit.Middleware.js';
import { authMiddleware } from '../../Middlewares/auth.middleware.js';

const router = Router();

router.post('/iiot/login', rateLimitLoginAndSignin, Login_control );
router.post('/iiot/signin', rateLimitLoginAndSignin, Signin_control );
router.post('/iiot/logout', authMiddleware, Logout_control );
router.get('/', (_req:Request, res:Response) => { //ต้องใส่ req เข้าไปเป็นตัวแรกเสมอ ถึงไม่ได้ใช้ก็ตาม
  res.status(404).send('404 Not Found');
});

export default router;
//ใน TypeScript นิยมใช้ _req เพื่อบอกว่าเราตั้งใจละเว้นไม่ใช้งานตัวแปรนี้