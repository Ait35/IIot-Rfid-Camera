import { Response , Request} from 'express';
import{ DeviceService } from '../../service/Class_service.js';

export const device_post_control = async (req:Request, res:Response) => {
    console.log('----- API action: Post Device control -----');
    const userId = (req as any).payload.user_id;
    const { device_name, mac,  type , group_id, local} = req.body; //ครั้งแรกจากหน้สเว็ปไม่สามารถ config ได้ทั้งหมด
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!device_name || !mac || !local || !group_id || !type){
        console.log('Missing data');
        console.log(device_name, mac, local, group_id, type);
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const device_res = await DeviceService.Write.post_device(
            device_name , mac , local , userId, group_id, type, ipAddress , userAgent
        );
        if(!device_res.success){
            console.log(device_res);
            return res.status(device_res.status).json(device_res);
        }
        console.log('✅ Add Device Successful!');
        return res.status(200).json(device_res);
    } catch (error) {
        console.error('error in mqtt control');
        res.status(500).json({ error: 'error in mqtt control' });
    }
};

export const device_update_control = async (req:Request, res:Response) => {
    console.log('----- API action: updata device  control -----');
    const userId = (req as any).payload.user_id;
    const {device_id, device_name ,device_type, group_id, ip,subnet,gate_way,
        last_active_at,hw_uptime ,local,is_delete,status,key_api} = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!device_id){
        console.log('Missing id data');
        return res.status(400).json({error: 'Missing id data'});
    }
    if(!device_name && !device_type && !group_id && !ip && !subnet && !gate_way && !last_active_at
        && !hw_uptime && !local && status === undefined && !key_api && is_delete === undefined){
        console.log('Missing data');
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const group_res = await DeviceService.Write.update_device( device_id , device_name , device_type , group_id , ip , subnet , gate_way , last_active_at , hw_uptime , local , is_delete , status , key_api , userId , ipAddress , userAgent);
        if(!group_res.success){
            console.log(group_res);
            return res.status(group_res.status).json(group_res);
        }

        return res.status(200).json(group_res);
    } catch (error) {
        console.error('error in device control');
        res.status(500).json({ error: 'error in device control' });
    }
};