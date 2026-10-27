import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware สำหรับตรวจสอบความถูกต้องของ Request Body ด้วย Zod Schema
 */
export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // ตรวจสอบและแปลง Type อัตโนมัติ (Sanitize & Parse)
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.') || 'body',
                    message: issue.message
                }));

                return res.status(400).json({
                    success: false,
                    status: 400,
                    error: 'Validation Error',
                    details: formattedErrors
                });
            }
            return res.status(500).json({
                success: false,
                status: 500,
                error: 'Internal Validation Error'
            });
        }
    };
};
