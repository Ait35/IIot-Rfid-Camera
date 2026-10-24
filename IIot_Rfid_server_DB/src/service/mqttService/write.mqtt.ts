import { publishMessage } from '../../Infra/Mqtt.infra.js';
import { db } from '../../Infra/connect_db.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';
import { Helper } from '../Class_service.js';
import { InsertData } from '../../Repository/insertQuery.js';
import { updateData } from '../../Repository/updataQuery.js';
import { getData } from '../../Repository/ReadQuery.js';

interface user_req {
    mqtt_id?: number; 
    topic? : string;   
    group_id?: number;
    user_mqtt? : string
    Pass_Mqtt? : string
    is_delete? : boolean
    by_user_id?: string
}

export const MqttWrite = {
    async post_mqtt(topic:string , by_user_id:string,  group_id: number,
        User_Mqtt:string | null = null , Pass_Mqtt:string | null = null , ip:string , userAgent:string) {
        
        console.log('----- API action: post_mqtt service -----');
        if (!db) {
            return { success: false, status: 500, error: 'Database not connected' };
        }
        const req : user_req = {
            topic,
            group_id,
            by_user_id,
            ...(User_Mqtt && {user_mqtt : User_Mqtt}),
            ...(Pass_Mqtt && {pass_mqtt : Pass_Mqtt}),
        }
        const action = 'INSERT';
        const table= 'mqtt';
        const transaction = await db.connect();

        try{
            await transaction.query('BEGIN');
            const res_query = await InsertData( table, req as any , transaction);
            console.log('----- Insert Successful! -----');

            await ActivityLogService.Insert_logAction(Number(by_user_id), action, table, res_query.data.mqtt_id, {
                topic : topic,
                config_group : group_id,
                ip_address : ip,
                user_agent : userAgent
            }, transaction);
            await transaction.query('COMMIT');

            console.log('----- Add System Log Successful! -----');
            return res_query;
        } catch (error) {
            await transaction.query('ROLLBACK');
            console.error('❌ Database ROLLBACK :', error);
            return { success: false, status: 500, error: 'Failed to insert table Mqtt' };
        }finally{
            transaction.release();
        }
    },
    //Updata
    async update_mqtt(
        mqtt_id: number,
        topic: string | undefined, 
        by_user_id: string,
        group_id: number | undefined,
        user_mqtt: string | undefined,
        pass_mqtt: string | undefined,
        ip_address: string, 
        userAgent: string,
        is_delete: boolean | undefined)
    {
        console.log('----- API action: update_mqtt service -----');
        console.log(mqtt_id, by_user_id);

        const user_req : user_req = {
            //ถ้า group_name ไม่เป็น undefined : ฝั่งขวาจะทำงาน จะได้ Object เป็น { group_name: "ชื่อที่ส่งมา" }
            ...(topic !== undefined && {topic}), 
            ...(group_id !== undefined && {group_id}),
            ...(user_mqtt !== undefined && {user_mqtt}),
            ...(pass_mqtt !== undefined && {pass_mqtt}),
            ...(is_delete !== undefined && {is_delete})
        }

        if(!topic && (user_mqtt || pass_mqtt) ) return { success: false, status: 400, error: 'can not update user/pass mqtt without topic' };
        if(pass_mqtt && !user_mqtt) return { success: false, status: 400, error: 'can not update pass mqtt without user mqtt' };

        console.log(user_req);
        if(!db) return { success: false, status: 500, error: 'Database not connected' };
        let result : any;
        const table = 'mqtt';
        const action = 'UPDATE';
        const transaction = await db.connect();
        try{
            await transaction.query('BEGIN');

            if(is_delete !== null && is_delete !== undefined){
                result = await Helper.Query.Tran_SetDelete(table , 'mqtt_id', mqtt_id , is_delete , transaction);
                console.log(` ✅ ${is_delete ? 'Delete' : 'Restore'} Successful! `);

                await ActivityLogService.Insert_logAction( Number(by_user_id), is_delete ? 'DELETE':'RESTORE' ,table , mqtt_id, {
                    is_delete : is_delete,
                    ip_address : ip_address,
                    user_agent : userAgent
                }, transaction);
            }else{
                result = await updateData(table, 'mqtt_id', mqtt_id , true ,user_req as any , transaction);
                console.log('----- Update Successful! -----');

                await ActivityLogService.Insert_logAction(Number(by_user_id), action , 'Mqtt', mqtt_id, {
                    topic : topic,
                    group_id: group_id,
                    user_mqtt: user_mqtt,
                    pass_mqtt: pass_mqtt,
                    ip_address : ip_address,
                    user_agent : userAgent
                }, transaction);
            }
            await transaction.query('COMMIT');

            const topicCMD = `${process.env.MQTT_TOPIC_PUBLISH_CMD}/group${result.data.group_id}/${result.data.topic}/broadcast`;
            console.log('📩 TopicCam : ', topicCMD);
            await publishMessage(topicCMD, JSON.stringify({CMD : "disconnect"}));

            console.log('----- Add System Log Successful! -----');
            return result;
        }catch(error : any){
            await transaction.query('ROLLBACK');
            console.error('❌ Database ROLLBACK :', error);
            throw error;
        }finally{
            transaction.release();
        }
    }
}