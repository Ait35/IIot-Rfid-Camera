import { z } from 'zod';

export const LoginSchema = z.object({
    university_id: z.string().min(1, "กรุณาระบุ university_id"),
    password: z.string().min(1, "กรุณาระบุ password")
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SigninSchema = z.object({
    university_id: z.string().min(1, "กรุณาระบุ university_id"),
    password: z.string().min(1, "กรุณาระบุ password")
});

export type SigninInput = z.infer<typeof SigninSchema>;

export const UpdateAccountSchema = z.object({
    password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร").optional(),
    role: z.enum(['admin', 'dev', 'student', 'teacher'] as const, {
        message: "สิทธิ์ (role) ต้องเป็น 'admin', 'dev', 'student' หรือ 'teacher' เท่านั้น"
    }).optional(),
    is_delete: z.boolean().optional()
}).refine((data) => {
    return Object.values(data).some((val) => val !== undefined);
}, {
    message: "ต้องระบุฟิลด์ที่ต้องการแก้ไขอย่างน้อย 1 ฟิลด์ (password, role หรือ is_delete)"
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
