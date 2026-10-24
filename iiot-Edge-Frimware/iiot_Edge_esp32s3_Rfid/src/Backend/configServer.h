#include "./Secret/secret.h"

using namespace Secret;

namespace Backend {
    bool connectToServer() {
        if (WiFi.status() != WL_CONNECTED) {
            return false;
        }
        if (Secret::key_api.length() == 0) {
            return false;
        }
        HTTPClient http;

        String serverPath = Secret::API_URL; 
        http.begin(serverPath);
        Serial.println("Connecting to server...");
        Serial.println("----------------------------------------");

        http.addHeader("Content-Type", "application/json"); 
        http.addHeader("authorization", Secret::key_api);
        
        String body = "{\"mac\" : \"" + device_info.mac + "\"}";
        Serial.println(body);
        int httpResponseCode = http.POST(body);

        if( httpResponseCode < 0) {
            Serial.print("HTTP Response code: ");
            Serial.println(httpResponseCode);
            Serial.println("*********Error************");
            http.end();
            return false;
        }
        String response = http.getString();
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        Serial.println("Response from server: " + response);

        http.end();

        JsonDocument doc;

        deserializeJson(doc, response);
        if(doc["data"]["device_id"].isNull() || doc["data"]["group_id"].isNull()){
            Serial.println("❌ No device_id or group_id in response, cannot connect to server");
            return false;
        }
        if(doc["data"]["topic"].isNull()){
            Serial.println("❌ No topic in response, cannot connect to server");
            return false;
        }

        mqtt_info.userMqtt = doc["data"]["user_mqtt"].as<String>();
        mqtt_info.passMqtt = doc["data"]["pass_mqtt"].as<String>();
        device_info.device_id = doc["data"]["device_id"];
        device_info.group_id = doc["data"]["group_id"];

        // "topic":"b5/f9/r509"    
        mqtt_info.topic_sub_private = 
            "SPU/CMD/group" + String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>() + "/" + device_info.mac;
        mqtt_info.topic_sub_broadcats = 
            "SPU/CMD/group" + String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>() + "/broadcast";
        mqtt_info.topic_pub_status = 
            "SPU/status/group"+ String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>() + "/" + device_info.mac;
        mqtt_info.topic_pub_rfid = 
            "SPU/rfid/group" + String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>() + "/" + device_info.mac;
        Serial.println("topic CMD private : " + mqtt_info.topic_sub_private);
        Serial.println("topic CMD broadcast : " + mqtt_info.topic_sub_broadcats);
        Serial.println("topic status: " + mqtt_info.topic_pub_status);
        Serial.println("topic rfid: " +  mqtt_info.topic_pub_rfid);
        Serial.println("----------------------------------------");
        
        return true;
    }
};
// void sendDataToMqtt(String rfid_tag) {
//     if (WiFi.status() == WL_CONNECTED) {
//         HTTPClient http;

//         String serverPath = "http://172.20.10.3:3000/api/db/equipment"; 
//         http.begin(serverPath);
        
//         // 3. ตั้งค่า Header ว่าเราจะส่งข้อมูลแบบ JSON
//         http.addHeader("Content-Type", "application/json");
        
//         JsonDocument doc;
//         doc["device_id"] = wifiInfo.deviceId; 
//         doc["ip"] = wifiInfo.IP;
//         doc["group_id"] = rfid_tag;
//         doc["epc"] = rfid_tag;       
//         doc["timestamp"] = gettime();
        
//         String jsonPayload;
//         serializeJson(doc, jsonPayload);
        
//         Serial.println("Sending API Payload: " + jsonPayload);

//         int httpResponseCode = http.POST(jsonPayload);
        
//         // 6. เช็คผลลัพธ์การตอบกลับจาก Server
//         if (httpResponseCode > 0) {
//             String response = http.getString();
//             Serial.print("HTTP Response code: ");
//             Serial.println(httpResponseCode);
//             Serial.println("Response from server: " + response);
//         } else {
//             Serial.print("Error code on sending POST: ");
//             Serial.println(httpResponseCode);
//         }

//         http.end();
//     } else {
//         Serial.println("WiFi Disconnected, cannot send API");
//     }
// }