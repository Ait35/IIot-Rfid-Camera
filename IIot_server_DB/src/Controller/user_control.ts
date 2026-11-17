import { Response, Request } from 'express';
import { SigninService } from '../service/AccoutService/sigin_source.js';
import { LoginService } from '../service/AccoutService/login_source.js';
import { LogoutService } from '../service/AccoutService/logout_source.js';
import { update_acc } from '../service/AccoutService/update.acc.js';
import { AccountRead } from '../service/AccoutService/read.acc.js';
import { getData } from '../Repository/ReadQuery/helper.Read.Query.js';
import { LoginInput, SigninInput, UpdateAccountInput } from '../schemas/auth.schema.js';
import { Query } from '../Repository/helperQuery.js';

export const Signin_control = async (req: Request, res: Response) => {
    console.log('----- API action: user signin control -----');
    try {
        const inputData: SigninInput = req.body;
        const ipAddress = req.ip || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const isFirstSetup = Boolean((req as any).isFirstSetup);

        let assignedRole: 'admin' | 'dev' | 'teacher' = 'dev';
        let byUserId: number | undefined;

        if (!isFirstSetup) {
            const callerId = (req as any).payload?.user_id;
            if (!callerId) {
                return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user authentication' });
            }
            const callerRes = await getData('users', 'user_id', Number(callerId), true);
            const callerRole = callerRes.data?.role;
            if (callerRole !== 'dev' && callerRole !== 'teacher') {
                return res.status(403).json({ success: false, status: 403, error: 'เฉพาะ dev หรือ teacher เท่านั้นที่สามารถสร้างบัญชีใหม่ได้' });
            }
            byUserId = Number(callerId);
            assignedRole = inputData.role ?? 'admin';
        }

        const sigin_res = await SigninService.signin(inputData, ipAddress, userAgent, assignedRole, byUserId);

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
    try{
        const userId = (req as any).payload?.user_id;
        const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';

        if (!userId) {
            console.log('missing user_id in payload');
            return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user authentication' });
        }

        const inputData: UpdateAccountInput = req.body;
        const getUser = await getData('users', 'user_id', Number(userId), true);
        const getTraget = await getData('users', 'user_id', Number(inputData.traget_id), true);

        if(!getUser.data?.role || !getTraget.data?.role){
            console.log(`"404 not found"`);
            return res.status(404).json({error: "404 not found"});
        }
        const userRole : string = getUser.data.role;
        const tragetRole : string = getTraget.data.role;

        //'admin' < 'teacher' == 'dev'
        if(userRole !== "admin" && userRole !== "teacher" && userRole !== "dev"){
            console.log(`accout id ${userId} Role ${userRole} no premisstion`);
            return res.status(403).json({error: "You accout no premisstion"});
        }

        if (inputData.password || inputData.role){
            if(userRole === "admin" && (tragetRole === "teacher" || tragetRole === "dev")){
                console.log(`accout id ${userId} Role ${userRole} no premisstion to edit accout id ${inputData.traget_id} Role ${tragetRole}`);
                return res.status(403).json({error: "You accout no premisstion"});
            }
        }
        if(userRole === "admin" && (inputData.role === "teacher" || inputData.role === "dev")){
                console.log(`accout id ${userId} Role ${userRole} no premisstion to assign Role ${inputData.role}`);
                return res.status(403).json({error: "You accout no premisstion"});
        }

        if(inputData.is_delete !== undefined){
            if(userRole === "admin" && (tragetRole === "teacher" || tragetRole === "dev")){
                console.log(`accout id ${userId} Role ${userRole} no premisstion to delete accout id ${inputData.traget_id} Role ${userRole}`);
                return res.status(403).json({error: "You accout no premisstion"});
            }
        }   
        const update_res = await update_acc(inputData, Number(userId), ipAddress, userAgent);
        
        if (!update_res.success) {
            console.log('error in update_acc service:', update_res);
            console.log(`❌ Update_acc failed`);
            return res.status(update_res.status).json(update_res);
        }else if(inputData.password && update_res.success){
            console.log('✅ Update_acc success');
            res.status(200).json(update_res);
            await LogoutService.logout(update_res.data.user_id ,ipAddress,userAgent);
        }

        console.log('✅ Update_acc success');
        res.status(200).json(update_res);
    }catch(error){
        console.error('error in update_acc control:', error);
        res.status(500).json({ error: 'error in update_acc control' });
    } finally {
        console.log(`============================================`);
    }
};

export const get_accounts_control = async (req: Request, res: Response) => {
    console.log('----- API action: get_accounts control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = (req.query.role as string)?.trim() || undefined;
    const search = (req.query.search as string)?.trim() || undefined;
    const is_delete = req.query.is_delete === 'true';
    const start_date = Query.parseDateTime(req.query.start_date ?? req.query.start_at);
    const end_date = Query.parseDateTime(req.query.end_date ?? req.query.end_at);

    if (!userId) {
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user authentication' });
    }

    try {
        const users_res = await AccountRead.get_accounts(
            page,
            limit,
            role,
            search,
            is_delete,
            start_date,
            end_date
        );
        if (!users_res.success) {
            return res.status(users_res.status).json(users_res);
        }
        return res.status(200).json(users_res);
    } catch (error) {
        console.error('error in get_accounts_control:', error);
        return res.status(500).json({ success: false, status: 500, error: 'error in get_accounts_control' });
    }
};
// export const get_my_profile_control = async (req: Request, res: Response) => {
//     console.log('----- API action: get_my_profile control -----');
//     try {
//         const userId = (req as any).payload?.user_id;
//         if (!userId) {
//             return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user authentication' });
//         }
//         const userRes = await getData('users', 'user_id', Number(userId), true);
//         if (!userRes.success || !userRes.data) {
//             return res.status(404).json({ success: false, status: 404, error: 'User not found' });
//         }
//         const user = Array.isArray(userRes.data) ? { ...userRes.data[0] } : { ...userRes.data };
//         delete user.password;
//         delete user.token;
//         return res.status(200).json({ success: true, status: 200, data: user });
//     } catch (error) {
//         console.error('error in get_my_profile_control:', error);
//         return res.status(500).json({ success: false, status: 500, error: 'Internal Server Error' });
//     }
// };
