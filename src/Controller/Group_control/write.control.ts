import { Response , Request} from 'express';
import{ GroupService } from '../../service/Class_service.js';

export const group_post_control = async (req:Request, res:Response) => {
    console.log('----- API action: Post Group control -----');
    const userId = (req as any).payload.user_id;
    const { group_name } = req.body; //ครั้งแรกจากหน้สเว็ปไม่สามารถ config ได้ทั้งหมด
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!group_name){
        console.log('Missing data');
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const group_res = await GroupService.Write.post_group(
            group_name , userId , ipAddress , userAgent
        );
        if(!group_res.success){
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }   
        console.log('✅ Add Group Successful!');
        return res.status(200).json(group_res);
    } catch (error) {
        console.error('error in group control');
        res.status(500).json({ error: 'error in group control' });
    }
};

export const Group_update_control = async (req:Request, res:Response) => {
    console.log('----- API action: updata mqtt  control -----');
    const userId = (req as any).payload.user_id;
    const { group_id , group_name , is_delete} = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!group_id){
        console.log('Missing group id');
        return res.status(400).json({error: 'Missing group id'});
    }
    if(!group_name && is_delete === undefined){
        console.log('Missing data');
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const group_res = await GroupService.Write.update_group(group_id , group_name , userId , ipAddress , userAgent, is_delete);
        if(!group_res.success){
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }
       
        return res.status(200).json(group_res);
    } catch (error) {
        console.error('error in mqtt control');
        res.status(500).json({ error: 'error in Group control' });
    }
};