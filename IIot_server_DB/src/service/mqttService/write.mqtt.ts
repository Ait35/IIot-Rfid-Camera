import { publishMessage } from '../../Infra/Mqtt.infra.js';
import { db } from '../../Infra/connect_db.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';
import { Helper } from '../Class_service.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateData } from '../../Repository/updataQuery.js';
import { CreateMqttInput, UpdateMqttInput } from '../../schemas/mqtt.schema.js';

export const MqttWrite = {
    async post_mqtt(inputData: CreateMqttInput, by_user_id: string, ip: string, userAgent: string) {
        console.log('----- API action: post_mqtt service -----');
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }

        const req = {
            topic: inputData.topic,
            group_id: inputData.group_id,
            by_user_id,
            ...(inputData.user_mqtt && { user_mqtt: inputData.user_mqtt }),
            ...(inputData.pass_mqtt && { pass_mqtt: inputData.pass_mqtt }),
        };
        const action = 'INSERT';
        const table = 'mqtt';
        const transaction = await db.connect();

        try {
            await transaction.query('BEGIN');
            const res_query = await InsertData(table, req as any, transaction);
            console.log('----- Insert Successful! -----');

            await ActivityLogService.Insert_logAction(Number(by_user_id), action, table, res_query.data.mqtt_id, {
                topic: inputData.topic,
                config_group: inputData.group_id,
                ip_address: ip,
                user_agent: userAgent
            }, transaction);
            await transaction.query('COMMIT');

            console.log('----- Add System Log Successful! -----');
            return res_query;
        } catch (error) {
            await transaction.query('ROLLBACK');
            console.error('❌ Database ROLLBACK :', error);
            return { success: false, status: 500, error: 'Failed to insert table Mqtt' };
        } finally {
            transaction.release();
        }
    },

    async update_mqtt(inputData: UpdateMqttInput, by_user_id: string, ip_address: string, userAgent: string) {
        console.log('----- API action: update_mqtt service -----');
        const { mqtt_id, is_delete, ...updatePayload } = inputData;

        if (!db) return { success: false, status: 500, error: 'Database not connected' };
        let result: any;
        const table = 'mqtt';
        const action = 'UPDATE';
        const transaction = await db.connect();
        try {
            await transaction.query('BEGIN');

            if (is_delete !== undefined) {
                result = await Helper.Query.Tran_SetDelete(table, 'mqtt_id', mqtt_id, is_delete, transaction);
                console.log(` ✅ ${is_delete ? 'Delete' : 'Restore'} Successful! `);

                await ActivityLogService.Insert_logAction(Number(by_user_id), is_delete ? 'DELETE' : 'RESTORE', table, mqtt_id, {
                    is_delete: is_delete,
                    ip_address: ip_address,
                    user_agent: userAgent
                }, transaction);
            } else {
                result = await updateData(table, 'mqtt_id', mqtt_id, true, updatePayload as any, transaction);
                console.log('----- Update Successful! -----');

                await ActivityLogService.Insert_logAction(Number(by_user_id), action, 'Mqtt', mqtt_id, {
                    ...updatePayload,
                    ip_address: ip_address,
                    user_agent: userAgent
                }, transaction);
            }
            await transaction.query('COMMIT');

            const topicCMD = `${process.env.MQTT_TOPIC_PUBLISH_CMD}/group${result.data.group_id}/${result.data.topic}/broadcast`;
            console.log('📩 TopicCam : ', topicCMD);
            await publishMessage(topicCMD, JSON.stringify({ CMD: "disconnect" }));

            console.log('----- Add System Log Successful! -----');
            return result;
        } catch (error: any) {
            await transaction.query('ROLLBACK');
            console.error('❌ Database ROLLBACK :', error);
            throw error;
        } finally {
            transaction.release();
        }
    }
};
