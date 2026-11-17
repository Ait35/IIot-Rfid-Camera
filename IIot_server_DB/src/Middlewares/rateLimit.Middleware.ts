import { Request } from 'express';
import rateLimit from 'express-rate-limit';

const getUserOrIpKey = (req: Request): string => {
    const userId = (req as any).payload?.user_id;
    return String(userId || req.ip);
};

export const rateLimitReadAcc = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 600, // 600 requests / 15 นาที ต่อบัญชี (~40 req/นาที)
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: getUserOrIpKey,
    message: {
        status: 429,
        error: 'Too many read requests, please try again later'
    }
});

export const rateLimitReadIP = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 2000, // สูงกว่ารายบัญชี เพื่อรองรับผู้ใช้หลายคนใน LAN / Wi-Fi เดียวกัน
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too many read requests from this IP, please try again later'
    }
});

export const rateLimitWriteAcc = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100, // 100 write requests / 15 นาที ต่อบัญชี
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: getUserOrIpKey,
    message: {
        status: 429,
        error: 'Too many write requests, please try again after 15 minutes'
    }
});

export const rateLimitWriteIP = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too many write requests from this IP, please try again after 15 minutes'
    }
});

//SSE Stream Limiter — กันการเปิด/reconnect ท่อ SSE รัวผิดปกติ
export const rateLimitSseIP = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too many SSE stream connections from this IP'
    }
});

// Auth / Account / Hardware Specific Limiters
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
    keyGenerator: getUserOrIpKey,
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

// ยังไม่ตรวจว่ามี key นี้ใน DB ไหม เพราะ เราแค่กันคนส่ง key ถี่ ถ้าไม่ครบโคต้าค่อยไปเช็คใน DB
export const rateLimitImageUpload = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 นาที
    max: 20, // รองรับได้ 20 รูปภาพต่อนาที (จาก api key เดียวกัน)
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req: Request): string => {
        let key_api = req.headers.authorization;

        if (key_api && key_api.startsWith('Bearer ')) {
            key_api = key_api.split(' ')[1];
        }

        return key_api || (req.ip as string);
    },
    message: {
        status: 429,
        error: 'Image upload rate limit exceeded, camera is sending too fast'
    }
});
