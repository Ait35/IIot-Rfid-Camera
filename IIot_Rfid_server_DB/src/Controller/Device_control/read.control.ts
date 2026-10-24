import { Response , Request} from 'express';
import { DeviceService } from '../../service/Class_service.js';

export const device_get_control = async (req:Request, res:Response) => {
    console.log('----- API action: get device control -----');
    const userId = (req as any).payload.user_id;
    //ดักจัลค่า falsy แล้วตั้งตามค่าขวา
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Group';
    
    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    try {
        const group_res = await DeviceService.Read.get_deviceInfo(page , limit , userId , ipAddress , userAgent);
        if(!group_res.success){
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }

        res.status(200).json(group_res);
    }catch (error) {
        console.error('error in Group control');
        res.status(500).json({ error: 'error in Group control' });
    }
};