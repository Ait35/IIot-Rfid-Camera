import { Response, Request } from 'express';
import { GroupRead } from '../../service/GroupService/read_group.js';

export const Group_get_control = async (req: Request, res: Response) => {
    console.log('----- API action: get group control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string)?.trim() || undefined;
    const is_delete = req.query.is_delete === 'true';

    if (!userId) {
        return res.status(400).json({ error: 'Missing user id' });
    }
    try {
        const group_res = await GroupRead.get_group(page, limit, search, is_delete);
        if (!group_res.success) {
            return res.status(group_res.status).json(group_res);
        }

        res.status(200).json(group_res);
    } catch (error) {
        console.error('error in Group control:', error);
        res.status(500).json({ error: 'error in Group control' });
    }
};
