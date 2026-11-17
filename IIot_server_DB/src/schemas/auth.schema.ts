import { z } from 'zod';

export const LoginSchema = z.object({
    university_id: z.string().min(1, "กรุณาระบุ university_id"),
    password: z.string().min(1, "กรุณาระบุ password")
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SigninSchema = z.object({
    university_id: z.string().min(1, "กรุณาระบุ university_id"),
    password: z.string().min(1, "กรุณาระบุ password"),
    role: z.enum(['admin', 'dev', 'teacher'] as const, {
        message: "สิทธิ์ (role) ต้องเป็น 'admin', 'dev' หรือ 'teacher' เท่านั้น"
    }).optional()
});

export type SigninInput = z.infer<typeof SigninSchema>;

export const UpdateAccountSchema = z.object({
    traget_id: z.coerce.number()
        .int("traget id ต้องเป็นจำนวนเต็ม")
        .positive("traget id ต้องเป็นตัวเลขมากกว่า 0"),
    password: z.string().min(4, "รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร").optional(),
    role: z.enum(['admin', 'dev', 'teacher'] as const, {
        message: "สิทธิ์ (role) ต้องเป็น 'admin', 'dev' หรือ 'teacher' เท่านั้น"
    }).optional(),
    is_delete: z.boolean().optional()
}).refine((data) => {
    const {traget_id , ...dataChack} = data;
    return Object.values(dataChack).some((val) => val !== undefined);
}, {
    message: "ต้องระบุฟิลด์ที่ต้องการแก้ไขอย่างน้อย 1 ฟิลด์ (password, role หรือ is_delete)"
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
