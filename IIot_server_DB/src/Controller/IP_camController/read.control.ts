import { Response, Request } from 'express';
import { IP_CamRead } from '../../service/IP_CamService/read.service.js';

export const IP_cam_get_control = async (req: Request, res: Response) => {
    console.log('----- API action: get IP_cam control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const cam_res = await IP_CamRead.get_IP_cam(page, limit, userId, ipAddress, userAgent);
        if (!cam_res.success) {
            console.log(cam_res);
            return res.status(cam_res.status).json(cam_res);
        }

        return res.status(200).json(cam_res);
    } catch (error) {
        console.error('error in IP_cam get control:', error);
        res.status(500).json({ error: 'error in IP_cam get control' });
    }
};
