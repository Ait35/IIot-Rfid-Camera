import { Response, Request } from 'express';
import { IP_CamWrite } from '../../service/IP_CamService/write.service.js';
import { CreateIP_CamInput, UpdateIP_CamInput, ProbeIP_CamInput } from '../../schemas/ip_cam.schema.js';

export const IP_cam_post_control = async (req: Request, res: Response) => {
    console.log('----- API action: Post IP_cam control -----');
    const userId = (req as any).payload?.user_id;
    const Input_data: CreateIP_CamInput = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const cam_res = await IP_CamWrite.post_IP_cam(
            Input_data, userId, ipAddress, userAgent
        );

        if (!cam_res.success) {
            console.log(cam_res);
            return res.status(cam_res.status).json(cam_res);
        }

        console.log('✅ Add IP_cam Successful!');
        return res.status(200).json(cam_res);
    } catch (error) {
        console.error('error in IP_cam control:', error);
        res.status(500).json({ error: 'error in IP_cam control' });
    }
};

export const Ip_cam_update_control = async (req: Request, res: Response) => {
    console.log('----- API action: updata IP_cam control -----');
    const userId = (req as any).payload?.user_id;
    const Input_data: UpdateIP_CamInput = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const cam_res = await IP_CamWrite.update_IP_cam(Input_data, userId, ipAddress, userAgent);
        if (!cam_res.success) {
            console.log(cam_res);
            return res.status(cam_res.status).json(cam_res);
        }

        return res.status(200).json(cam_res);
    } catch (error) {
        console.error('error in IP_cam control:', error);
        res.status(500).json({ error: 'error in IP_cam control' });
    }
};

export const IP_cam_probe_control = async (req: Request, res: Response) => {
    console.log('----- API action: Probe IP_cam control -----');
    const userId = (req as any).payload?.user_id;
    const Input_data: ProbeIP_CamInput = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const probe_res = await IP_CamWrite.probe_IP_cam(Input_data, userId, ipAddress, userAgent);
        return res.status(probe_res.status).json(probe_res);
    } catch (error) {
        console.error('error in IP_cam probe control:', error);
        res.status(500).json({ success: false, status: 500, error: 'error in IP_cam probe control' });
    }
};
