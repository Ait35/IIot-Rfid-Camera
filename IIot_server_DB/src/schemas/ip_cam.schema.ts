import { z } from 'zod';

export const CreateIP_CamSchema = z.object({
    cam_name: z.string()
        .min(2, "ชื่อกล้องต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
        .max(100, "ชื่อกล้องยาวเกิน 100 ตัวอักษร"),

    mac: z.string()
        .regex(/^([0-9A-Fa-f]{2}[:-]?){5}([0-9A-Fa-f]{2})$/, "รูปแบบ MAC Address ไม่ถูกต้อง (ตัวอย่าง: '246F28ABCDEF' หรือ '24:6F:28:AB:CD:EF')")
        .optional(),

    local: z.string()
        .min(1, "สถานที่ติดตั้งห้ามเป็นค่าว่าง"),

    group_id: z.coerce.number()
        .int("group_id ต้องเป็นจำนวนเต็ม")
        .positive("group_id ต้องเป็นตัวเลขมากกว่า 0"),

    ip: z.string()
        .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "รูปแบบ IP Address ไม่ถูกต้อง"),

    // URL และ User/Pass สำหรับกล้อง - เป็น Optional เพื่อรองรับกล้องทุกรุ่น (ใช้ z.string เพื่อให้รับ rtsp:// ได้)
    brand: z.string().max(100, "ชื่อยี่ห้อกล้องยาวเกิน 100 ตัวอักษร").optional(),
    model: z.string().max(100, "ชื่อรุ่นกล้องยาวเกิน 100 ตัวอักษร").optional(),
    rtsp_url: z.string().min(1, "RTSP url ต้องมีความยาวอย่างน้อย 1 ตัวอักษร").optional(),
    snapshot_url: z.string().min(1, "Snapshot url ต้องมีความยาวอย่างน้อย 1 ตัวอักษร").optional(),
    ONVIF_url: z.string().min(1, "ONVIF url ต้องมีความยาวอย่างน้อย 1 ตัวอักษร").optional(),
    cam_username: z.string().optional(),
    cam_password: z.string().optional(),
    auth: z.enum(['query', 'basic', 'digest', 'auto']).optional(),
    keep_alive_port: z.union([
        z.literal('auto'),
        z.coerce.number().int().positive("Port ต้องเป็นตัวเลขมากกว่า 0")
    ]).optional()
}).refine((data) => { 
    let { snapshot_url , cam_username , cam_password} = data;
    if(cam_password && !cam_username) return false;

    if (snapshot_url && !snapshot_url.endsWith(".cgi")) {
        snapshot_url = snapshot_url.replace(/\.[^?]+(?=\?|$)/, ".cgi");
    }
    return true;
    // const {mac ,ONVIF_url} = data;
    // return Object.values({mac ,ONVIF_url}).some((val) => val !== undefined);
}, {
    message: "หากใส่ cam_password จำเป็นต้องใส่ cam_username ด้วย"
});

export type CreateIP_CamInput = z.infer<typeof CreateIP_CamSchema>;

export const UpdateIP_CamSchema = z.object({
    ip_cam_id: z.coerce.number({
        message: "กรุณาระบุ ip_cam_id เป็นตัวเลข"
    }).int("ip_cam_id ต้องเป็นจำนวนเต็ม").positive("ip_cam_id ต้องเป็นตัวเลขมากกว่า 0"),

    cam_name: z.string().min(2, "ชื่อกล้องต้องมีความยาวอย่างน้อย 2 ตัวอักษร").max(100).optional(),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    group_id: z.coerce.number().int().positive("group_id ต้องเป็นตัวเลขมากกว่า 0").optional(),
    ip: z.string().regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 
        "รูปแบบ IP Address ไม่ถูกต้อง")
    .optional(),
    rtsp_url: z.string().optional(),
    snapshot_url: z.string().optional(),
    ONVIF_url: z.string().optional(),
    cam_username: z.string().optional(),
    cam_password: z.string().optional(),
    auth: z.enum(['query', 'basic', 'digest' , 'auto']).optional(),
    keep_alive_port: z.union([
        z.literal('auto'),
        z.coerce.number().int().positive("Port ต้องเป็นตัวเลขมากกว่า 0")
    ]).optional(),
    last_active_at: z.string().optional(),
    up_time: z.coerce.number().int().nonnegative().optional(),
    local: z.string().min(1, "สถานที่ติดตั้งห้ามเป็นค่าว่าง").optional(),    
    status: z.boolean().optional(),
    is_delete: z.boolean().optional()
}).refine((data) => { 
    const { ip_cam_id, ...updates } = data;
    return Object.values(updates).some((val) => val !== undefined);
}, {
    message: "ต้องระบุอย่างน้อย 1 ฟิลด์ที่ต้องการแก้ไขข้อมูล"
});

export const ProbeIP_CamSchema = z.object({
    ip: z.string().regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 
        "รูปแบบ IP Address ไม่ถูกต้อง"
    ).optional(),
    ONVIF_url: z.string().min(1, "ONVIF url ต้องมีความยาวอย่างน้อย 1 ตัวอักษร").optional(),
    cam_username: z.string().optional(),
    cam_password: z.string().optional(),
    ip_cam_id: z.coerce.number().int().positive("ip_cam_id ต้องเป็นจำนวนเต็มบวก").optional()
}).refine((data) => data.ONVIF_url !== undefined || data.ip !== undefined || data.ip_cam_id !== undefined, {
    message: "ต้องระบุอย่างน้อย ip, ONVIF_url หรือ ip_cam_id เพื่อทำการ Probe ข้อมูลกล้อง"
});

export type ProbeIP_CamInput = z.infer<typeof ProbeIP_CamSchema>;

export type UpdateIP_CamInput = z.infer<typeof UpdateIP_CamSchema>;
