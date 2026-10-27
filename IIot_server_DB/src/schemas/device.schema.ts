import { z } from 'zod';

export const CreateDeviceSchema = z.object({
    device_name: z.string()
        .min(2, "ชื่ออุปกรณ์ต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
        .max(100, "ชื่ออุปกรณ์ยาวเกิน 100 ตัวอักษร"),

    mac: z.string()
        .regex(/^([0-9A-Fa-f]{2}[:-]?){5}([0-9A-Fa-f]{2})$/, "รูปแบบ MAC Address ไม่ถูกต้อง (ตัวอย่าง: '246F28ABCDEF' หรือ '24:6F:28:AB:CD:EF')"),

    local: z.string()
        .min(1, "สถานที่ติดตั้งห้ามเป็นค่าว่าง"),

    group_id: z.coerce.number()
        .int("group_id ต้องเป็นจำนวนเต็ม")
        .positive("group_id ต้องเป็นตัวเลขมากกว่า 0"),

    type: z.enum(["RFID", "CAM"] as const)
});

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;

export const UpdateDeviceSchema = z.object({
    device_id: z.coerce.number({
        message: "กรุณาระบุ device_id เป็นตัวเลข"
    }).int("device_id ต้องเป็นจำนวนเต็ม").positive("device_id ต้องเป็นตัวเลขมากกว่า 0"),

    // ตัวที่ "มีหรือไม่มีก็ได้ (Optional)" โดยใส่ .optional() ต่อท้าย
    device_name: z.string().min(2, "ชื่ออุปกรณ์ต้องมีความยาวอย่างน้อย 2 ตัวอักษร").max(100).optional(),
    device_type: z.enum(["RFID", "CAM"] as const).optional(),
    group_id: z.coerce.number().int().positive("group_id ต้องเป็นตัวเลขมากกว่า 0").optional(),
    ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "รูปแบบ IP Address ไม่ถูกต้อง").optional(),
    subnet: z.string().optional(),
    gate_way: z.string().optional(),
    last_active_at: z.string().optional(),
    hw_uptime: z.coerce.number().int().nonnegative().optional(),
    local: z.string().min(1, "สถานที่ติดตั้งห้ามเป็นค่าว่าง").optional(),
    is_delete: z.boolean().optional(),
    status: z.boolean().optional(),
    key_api: z.string().optional()
}).refine((data) => { 
    // กฎพิเศษ: ต้องมีอย่างน้อย 1 ฟิลด์นอกจาก device_id ถูกส่งมาแก้ไข (ป้องกันส่งมาแค่ { device_id: 1 } แล้วไม่อัปเดตอะไรเลย)
    const { device_id, ...updates } = data;
    return Object.values(updates).some((val) => val !== undefined); // return ไปบอก zod ว่าให้ตีกลับหรือทำงานต่อใน layar ถัดไป
}, {
    message: "ต้องระบุอย่างน้อย 1 ฟิลด์ที่ต้องการแก้ไขข้อมูล (เช่น device_name, ip, status)"
});

export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
