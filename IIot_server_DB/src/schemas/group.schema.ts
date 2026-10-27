import { z } from 'zod';

export const CreateGroupSchema = z.object({
    group_name: z.string()
        .min(2, "ชื่อกลุ่มต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
        .max(50, "ชื่อกลุ่มต้องมีความยาวไม่เกิน 50 ตัวอักษร")
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = z.object({
    group_id: z.coerce.number({
        message: "กรุณาระบุ group_id เป็นตัวเลข"
    }).int("group_id ต้องเป็นจำนวนเต็ม").positive("group_id ต้องเป็นตัวเลขมากกว่า 0"),

    group_name: z.string().min(2, "ชื่อกลุ่มต้องมีความยาวอย่างน้อย 2 ตัวอักษร").max(50).optional(),
    is_delete: z.boolean().optional()
}).refine((data) => {
    const { group_id, ...updates } = data;
    return Object.values(updates).some((val) => val !== undefined);
}, {
    message: "ต้องระบุฟิลด์ที่ต้องการแก้ไขอย่างน้อย 1 ฟิลด์ (group_name หรือ is_delete)"
});

export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>;
