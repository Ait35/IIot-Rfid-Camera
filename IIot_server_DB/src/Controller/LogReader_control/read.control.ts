import { Response, Request } from 'express';
import { LogRead } from '../../service/LogService/read.log.js';
import type { SystemLogSearchBy } from '../../Repository/ReadQuery/Read.SystemLog.Query.js';
import { Query } from '../../Repository/helperQuery.js';

const VALID_SEARCH_BY = new Set<SystemLogSearchBy>(['all', 'user', 'target_id', 'payload']);

export const Log_get_control = async (req: Request, res: Response) => {
    console.log('----- API action: get log control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const device_id = req.query.device_id ? parseInt(req.query.device_id as string) : undefined;
    const search = (req.query.search as string)?.trim() || undefined;
    const start_date = Query.parseDateTime(req.query.start_date ?? req.query.start_at);
    const end_date = Query.parseDateTime(req.query.end_date ?? req.query.end_at);

    if (!userId) {
        return res.status(400).json({ error: 'Missing user id' });
    }
    try {
        const log_res = await LogRead.get_tag(page, limit, device_id, search, start_date, end_date);
        if (!log_res.success) {
            return res.status(log_res.status).json(log_res);
        }

        res.status(200).json(log_res);
    } catch (error) {
        console.error('error in Log control:', error);
        res.status(500).json({ error: 'error in Log control' });
    }
};

export const SystemLog_get_control = async (req: Request, res: Response) => {
    console.log('----- API action: get system log control -----');
    const userId = (req as any).payload?.user_id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const action_type = (req.query.action_type as string)?.trim() || undefined;
    const target_table = (req.query.target_table as string)?.trim() || undefined;
    const search = (req.query.search as string)?.trim() || undefined;
    const rawSearchBy = (req.query.search_by as string)?.trim() as SystemLogSearchBy;
    const search_by: SystemLogSearchBy = VALID_SEARCH_BY.has(rawSearchBy) ? rawSearchBy : 'all';

    const start_date = Query.parseDateTime(req.query.start_date ?? req.query.start_at);
    const end_date = Query.parseDateTime(req.query.end_date ?? req.query.end_at);

    if (!userId) {
        return res.status(400).json({ error: 'Missing user id' });
    }
    try {
        const log_res = await LogRead.get_system_log(page, limit, {
            action_type,
            target_table,
            search,
            search_by,
            start_date,
            end_date,
        });
        if (!log_res.success) {
            return res.status(log_res.status).json(log_res);
        }

        res.status(200).json(log_res);
    } catch (error) {
        console.error('error in SystemLog control:', error);
        res.status(500).json({ error: 'error in SystemLog control' });
    }
};
