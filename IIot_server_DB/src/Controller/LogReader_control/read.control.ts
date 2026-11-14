import { Response, Request } from 'express';
import { LogRead } from '../../service/LogService/read.log.js';

export const Log_get_control = async (req: Request, res: Response) => {
    console.log('----- API action: get log control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const device_id = req.query.device_id ? parseInt(req.query.device_id as string) : undefined;
    const search = (req.query.search as string)?.trim() || undefined;

    if (!userId) {
        return res.status(400).json({ error: 'Missing user id' });
    }
    try {
        const log_res = await LogRead.get_tag(page, limit, device_id, search);
        if (!log_res.success) {
            return res.status(log_res.status).json(log_res);
        }

        res.status(200).json(log_res);
    } catch (error) {
        console.error('error in Log control:', error);
        res.status(500).json({ error: 'error in Log control' });
    }
};
