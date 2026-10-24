import { insertEcpAndEcpLog } from './EPC.Service.js';
import { updateStatusService } from './status.Service.js';
import { publishMessage } from '../../Infra/Mqtt.infra.js';

interface C_Log {
    device_id: number;
    epc_id?: number;
    mac : string;
    ip : string;
    distance: number;
    timestamp?: string;
}

interface C_ECP_Tag {
    epc : string;
    tag : string | null;
    status	: string;	
    is_delete? : boolean;
}

const triggerCAM = async (TopicCam: string , log_id: number) => {
    if(!log_id){
        console.log('❌ No log_id found!');
        return;
    }
    const payload = JSON.stringify({log_id: log_id , cap: "1"})
    console.log('📩 TopicCam : ', TopicCam , ' Payload : ', payload);
    await publishMessage(TopicCam, payload);
}

// callBack function สำหรับ mqtt ที่ถูกเรียกใช้ใน callback ของ mqtt อีกที
export const dispatch_message = async (topic : string, message : string) => {
    console.log('----- Message reveived : dispatch_message -----');
    try{
        const topicParts = topic.split('/');
        const payload = JSON.parse(message);
        
        const dataOJB: C_ECP_Tag = {
            epc : payload.epc,
            tag : null,
            status	: "pending"
        } //เดี่ยวต้องลบออกจาก cache ตอนที่เราเรีนก updata status จะได้เอาค่าล่าสุดมาใช้
        
        const logOJB: C_Log = {
            device_id: payload.device_id,
            distance: payload.distance,
            ...( payload.timestamp && { timestamp: payload.timestamp } )
        }
        console.log("📩 tocpic : ", topicParts);
        console.log("📩 payload : ", payload);

        if(topicParts[0] !== 'SPU'){ 
            console.log('Invalid topic format 0');
            return{ success: false, message: 'Invalid topic format' };
        }
        if(topicParts[1] !== 'rfid' && topicParts[1] !== 'status'){
            console.log('Invalid topic format 1');
            return{ success: false, message: 'Invalid topic format' };
        }

        switch(topicParts[1]){
            case 'rfid':
                // ตัด [0]=SPU, [1]=rfid, [2]=group และตัดตัวสุดท้าย (-1) คือ mac ทิ้งไป
                const roomTopic = topicParts.slice(3, -1).join('/');
                // ประกอบเป็น Topic สั่งกล้องถ่ายรูป
                const TopicCam = `${process.env.MQTT_TOPIC_PUBLISH_CAM}/group${payload.group_id}/${roomTopic}/broadcast`;
                // const TopicCam = `${process.env.MQTT_TOPIC_PUBLISH_CAM}/group${payload.group_id}/broadcast`;
                
                const result = await insertEcpAndEcpLog(payload, dataOJB, logOJB);
                console.log(result);
                if(!result ||!result.success ){
                    console.log('❌ Insert Ecp or Ecp Log Failed!');
                    return;
                }
                if(result.data === null || !result.data.log_id){
                    console.log('❌ No Ecp_id found!');
                    return;
                }
                //ถ้าเจอ ECP ใน cache หรือเจอใน DB แล้ว set Cache สำเร็จ จะสั่งให่ถ่ายรูป
                await triggerCAM(TopicCam , result.data.log_id);
                break; 
            case 'status':
                await updateStatusService(payload);
                return 

            default:
                console.log('Invalid topic format');
                return;
        };
        console.log('=========================');
    }catch(error){
        console.error('❌ Error in dispatch_message', error);
        console.log('=========================');
    }
}
