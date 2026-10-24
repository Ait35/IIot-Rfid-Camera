import { Request } from 'express';
import rateLimit from 'express-rate-limit';


export const rateLimitAccGlobal = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit 100 requests per windowMs
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req: Request): string => {
        const userId = (req as any).payload?.user_id;
        
        // ถ้ามี userId ให้ใช้ userId, ถ้าไม่มีให้ fallback ไปใช้ IP
        return String(userId || req.ip); 
    },
    message: {
        status: 429,
        error: 'Too many requests, please try again after 15 minutes'
    }
});

export const rateLimitIPGlobal = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true, // ส่งข้อมูล Rate limit กลับไปใน header (RateLimit-*)
    legacyHeaders: false, // ปิดการส่ง header แบบเก่า (X-RateLimit-*)
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

export const rateLimitLoginAndSignin = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true, 
    legacyHeaders: false, 
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after 5 minutes'
    }    
});
export const reqLimitUpdateAcc = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit 5 requests per windowMs
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req: Request): string => {
        const userId = (req as any).payload?.user_id;
        
        // ถ้ามี userId ให้ใช้ userId, ถ้าไม่มีให้ fallback ไปใช้ IP
        return String(userId || req.ip); 
    },
    message: {
        status: 429,
        error: 'Too many requests, please try again after 15 minutes'
    }
});

export const rateLimitIotConnect = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 นาที
    max: 500, 
    message: { status: 429, error: 'Too many connection requests from this IP' }
});

//ยังไม่ตรวจว่ามี key นี้ใน DB ไหม เพราะ เราแค่กันคนส่ง key ถี่ ถ้าไม่ครบโคต้าค่อยไปเช็คใน DB
export const rateLimitImageUpload = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 นาที
    max: 20, // รองรับได้ 20 รูปภาพต่อนาที (จาก api key เดียวกัน)
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req: Request): string => {
        let key_api = req.headers.authorization;

        if (key_api && key_api.startsWith('Bearer ')) {
            key_api = key_api.split(' ')[1];
        }
        
        // ถ้ามี userId ให้ใช้ userId, ถ้าไม่มีให้ fallback ไปใช้ IP
        return key_api || req.ip as string;
    },
    message: {
        status: 429,
        error: 'Image upload rate limit exceeded, camera is sending too fast'
    }
});