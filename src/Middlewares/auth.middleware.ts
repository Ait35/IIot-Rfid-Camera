import { Request, Response, NextFunction } from 'express';
import HelperService from '../service/helper_func.js';
import { QueryRedis } from '../Infra/Redis/cache.js';

export const authMiddleware = async (req:Request, res:Response, next:NextFunction) => {;
    console.log('----- API action: authMiddleware -----');
    const authHeader = req.headers.authorization; //ดึงจาก http header
    // รูปแบบถูกต้อง (ขึ้นต้นด้วย Bearer) ไหม
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Unauthorized: ไม่พบ Token');
        return res.status(401).json({ message: 'Unauthorized: ไม่พบ Token' });
    }
    //มาแบบนี้ Bearer Token เลยตัดช่องว่างตรงกลางออก จะได้เป้นอาเรย์ Bearer[0] Toekn[1]
    const token = authHeader.split(' ')[1];  //เลือก index 1 มาใช้
    console.log('Token :', token);

    if (!token) {
        console.log('You do not have permission to access this page');
        return res.status(401).json({ message: 'You do not have permission to access this page' });
    }

    try {
        const decoded = HelperService.verifyToken(token);
        const redisSession = await QueryRedis.getCache(String((decoded as any).user_id), 'session');
    
        if (!redisSession.data) {
            // กรณีที่ 1 ไม่มีใน Redis อาจจะหมดเวลา หรือกด Logout ไปแล้ว
            return res.status(401).json({ message: 'Session expired or logged out' });
        }
        if (redisSession.data.token !== token) {
            // กรณีที่ 2 Token ไม่ตรงกับใน Redis แปลว่ามีคนล็อกอินซ้อน Token นี้เลยกลายใช้ไม่ได้
            return res.status(401).json({ message: 'Logged in from another device. You have been kicked out!' });
        }
        // กัน Crash
        if (!(req as any).payload) {
            (req as any).payload = {};
        }

        (req as any).payload = decoded; //.ใส่ user id ที่เกะจาก token ไว้ที่ key payload (เป็น key ตั้งใหม่)
        console.log(decoded);

        next();
    } catch (error) {
        res.status(401).json({ message: 'กรุณาใช้ Token เข้าสู่ระบบ' });
    }
};