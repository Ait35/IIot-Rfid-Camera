import { fetch_data } from '../../External_api/pull_apt.js';
import { db } from '../../Infra/connect_db.js';
import { LoginQuery } from '../../Repository/loginQuery.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';
import { Helper } from '../Class_service.js';
import HelperService from '../helper_func.js';
import { QueryRedis } from '../../Infra/Redis/cache.js';
import { updateData } from '../../Repository/updataQuery.js';
import { LoginInput } from '../../schemas/auth.schema.js';

export const LoginService = {
    async login(inputData: LoginInput, ip: string, userAgent: string) {
        console.log('----- API action: login service -----');

        if (!db) {
            throw new Error('ไม่มีการเชื่อมต่อกับ DB ได้');
        }

        const { university_id, password } = inputData;

        // หาใน database
        const res_db = await LoginQuery.Login(university_id, password);

        if (res_db.status !== 200 || res_db.data === 0) {
            console.log(res_db.error);
            return res_db;
        }
        const userInfo = res_db.data; // ตรวจสอบ token ถ้ายังไม่หมดอายุจะใช้ token เดิม
        const auth = HelperService.verifyToken(userInfo.token);
        let res_api = null;
        if (auth === null) { // หมดอายุต้องเจนใหม่ แต่ต้องเช็คก่อนเผื่อไม่ได้เป็นคนของ ม. ละ
            console.log("------- Fetch API ------");
            res_api = await fetch_data(university_id);

            if (!res_api.data) { 
                console.log('not data from api');
                return { success: false, status: 400, error: 'not data from api' };
            }
            // data จาก api ตรวจสอบว่าเป็นคนของ ม. ไหม
            const profile = res_api.data;
            if (!profile.status || profile.status === 'graduated' || profile.status === 'suspended') {
                const res = await Helper.Query.SetDelete('Users', 'user_id', userInfo.user_id, true);
                if (!res.success) {
                    console.log('Failed to delete user :', res);
                    return res;
                }
                await QueryRedis.delCache(String(userInfo.user_id), 'session');
                console.log('You are not student of university :', university_id);
                return { success: false, status: 400, error: `You are not student of university : ${university_id}` };
            }
        }
        const transaction = await db.connect();

        try {
            await transaction.query('BEGIN');

            const Token = HelperService.genToken(userInfo.user_id);
            await Helper.Query.Tran_updateToken(userInfo.user_id, Token, transaction);
            // อัพเดต Redis เสมอ เพื่อให้ Session ถูกรีเฟรช และมีข้อมูลตรงกับ Token ปัจจุบัน
            await QueryRedis.setCache(String(userInfo.user_id), 'session', { token: Token });
            console.log('✅Update Token Successful!');

            if (res_api !== null && res_api.data !== null) {
                if (res_db.data.first_name !== res_api.data.first_name || res_db.data.last_name !== res_api.data.last_name) {
                    const res_update = await updateData('users', 'user_id', res_db.data.user_id, true, {
                        first_name: res_api.data.first_name,
                        last_name: res_api.data.last_name
                    }, transaction);
                    if (!res_update.success) {
                        console.log('Failed to update name use old name :', res_update);
                    }
                }
            }
            await Helper.Query.Tran_updateTime('Users', 'last_login_at', 'user_id', userInfo.user_id, transaction);

            await ActivityLogService.Insert_logAction(userInfo.user_id, 'LOGIN', 'User', userInfo.user_id, {
                university_id: userInfo.university_id,
                role_at_login: userInfo.role,
                token_refreshed: true,
                ip_address: ip,
                user_agent: userAgent
            }, transaction);
            
            await transaction.query('COMMIT');
            
            console.log('----- Add System Log Successful! -----');
            return { success: true, status: 200, token: Token };
        } catch (error) {
            await transaction.query('ROLLBACK');
            console.error('❌ Rollback Transaction:', error);
            throw error;
        } finally {
            transaction.release();
        }
    }
};
