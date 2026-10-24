import mqtt from 'mqtt';

interface IClientOptions {
    username: string;
    password: string;
    reconnectPeriod: number;
    clean: boolean;
}

let client: mqtt.MqttClient;

export const initMqtt =  {
    async connect() {
        const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io';
        const options: IClientOptions = {
            username: process.env.MQTT_SUPPER_USER as string,
            password: process.env.MQTT_PASSWORD as string,
            reconnectPeriod: 5000, // ถ้าหลุด ให้พยายามต่อใหม่ทุกๆ 5 วินาที
            clean: true, // เคลียร์ session เก่าทิ้งเมื่อเริ่มใหม่
        };
        
        // console.log('🔄 Connecting to MQTT Broker...');
        client = mqtt.connect(brokerUrl, options);

        client.on('connect', () => {
            client.subscribe(process.env.MQTT_TOPIC_STATUS as string);
            client.subscribe(process.env.MQTT_TOPIC_RFID as string);
            console.log('✅ MQTT Connected successfully');
        });

        client.on('error', (err) => {
            console.error('❌ MQTT Connection Error:', err);
        });
        
        client.on('reconnect', () => {
            console.log('⚠️ MQTT Reconnecting...');
        });
        
        client.on('close', () => {
            console.log('🔴 MQTT Connection Closed');
        });

        return client;
    },

    callbackMessage (ServiceCall: (topic: string, message: string) => void){
        if (!client) {
            throw new Error("❌ MQTT Client is not connected");
        }
        console.log('📡 Listening to topic: ' ,process.env.MQTT_TOPIC_STATUS as string);
        console.log('📡 Listening to topic: ' ,process.env.MQTT_TOPIC_RFID as string);
        client.on('message', (topic, message) => {
            console.log(`📩 [Device: ${topic}] Data:`, message.toString());
            ServiceCall(topic, message.toString()); 
        });
        console.log('==============================================');
    }
}

export async function publishMessage(topic: string, message: string) {
    console.log(`📤 Publishing message to topic: ${topic}, Message: ${message}`);
    if (!client) {
        console.error("❌ No MQTT client connected");
        return;
    }
    
    // สั่ง publish 
    client.publish(topic, message, (err) => {
        if (err) {
            console.error(`❌ Error publishing message: ${err}`);
        } else {
            console.log(`📤✅[Published success!] Topic: ${topic}, Message: ${message}`);
        }
    });
};