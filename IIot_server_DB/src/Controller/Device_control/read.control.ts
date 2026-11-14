import { Response, Request } from 'express';
import { DeviceRead } from '../../service/DeviceService/read.device.js';

export const device_get_control = async (req: Request, res: Response) => {
    console.log('----- API action: get device control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const device_type = (req.query.device_type as string)?.trim() || undefined;
    const status = (req.query.status as string)?.trim() || undefined;
    const group_id = req.query.group_id ? parseInt(req.query.group_id as string) : undefined;
    const search = (req.query.search as string)?.trim() || undefined;
    const is_delete = req.query.is_delete === 'true';

    if (!userId) {
        return res.status(400).json({ error: 'Missing user id' });
    }
    try {
        const device_res = await DeviceRead.get_deviceInfo(
            page,
            limit,
            device_type,
            status,
            group_id,
            search,
            is_delete
        );
        if (!device_res.success) {
            return res.status(device_res.status).json(device_res);
        }

        res.status(200).json(device_res);
    } catch (error) {
        console.error('error in Device control:', error);
        res.status(500).json({ error: 'error in Device control' });
    }
};
