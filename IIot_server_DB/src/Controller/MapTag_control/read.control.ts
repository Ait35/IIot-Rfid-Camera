import { Response , Request} from 'express';
import { TagRead } from '../../service/TagService/read.tag.js';

export const Tag_get_control = async (req:Request, res:Response) => {
    console.log('----- API action: get group control -----');
    const userId = (req as any).payload.user_id;
    //ดักจัลค่า falsy แล้วตั้งตามค่าขวา
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    //ค้นหาจ๊ะ
    const rawStatus = (req.query.status as string)?.trim().toLowerCase();
    const status = ['active', 'pending', 'stolen'].includes(rawStatus) ? rawStatus : undefined;
    const search = (req.query.search as string)?.trim() || undefined;

    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    try {
        const mapTag_res = await TagRead.get_tag(page, limit, status, search);
        if(!mapTag_res.success){
            console.log(mapTag_res);
            return res.status(mapTag_res.status).json(mapTag_res);
        }

        res.status(200).json(mapTag_res);
    }catch (error) {
        console.error('error in Map_Tag control');
        res.status(500).json({ error: 'error in Mag_Tag control' });
    }
};