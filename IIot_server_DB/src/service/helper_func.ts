import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

import {PoolClient} from 'pg';
import { db } from '../Infra/connect_db.js';
import { ActivityLogService } from '../Repository/Activity_Log/ActivityQuery.js';
import { QueryRedis } from '../Infra/Redis/cache.js';
import { getData } from '../Repository/ReadQuery.js';

const execPromise = util.promisify(exec);

export interface ITokenPayload {
    user_id: string; //ให้ สัญญาวาเป็นรูปแบบ ojb นี้แน่นอน
}

const Service = {
    genToken (user_id : string){
        const token = jwt.sign(
            { user_id }, // ยัด ีuser id ไว้
            process.env.JWT_SECRET!,
            { expiresIn: '1h' } // หมดอายุใน 1 วัน
        );
        return token;
    },

    verifyToken (token: string){
        try {
            // jwt.verify จะคืนค่า Object Payload ที่เรายัดไว้ตอนแรกออกมา
            const decoded = jwt.verify(token, process.env.JWT_SECRET!)  as ITokenPayload; //ให้ สัญญาวาเป็นรูปแบบ ojb นี้แน่นอน
    
            return decoded; 
        } catch (error) {
            console.log('Token expired or invalid');
            return null; // ถ้าพัง คืนค่า null 
        }
    },
    GenKeyApi (){
        const randomString = crypto.randomBytes(32).toString('hex');
        return `dev_${randomString}`;
    },
    async readAndWriteLog (
        actionName : string,
        table : string,
        by_user_id: number | null,
        target_id: number | null,
        Callfunction:() => Promise<{ result: any; logPayload: any }>
    ){
        console.log(`----- API action: ${actionName} -----`);
         
        try{
            const {result, logPayload} = await Callfunction();
            // ตรวจสอบว่าเป็น Array ไหม ถ้าไม่ใช่ให้แปลงเป็น Array ชั่วคราวเพื่อทำ map
            const isArray = Array.isArray(result);
            let cleanData: any = null;

            if (result !== null && result !== undefined) {
                const data = isArray ? result : [result];
                const mapped = data.map((Item: any) => {
                    if (!Item || typeof Item !== 'object') return Item;
                        const { first_name, ...temp } = Item;
                        return { ...temp, ...(first_name !== undefined && { by_user_name: first_name }) };
                    });
                cleanData = isArray ? mapped : mapped[0];
            }

            if(logPayload.device_id){
                target_id = logPayload.device_id;
            }
            const System_log = await ActivityLogService.Insert_logAction(
                Number(by_user_id) || null,
                'GET',
                table, 
                target_id,
                logPayload
            );
            if(!System_log.success){
                console.log(System_log);
                return System_log;
            }

            console.log('----- Add System Log Successful! -----');
            console.log(' ✅ Get Successful! ');
            return { success: true, status: 200, data: isArray ? cleanData : cleanData };
        }catch(error : any){
            console.error(`❌ Database ROLLBACK [${table} - GET]:`,error);
            return { success: false, status: error.status || 500, error: error.message };
        }
    },
    async executeWithLog (
        actionName: string, // ชื่อ API เอาไว้ log console
        table: string,
        action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE',
        by_user_id: string | null,
        Callfunction: (transaction: PoolClient) => Promise<{ result: any; recordId: number; logPayload: any }> //Promise คือ async ที่จะ return มาให้ สัญญาวาเป็น Promise
    ) {
        console.log(`----- action: ${actionName} -----`);
        if (!db) return { success: false, status: 500, error: 'Database not connected' };

        const transaction = await db.connect();
        try {
            await transaction.query('BEGIN');

            const { result, recordId, logPayload } = await Callfunction(transaction);

            await ActivityLogService.Insert_logAction(
                Number(by_user_id) || null, // ถ้า by_user_id เป็น null ให้ส่ง null ไป
                action,
                table,
                recordId, //มันคือ target_id 
                logPayload,
                transaction
            );

            await transaction.query('COMMIT');
            console.log(`✅ action: Add system log Successful!`);
            console.log(`✅ ${action} ${table} Successful!`);
            
            return result;
        } catch (error) {
            await transaction.query('ROLLBACK');
            console.error(`❌ Database ROLLBACK [${table} - ${action}]:`, error);
            throw error; 
        } finally {
            transaction.release();
        }
    },
    async ChackCacheAndSave (prefix : string, cacheKey : string, DBtable : string , DBcolumn : string, has_delete : boolean = true,
        callfunction?: (data: any) => Promise<{ success: boolean; status: number; data?: any; error?: string }>) {
        console.log('----- action: chack Cache -----');
        try{
            const cache_result = await QueryRedis.getCache(cacheKey , prefix);

            if(!cache_result.success){
                console.log('----- Error while checking cache -----');
                return {success: false, status: 500, error: 'Error while checking cache' };
            }

            if (cache_result.success && cache_result.status === 404) {
                console.log('⏳ Cache Miss: Call to Database');
                const db_data = await getData(DBtable, DBcolumn, cacheKey, has_delete);
                //select * from map_tag where epc = cacheKey and is_delete = false

                if(db_data && db_data.status === 404){
                    console.log('----- Data not found in database -----');
                    return {success: false, status: 404, error: 'Data not found' };
                }
                if(!db_data){
                    console.log('----- Error while fetching data from database -----');
                    return {success: false, status: 500, error: 'Error while fetching data from database' };
                }

                let DB_Data = db_data.data;
                if(callfunction){
                    console.log('----- Call custom function -----');
                    const customResult = await callfunction(DB_Data); //getData กรณีที่ต้องการ map key กับข้อมูลในตารางอื่น
                    if(!customResult.success){
                        console.log('----- Error while calling custom function -----');
                        return {success: false, status: 500, error: 'Error while calling custom function' };
                    }
                    if(customResult.data === null){
                        console.log('----- Custom function returned no data -----');
                        return {success: false, status: 404, error: 'Data not found' };
                    }
                    DB_Data = customResult.data;
                }
                const saveCache = await QueryRedis.setCache(cacheKey, prefix, DB_Data);

                if(!saveCache.success){
                    console.log('----- Error while saving data to cache -----');
                    return {success: false, status: 500, error: 'Error while saving data to cache' };
                }else{
                    return {success: true, status: 200, data: DB_Data};
                }
            }
            
            console.log('✅ Cache Hit! ');
            //console.log(cache_result.data);
            return {success: true, status: 200, data: cache_result.data };
        }catch(error){
            console.error('Error occurred while checking cache or fetching data from database:', error);
            throw error
        }
    },
    async pingIP(ip: string): Promise<boolean> {
        try{
            await execPromise(`ping -n 1 -w 1000 ${ip}`)
            return true;
        } catch {
            return false;
        }
    },
    async getMacFromArp(ip: string): Promise<string> {
        try{
            const { stdout } = await execPromise(`arp -a ${ip}`);
            const matchIP = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
            return matchIP ? matchIP[0].replace(/[:-]/g, '').toUpperCase() : '';;
        } catch {
            return '';
        }
    },
    async cleanUrl(url: string){
        if(!url) return '';

        try{
            const parsed = new URL(url);

            if(parsed.username){
                parsed.username = '';
            }
            if(parsed.password){
                parsed.password = '';
            }

            const chackParsed = [
                'user',
                'username',
                'pwd',
                'pass',
                'password'
            ].some(item => parsed.searchParams.has(item));
                
            if(chackParsed){
                parsed.searchParams.delete('user');
                parsed.searchParams.delete('username');
                parsed.searchParams.delete('pwd');
                parsed.searchParams.delete('pass');
                parsed.searchParams.delete('password');
            }

            return parsed.href;
        }catch(error){
            console.log('Error while cleaning url:', error);
            return url;
        }
    },
    getCameraPort(rtsp_url?: string, onvif_url?: string , snapshot_url?: string): number {
        let defaultPort = 554;

        if (rtsp_url) {
            const match = rtsp_url.match(/:(\d+)(?=[/?#]|$)/); 
            if(match){
                return Number(match[1]) 
            }else{
                defaultPort = 554;
            } 
        }
        if (onvif_url) {
            const match = onvif_url.match(/:(\d+)(?=[/?#]|$)/); 
            if(match){
                return Number(match[1]) 
            }else{
                defaultPort = 80;
            } 
        } 
        if (snapshot_url) {
            const match = snapshot_url.match(/:(\d+)(?=[/?#]|$)/); 
            if(match){
                return Number(match[1]) 
            }else{
                defaultPort = 81;
            }  
        }
        
        return 554;
    }
  
}

export default Service;