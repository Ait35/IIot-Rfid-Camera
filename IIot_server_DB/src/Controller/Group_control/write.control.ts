import { Response, Request } from 'express';
import { GroupService } from '../../service/Class_service.js';
import { CreateGroupInput, UpdateGroupInput } from '../../schemas/group.schema.js';

export const group_post_control = async (req: Request, res: Response) => {
    console.log('----- API action: Post Group control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: CreateGroupInput = req.body;
        const group_res = await GroupService.Write.post_group(inputData, userId, ipAddress, userAgent);
        
        if (!group_res.success) {
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }   
        console.log('✅ Add Group Successful!');
        return res.status(200).json(group_res);
    } catch (error) {
        console.error('error in group control:', error);
        res.status(500).json({ error: 'error in group control' });
    }
};

export const Group_update_control = async (req: Request, res: Response) => {
    console.log('----- API action: update group control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: UpdateGroupInput = req.body;
        const group_res = await GroupService.Write.update_group(inputData, userId, ipAddress, userAgent);
        
        if (!group_res.success) {
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }
       
        console.log('✅ Update Group Successful!');
        return res.status(200).json(group_res);
    } catch (error) {
        console.error('error in group update control:', error);
        res.status(500).json({ error: 'error in Group control' });
    }
};
