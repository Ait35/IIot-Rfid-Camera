import { fetch_data } from '../../External_api/pull_apt.js';
import { db } from '../../Infra/connect_db.js';
import { Helper } from '../Class_service.js';
import HelperService from '../helper_func.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { QueryRedis } from '../../Infra/Redis/cache.js';

interface user_req {
    university_id: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
}

export const SigninService = {
    async signin(university_id : string, password : string , ip:string , userAgent:string) {
        console.log('----- API action: signin service -----');
        if(!db) throw new Error('ไม่มีการเชื่อมต่อกับ DB ได้');

        //ดึง api ม. ต้องเปลี่ยนในอนาคต
        const res_api = await fetch_data(university_id);
        if(!res_api.success){
            console.log('not found university id :' , university_id);
            return {success : false, status : 400, error: `Invalid university id: ${university_id}`};
        }
        if(!res_api.data){ 
            console.log('not data from api');
            return {success : false,status : 400, error: 'not data from api'};
        }

        //data จาก api
        const profile = res_api.data;
        if(!profile.role || !profile.first_name || !profile.last_name){
            console.log('not found role or first name or last name');
            return {success : false, status : 400 , error: 'not found role or first name or last name'};
        }
        if(!profile.status || profile.status === 'graduated' || profile.status === 'suspended'){
            console.log('You are not student of university :' , university_id);
            return {success : false, status : 400, error: `You are not student of university : ${university_id}`};
        }
        const req : user_req = {
            university_id,
            password,
            role: profile.role,
            first_name: profile.first_name,
            last_name: profile.last_name,
        }
        const action = 'SIGIN';
        const table = 'Users';
        const transaction = await db.connect();
        try {
            await transaction.query('BEGIN');
            // insert user
            const result = await InsertData(table, req as any , transaction);

            //Generate Token ใหม่
            const accessToken = HelperService.genToken(result.data.user_id);
            await Helper.Query.Tran_updateToken(result.data.user_id , accessToken, transaction);
            await QueryRedis.setCache(String(result.data.user_id), 'session', { token: accessToken });
            
            console.log(`--- status : ${result.status} ---`);

            await ActivityLogService.Insert_logAction(result.data.user_id, action , 'User', result.data.user_id, {
                university_id : university_id,
                role_at_login : profile.role,
                ip_address : ip,
                user_agent : userAgent
            } , transaction);
            await transaction.query('COMMIT');
            result.data.token = accessToken; //เพิ่ม token ให้ data

            console.log('----- Add System Log Successful! -----');
            return result; //return Json 
        } catch (error) {
            await transaction.query('ROLLBACK');
            console.error('❌ Rollback Transaction:', error);
            throw error;
        }finally{
            transaction.release();
        }
    }
};