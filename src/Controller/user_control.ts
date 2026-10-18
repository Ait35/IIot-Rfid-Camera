import { Response , Request} from 'express';
import { SigninService } from '../service/AccoutService/sigin_source.js';
import { LoginService } from '../service/AccoutService/login_source.js';

export const Signin_control = async (req:Request, res:Response) => {
    console.log('----- API action: user control -----');
    try {
        //กรอก data จาก wed ครบเปล่า
        const { university_id , password } = req.body;
        const ipAddress = req.ip || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        if(!university_id || !password){
            console.log('missing university id or password');
            return res.status(400).json({error: 'Missing university id or password'});
        }

        //เรียก service
        const sigin_res = await SigninService.signin(university_id, password , ipAddress, userAgent); //return Json

        if(!sigin_res.success){
            console.log('error in sigin service :' , sigin_res);
            console.log(`❌ Sigin failed`);
            return res.status(sigin_res.status).json(sigin_res);
        }

        console.log('✅ Sigin success');
        res.status(200).json(sigin_res);
    } catch (error) {
        console.error('error in user control');
        res.status(500).json({ error: 'error in user control' });
    } finally {
      console.log(`============================================`);
    }
};

export const Login_control = async (req:Request, res:Response) => {
    console.log('----- API action: user control -----');
    try {
        //กรอก data จาก wed ครบเปล่า
        const { university_id , password } = req.body;
        const ipAddress = req.ip || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        if(!university_id || !password){
            console.log('missing university id or password');
            return res.status(400).json({error: 'Missing university id or password'});
        }

        //เรียก service
        const login_res = await LoginService.login(university_id, password, ipAddress, userAgent); //return Json

        if(!login_res.success){
            console.log('error in sigin service :' , login_res);
            console.log(`❌ Login failed`);
            return res.status(login_res.status).json(login_res);
        }

        console.log('✅ Login success');
        res.status(200).json(login_res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error});
    } finally {
        console.log(`============================================`);
    }
};

import { LogoutService } from '../service/AccoutService/logout_source.js';
import { update_acc } from '../service/AccoutService/update.acc.js';

export const Logout_control = async (req: Request, res: Response) => {
    console.log('----- API action: logout control -----');
    try {
        const userId = (req as any).payload?.user_id;
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';

        if (!userId) {
            console.log('missing user_id in payload');
            return res.status(400).json({ error: 'Missing user authentication' });
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
        const { password , role , is_delete } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';

        if (!userId) {
            console.log('missing user_id in payload');
            return res.status(401).json({ error: 'Missing user authentication' });
        }
        if (!password && !role && is_delete === undefined) {
            console.log('missing password or is_delete in payload');
            return res.status(400).json({ error: 'Missing password or is_delete' });
        }

        const whitelist = ['admin', 'dev', 'student' , 'teacher'];
        if(role !== undefined && !whitelist.includes(role)){
            console.log('ไม่อยู่ในรายการที่อนุญาตให้เปลี่ยนไปใช้งาน');
            return res.status(400).json({ error: 'ไม่อยู่ในรายการที่อนุญาตให้เปลี่ยนไปใช้งาน' });
        }

        const update_res = await update_acc(Number(userId), password, role, ipAddress, userAgent, is_delete);

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