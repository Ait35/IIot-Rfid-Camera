import { Response, Request } from 'express';
import { MqttService } from '../../service/Class_service.js';
import { CreateMqttInput, UpdateMqttInput } from '../../schemas/mqtt.schema.js';

export const MPost_control = async (req: Request, res: Response) => {
    console.log('----- API action: mqtt control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: CreateMqttInput = req.body;
        const mqtt_res = await MqttService.Write.post_mqtt(inputData, userId, ipAddress, userAgent);
        
        if (!mqtt_res.success) {
            console.log(mqtt_res);
            return res.status(mqtt_res.status).json(mqtt_res);
        }
        console.log('✅ Add MQTT Successful!');
        return res.status(200).json(mqtt_res);
    } catch (error) {
        console.error('error in mqtt control:', error);
        res.status(500).json({ error: 'error in mqtt control' });
    }
};

export const Mqtt_updata_control = async (req: Request, res: Response) => {
    console.log('----- API action: update mqtt control -----');
    const userId = (req as any).payload?.user_id;
    const ipAddress = req.ip || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    if (!userId) {
        console.log('Missing user id');
        return res.status(401).json({ success: false, status: 401, error: 'Unauthorized: Missing user id' });
    }

    try {
        const inputData: UpdateMqttInput = req.body;
        const mqtt_res = await MqttService.Write.update_mqtt(inputData, userId, ipAddress, userAgent);
        
        if (!mqtt_res.success) {
            console.log(mqtt_res);
            return res.status(mqtt_res.status).json(mqtt_res);
        }
        console.log('✅ Update MQTT Successful!');
        return res.status(200).json(mqtt_res);
    } catch (error) {
        console.error('error in mqtt control:', error);
        res.status(500).json({ error: 'error in mqtt control' });
    }
};
