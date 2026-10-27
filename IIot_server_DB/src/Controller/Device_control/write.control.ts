import { Response, Request } from 'express';
import { DeviceService } from '../../service/Class_service.js';
import { CreateDeviceInput, UpdateDeviceInput } from '../../schemas/device.schema.js';

export const device_post_control = async (req: Request, res: Response) => {
    console.log('----- API action: Post Device control -----');
    const userId = (req as any).payload?.user_id;
    // req.body ผ่านการตรวจสอบจาก Zod Schema มาแล้ว 100% ข้อมูลครบและ Type ถูกต้องแน่นอน
    const { device_name, mac, type, group_id, local }: CreateDeviceInput = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const device_res = await DeviceService.Write.post_device(
            device_name, mac, local, userId, group_id, type, ipAddress, userAgent
        );
        if (!device_res.success) {
            console.log(device_res);
            return res.status(device_res.status).json(device_res);
        }
        console.log('✅ Add Device Successful!');
        return res.status(200).json(device_res);
    } catch (error) {
        console.error('error in Device control');
        res.status(500).json({ error: 'error in Device control' });
    }
};

export const device_update_control = async (req: Request, res: Response) => {
    console.log('----- API action: updata device  control -----');
    const userId = (req as any).payload?.user_id;
    // Zod ตรวจสอบ device_id (ต้องมี) และอย่างน้อย 1 ฟิลด์อัปเดตมาให้แล้ว
    const {
        device_id, device_name, device_type, group_id, ip, subnet, gate_way,
        last_active_at, hw_uptime, local, is_delete, status, key_api
    }: UpdateDeviceInput = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const group_res = await DeviceService.Write.update_device(
            device_id, device_name, device_type, group_id, ip, subnet, gate_way,
            last_active_at, hw_uptime, local, is_delete, status, key_api, userId, ipAddress, userAgent
        );
        if (!group_res.success) {
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }

        return res.status(200).json(group_res);
    } catch (error) {
        console.error('error in device control');
        res.status(500).json({ error: 'error in device control' });
    }
};
