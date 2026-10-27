import { Response, Request } from 'express';
import { MapTagService } from '../../service/Class_service.js';
import { UpdateTagInput } from '../../schemas/tag.schema.js';

export const mapTag_update_control = async (req: Request, res: Response) => {
    console.log('----- API action: update mapTag control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: UpdateTagInput = req.body;
        const mapTag_res = await MapTagService.Write.update_map_tag(inputData, userId, ipAddress, userAgent);
        
        if (!mapTag_res.success) {
            console.log(mapTag_res);
            return res.status(mapTag_res.status).json(mapTag_res);
        }
      
        console.log('✅ Update Tag Successful!');
        return res.status(200).json(mapTag_res);
    } catch (error) {
        console.error('error in map_tag control:', error);
        res.status(500).json({ error: 'error in Map_Tag control' });
    }
};
