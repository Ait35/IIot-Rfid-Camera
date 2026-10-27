import { Response, Request } from 'express';
import { SigninService } from '../service/AccoutService/sigin_source.js';
import { LoginService } from '../service/AccoutService/login_source.js';
import { LogoutService } from '../service/AccoutService/logout_source.js';
import { update_acc } from '../service/AccoutService/update.acc.js';
import { LoginInput, SigninInput, UpdateAccountInput } from '../schemas/auth.schema.js';

export const Signin_control = async (req: Request, res: Response) => {
    console.log('----- API action: user signin control -----');
    try {
        const inputData: SigninInput = req.body;
        const ipAddress = req.ip || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        const sigin_res = await SigninService.signin(inputData, ipAddress, userAgent);

        if (!sigin_res.success) {
            console.log('error in signin service :', sigin_res);
            console.log(`❌ Signin failed`);
            return res.status(sigin_res.status).json(sigin_res);
        }

        console.log('✅ Signin success');
        res.status(200).json(sigin_res);
    } catch (error) {
        console.error('error in user control:', error);
        res.status(500).json({ error: 'error in user control' });
    } finally {
        console.log(`============================================`);
    }
};

export const Login_control = async (req: Request, res: Response) => {
    console.log('----- API action: user login control -----');
    try {
        const inputData: LoginInput = req.body;
        const ipAddress = req.ip || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        const login_res = await LoginService.login(inputData, ipAddress, userAgent);

        if (!login_res.success) {
            console.log('error in login service :', login_res);
            console.log(`❌ Login failed`);
            return res.status(login_res.status).json(login_res);
        }

        console.log('✅ Login success');
        res.status(200).json(login_res);
    } catch (error) {
        console.error('error in login control:', error);
        res.status(500).json({ error: 'error in login control' });
    } finally {
        console.log(`============================================`);
    }
};

export const Logout_control = async (req: Request, res: Response) => {
    console.log('----- API action: logout control -----');
    try {
        const userId = (req as any).payload?.user_id;
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        if (!userId) {
            console.log('missing user_id in payload');
            return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user authentication' });
        }

        const logout_res = await LogoutService.logout(String(userId), ipAddress, userAgent);

        if (!logout_res.success) {
            console.log('error in logout service:', logout_res);
            console.log(`❌ Logout failed`);
            return res.status(logout_res.status).json(logout_res);
        }

        console.log('✅ Logout success');
        res.status(200).json(logout_res);
    } catch (error) {
        console.error('error in logout control:', error);
        res.status(500).json({ error: 'error in logout control' });
    } finally {
        console.log(`============================================`);
    }
};

export const update_acc_control = async (req: Request, res: Response) => {
    console.log('----- API action: update_acc control -----');
    try {
        const userId = (req as any).payload?.user_id;
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';

        if (!userId) {
            console.log('missing user_id in payload');
            return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user authentication' });
        }

        const inputData: UpdateAccountInput = req.body;
        const update_res = await update_acc(inputData, Number(userId), ipAddress, userAgent);

        if (!update_res.success) {
            console.log('error in update_acc service:', update_res);
            console.log(`❌ Update_acc failed`);
            return res.status(update_res.status).json(update_res);
        }

        console.log('✅ Update_acc success');
        res.status(200).json(update_res);
    } catch (error) {
        console.error('error in update_acc control:', error);
        res.status(500).json({ error: 'error in update_acc control' });
    } finally {
        console.log(`============================================`);
    }
};
