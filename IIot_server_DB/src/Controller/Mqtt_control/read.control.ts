import { Response, Request } from 'express';
import { MqttRead } from '../../service/mqttService/read.mqtt.js';

export const MGet_control = async (req: Request, res: Response) => {
    console.log('----- API action: mqtt control -----');
    const userId = (req as any).payload?.user_id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const group_id = req.query.group_id ? parseInt(req.query.group_id as string) : undefined;
    const search = (req.query.search as string)?.trim() || undefined;

    if (!userId) {
        return res.status(400).json({ error: 'Missing user id' });
    }
    try {
        const mqtt_res = await MqttRead.get_mqtt(page, limit, group_id, search);
        if (!mqtt_res.success) {
            return res.status(mqtt_res.status).json(mqtt_res);
        }

        res.status(200).json(mqtt_res);
    } catch (error) {
        console.error('error in mqtt control:', error);
        res.status(500).json({ error: 'error in mqtt control' });
    }
};
