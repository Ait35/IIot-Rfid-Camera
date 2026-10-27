import { z } from 'zod';

export const UpdateTagSchema = z.object({
    epc_id: z.coerce.number({
        message: "กรุณาระบุ epc_id เป็นตัวเลข"
    }).int("epc_id ต้องเป็นจำนวนเต็ม").positive("epc_id ต้องเป็นตัวเลขมากกว่า 0"),

    tag: z.string().min(1, "ป้ายชื่อ tag ต้องมีความยาวอย่างน้อย 1 ตัวอักษร").max(100).optional(),
    status: z.enum(['active', 'pending', 'stolen'] as const, {
        message: "สถานะ tag ต้องเป็น 'active', 'pending' หรือ 'stolen' เท่านั้น"
    }).optional(),
    is_delete: z.boolean().optional()
}).refine((data) => {
    const { epc_id, ...updates } = data;
    return Object.values(updates).some((val) => val !== undefined);
}, {
    message: "ต้องระบุฟิลด์ที่ต้องการแก้ไขอย่างน้อย 1 ฟิลด์ (tag, status หรือ is_delete)"
});

export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;
