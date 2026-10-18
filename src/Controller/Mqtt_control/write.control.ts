import { Response , Request} from 'express';
import{ MqttService } from '../../service/Class_service.js';

export const MPost_control = async (req:Request, res:Response) => {
    console.log('----- API action: mqtt control -----');
    const userId = (req as any).payload.user_id;
    const { topic, user_mqtt ,pass_mqtt , group_id} = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!topic || !group_id ){
        console.log('Missing data');
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const mqtt_res = await MqttService.Write.post_mqtt(topic, userId, group_id ,user_mqtt , pass_mqtt , ipAddress , userAgent);
        if(!mqtt_res.success){
            console.log(mqtt_res);
            return res.status(mqtt_res.status).json(mqtt_res);
        }
        console.log('✅ Add MQTT Successful!');
        return res.status(200).json(mqtt_res);
    } catch (error) {
        console.error('error in mqtt control');
        res.status(500).json({ error: 'error in mqtt control' });
    }
};

export const Mqtt_updata_control = async (req:Request, res:Response) => {
    console.log('----- API action: updata mqtt  control -----');
    const userId = (req as any).payload.user_id;
    const {mqtt_id, topic, group_id, user_mqtt , pass_mqtt , is_delete} = req.body;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if(!userId){
        console.log('Missing user id');
        return res.status(400).json({error: 'Missing user id'});
    }
    if(!mqtt_id ){
        console.log('Missing mqtt id');
        return res.status(400).json({error: 'Missing mqtt id'});
    }
    if(!topic && !user_mqtt && !pass_mqtt &&  !group_id && is_delete === undefined){
        console.log('Missing data');
        return res.status(400).json({error: 'Missing data'});
    }

    try {
        const mqtt_res = await MqttService.Write.update_mqtt(mqtt_id ,topic , userId , group_id, user_mqtt , 
            pass_mqtt , ipAddress , userAgent, is_delete);
        if(!mqtt_res.success){
            console.log(mqtt_res);
            return res.status(mqtt_res.status).json(mqtt_res);
        }
        console.log('✅ Update MQTT Successful!');
        return res.status(200).json(mqtt_res);
    } catch (error) {
        console.error('error in mqtt control');
        res.status(500).json({ error: 'error in mqtt control' });
    }
};