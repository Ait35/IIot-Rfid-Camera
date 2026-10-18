import { Response , Request} from 'express';
import{ MapTagService } from '../../service/Class_service.js';

export const mapTag_update_control = async (req:Request, res:Response) => {
    console.log('----- API action: updata mqtt  control -----');
    const userId = (req as any).payload.user_id;
    const { epc_id , tag , status , is_delete} = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!epc_id){
        console.log('Missing epc id');
        return res.status(400).json({error: 'Missing epc id'});
    }
    if(!tag && !status && is_delete === undefined){
        console.log('Missing data');
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const mapTag_res = await MapTagService.Write.update_map_tag(
            epc_id ,
            tag ,
            status ,
            is_delete ,
            userId , 
            ipAddress , 
            userAgent
            );
        if(!mapTag_res.success){
            console.log(mapTag_res);
            return res.status(mapTag_res.status).json(mapTag_res);
        }
      
        return res.status(200).json(mapTag_res);
    } catch (error) {
        console.error('error in map_tag control');
        res.status(500).json({ error: 'error in Map_Tag control' });
    }
};