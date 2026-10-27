import { Response, Request } from 'express';
import { DeviceService } from '../../service/Class_service.js';
import { CreateDeviceInput, UpdateDeviceInput } from '../../schemas/device.schema.js';

export const device_post_control = async (req: Request, res: Response) => {
    console.log('----- API action: Post Device control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: CreateDeviceInput = req.body;
        const device_res = await DeviceService.Write.post_device(inputData, userId, ipAddress, userAgent);
        
        if (!device_res.success) {
            console.log(device_res);
            return res.status(device_res.status).json(device_res);
        }
        console.log('✅ Add Device Successful!');
        return res.status(200).json(device_res);
    } catch (error) {
        console.error('error in Device control:', error);
        res.status(500).json({ error: 'error in Device control' });
    }
};

export const device_update_control = async (req: Request, res: Response) => {
    console.log('----- API action: update device control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: UpdateDeviceInput = req.body;
        const device_res = await DeviceService.Write.update_device(inputData, userId, ipAddress, userAgent);
        
        if (!device_res.success) {
            console.log(device_res);
            return res.status(device_res.status).json(device_res);
        }
        console.log('✅ Update Device Successful!');
        return res.status(200).json(device_res);
    } catch (error) {
        console.error('error in update device control:', error);
        res.status(500).json({ error: 'error in update device control' });
    }
};
