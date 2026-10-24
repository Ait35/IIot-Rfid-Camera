import { Response , Request} from 'express';
import { LogService } from '../../service/Class_service.js';

export const Tag_get_control = async (req:Request, res:Response) => {
    console.log('----- API action: get log control -----');
    const userId = (req as any).payload?.user_id;
    // ดักจับค่า falsy แล้วตั้งตามค่าขวา
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Device';
    
    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    try {
        const log_res = await LogService.Read.get_tag(page , limit , userId , ipAddress , userAgent);
        if(!log_res.success){
            console.log(log_res);
            return res.status(log_res.status).json(log_res);
        }

        res.status(200).json(log_res);
    }catch (error) {
        console.error('error in Log control:', error);
        res.status(500).json({ error: 'error in Log control' });
    }
};

export const Log_get_control = Tag_get_control;