import { Response , Request} from 'express';
import{ MqttService } from '../../service/Class_service.js';

export const MGet_control = async (req:Request, res:Response) => {
    console.log('----- API action: mqtt control -----');
    const userId = (req as any).payload.user_id;
    //ดักจัลค่า falsy แล้วตั้งตามค่าขวา
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Mqtt';
    
    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    try {
        const mqtt_res = await MqttService.Read.get_mqtt(page , limit , userId , ipAddress , userAgent);
        if(!mqtt_res.success){
            console.log(mqtt_res);
            return res.status(mqtt_res.status).json(mqtt_res);
        }

        res.status(200).json(mqtt_res);
    }catch (error) {
        console.error('error in mqtt control');
        res.status(500).json({ error: 'error in mqtt control' });
    }
};