#include "Mqtt_service.h"

Mqtt_service::Mqtt_service()
{   
    
}

void Mqtt_service::setupMqtt(
    String user, String pass,
    String topic_pub_status , 
    String topic_pub_rfid, 
    String topic_sub_private,
    String topic_sub_broadcats
    // int port
    // const char* server
    )
{
    if(WiFi.status() != WL_CONNECTED){
        Serial.println("WiFi Disconnected, cannot connect MQTT");
        return;
    }
    
    this->userMqtt = user;
    this->passMqtt = pass;
    this->topic_pub_status = topic_pub_status;
    this->topic_pub_rfid = topic_pub_rfid;
    this->topic_sub_private = topic_sub_private;
    this->topic_sub_broadcats = topic_sub_broadcats;
    // this->port = port;
    // this->server = server;
    this->clientId = "ESP32Client-" + String(random(0xffff), HEX);
    Serial.println("clientId: " + this->clientId);
    Serial.println("HostServer: " + String(HostServer));
    Serial.println("port: " + String(port));

    client.setServer(this->HostServer, this->port);
    client.setKeepAlive(30);
}

bool Mqtt_service::connectMqtt()
{
    if(WiFi.status() != WL_CONNECTED){
        Serial.println("WiFi Disconnected, cannot connect MQTT");
        return false;
    }
    Serial.println("Connecting to MQTT...");

    String ratainMessage =  "{\"status\": false , \"device_id\":" + String(device_info.device_id) + " , \"mac\" : \"" + device_info.mac + "\"}";
    Serial.println("Ratain message: " + ratainMessage);
    client.connect(
        clientId.c_str(),
        userMqtt.c_str(), 
        passMqtt.c_str(),
        topic_pub_status.c_str(),
        0 , 
        true,
        ratainMessage.c_str()
    );
    if (client.connected()) {
      Serial.println("✅ connected MQTT");
      client.subscribe(topic_sub_private.c_str());
      Serial.println("Subscribed to topic: " + topic_sub_private);
      client.subscribe(topic_sub_broadcats.c_str());
      Serial.println("Subscribed to topic: " + topic_sub_broadcats);
      Serial.println("Publishing status to topic: " + topic_pub_status);
      Serial.println("Publishing rfid to topic: " + topic_pub_rfid);
      publishStatus(
        "{\"status\": true , \"device_id\":" + String(device_info.device_id) + ", \"mac\" : \"" + device_info.mac + "\", \"hw_uptime\" : " + millis() + "}" , true
    );
      return true;
    } else {
      Serial.print("❌ failed, rc=");
      Serial.print(client.state());
      return false;
    }
   return false;
}

void Mqtt_service::reconnect(OLED* oled)
{   
    Serial.println("⚠️ Reconnecting to MQTT...");
    if(WiFi.status() != WL_CONNECTED){
        Serial.println("WiFi Disconnected, cannot connect MQTT");
        return;
    }
    String ratainMessage =  "{\"status\": false , \"device_id\":" + String(device_info.device_id) + " , \"mac\" : \"" + device_info.mac + "\"}";
    Serial.println("Ratain message: " + ratainMessage);

    int dotCount = 0;
    countToRestartESP = 0;
    unsigned long lastDotTime = millis();
    unsigned long lastRetryTime = millis();

    if (oled) oled->setUp_any("MQTT", false, 0);

    if (this->connectMqtt()) {
        Serial.println("✅ Reconnected to MQTT");
        if (oled) {
            oled->setUp_any("MQTT", true, 0);
            delay(500);
        }
        return;
    }

    while (!client.connected()) {
        if(WiFi.status() != WL_CONNECTED){
            ESP.restart();
        }

        // อัปเดตจุดกำลังโหลดทุกๆ 300ms ให้ขยับลื่นไหล
        if (millis() - lastDotTime >= 300) {
            dotCount = (dotCount + 1) % 4;
            if (oled) oled->setUp_any("MQTT", false, dotCount);
            lastDotTime = millis();
        }

        // ลองเชื่อมต่อใหม่ทุก 3 วินาที
        if (millis() - lastRetryTime >= 3000) {
            Serial.println("⚠️ Reconnecting to MQTT...");
            countToRestartESP++;
            if (countToRestartESP >= 10) {
                Serial.println("Failed to reconnect to MQTT, restart ESP");
                ESP.restart();
            }

            if (this->connectMqtt()) {
                Serial.println("✅ Reconnected to MQTT");
                countToRestartESP = 0;
                if (oled) {
                    oled->setUp_any("MQTT", true, 0);
                    delay(500);
                }
                break;
            } else {
                Serial.print("❌ failed, rc=");
                Serial.println(client.state());
            }
            lastRetryTime = millis();
        }
        delay(5);
    }
}

void Mqtt_service::publishStatus(String message , bool ratain)
{
    if(WiFi.status() != WL_CONNECTED){
        Serial.println("WiFi Disconnected, cannot publish data");
        return;
    }
    
    client.publish(topic_pub_status.c_str(), message.c_str() , ratain);
    Serial.println("✅ Published to topic: " + topic_pub_status);
    Serial.println("----------------------------------------");
}

void Mqtt_service::publishEPC(String message)
{
        if(WiFi.status() != WL_CONNECTED){
        Serial.println("WiFi Disconnected, cannot publish data");
        return;
    }
    
    client.publish(topic_pub_rfid.c_str(), message.c_str());
    Serial.println("✅ Published to topic: " + topic_pub_rfid);
    Serial.println("----------------------------------------");
}
