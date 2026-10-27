import { z } from 'zod';

export const CreateMqttSchema = z.object({
    topic: z.string()
        .min(1, "Topic ห้ามเป็นค่าว่าง")
        .max(100, "Topic ต้องมีความยาวไม่เกิน 100 ตัวอักษร"),

    group_id: z.coerce.number({
        message: "กรุณาระบุ group_id เป็นตัวเลข"
    }).int("group_id ต้องเป็นจำนวนเต็ม").positive("group_id ต้องเป็นตัวเลขมากกว่า 0"),

    user_mqtt: z.string().max(100).optional(),
    pass_mqtt: z.string().max(100).optional()
}).refine((data) => {
    // ถ้าใส่ pass_mqtt ต้องมี user_mqtt ด้วย
    if (data.pass_mqtt && !data.user_mqtt) {
        return false;
    }
    return true;
}, {
    message: "หากระบุ pass_mqtt ต้องระบุ user_mqtt ด้วย"
});

export type CreateMqttInput = z.infer<typeof CreateMqttSchema>;

export const UpdateMqttSchema = z.object({
    mqtt_id: z.coerce.number({
        message: "กรุณาระบุ mqtt_id เป็นตัวเลข"
    }).int("mqtt_id ต้องเป็นจำนวนเต็ม").positive("mqtt_id ต้องเป็นตัวเลขมากกว่า 0"),

    topic: z.string().min(1, "Topic ห้ามเป็นค่าว่าง").max(100).optional(),
    group_id: z.coerce.number().int().positive("group_id ต้องเป็นตัวเลขมากกว่า 0").optional(),
    user_mqtt: z.string().max(100).optional(),
    pass_mqtt: z.string().max(100).optional(),
    is_delete: z.boolean().optional()
}).refine((data) => {
    const { mqtt_id, ...updates } = data;
    return Object.values(updates).some((val) => val !== undefined);
}, {
    message: "ต้องระบุฟิลด์ที่ต้องการแก้ไขอย่างน้อย 1 ฟิลด์"
}).refine((data) => {
    if (data.pass_mqtt && !data.user_mqtt && !data.topic) {
        return false;
    }
    return true;
}, {
    message: "ไม่สามารถอัปเดตรหัสผ่าน MQTT โดยไม่มีชื่อผู้ใช้หรือ Topic ได้"
});

export type UpdateMqttInput = z.infer<typeof UpdateMqttSchema>;
