import redis from './connect_redis.js';

export const QueryRedis = {
    async setCache(IncomeKey: string, Prefix : string, Data: any) {
        console.log(`----- API action: set${Prefix}Cache  -----`);
        if (!redis) {
            return { success: false, status: 500, error: 'Redis not connected' };
        }
        //deviceAuth
        try {
            // สร้าง Key ให้มี Prefix ชัดเจน จะได้ไม่ไปปนกับข้อมูลอื่น
            const key = `${Prefix}:${IncomeKey}`;
            
            // แปลง Object เป็น String ก่อนบันทึกลง Redis
            const stringData = JSON.stringify(Data);

            const result = await redis.set(key, stringData, {
                EX: 3600 // ]ลบออกใน 1 ชั่วโมง
            });
        
            console.log(`✅ Saved Cache for ${key} -> result:`, result);
            return { success: true, status: 200, data: result };
        } catch (error) {
            console.error('Redis Set Error:', error);
            return { success: false, status: 500, error: 'Failed to set Redis' };
        }
    },

    // แปลงกลับเป็น Object
    async getCache(IncomeKey: string , Prefix : string) {
        console.log(`----- API action: get${Prefix}Cache  -----`);
        if (!redis) {
            return { success: false, status: 500, error: 'Redis not connected' };
        }

        try {
            const key = `${Prefix}:${IncomeKey}`;
            const resultString = await redis.get(key);

            // ถ้าระบบหาไม่เจอ (Cache Miss) มันจะ return ค่าเป็น null ออกมา
            if (!resultString) {
                console.log(`Cache Miss for ${key}`);
                return { success: true, status: 404, data: null };
            }

            const FromCache = JSON.parse(resultString);
            
            return { success: true, status: 200, data: FromCache };
        } catch (error) {
             console.error('Redis Get Error:', error);
             return { success: false, status: 500, error: 'Failed to get Redis' };
        }
    },
    async delCache(IncomeKey: string , Prefix : string) {
        console.log(`----- API action: del${Prefix}Cache  -----`);
        if (!redis) {
            return { success: false, status: 500, error: 'Redis not connected' };
        }
        try {
            const key = `${Prefix}:${IncomeKey}`;
            const result = await redis.del(key);
            console.log(`Deleted Cache for ${key} -> result:`, result);
            return { success: true, status: 200, data: result };
        } catch (error) {
            console.error('Redis Del Error:', error);
            return { success: false, status: 500, error: 'Failed to delete Redis' };
        }
    }
}