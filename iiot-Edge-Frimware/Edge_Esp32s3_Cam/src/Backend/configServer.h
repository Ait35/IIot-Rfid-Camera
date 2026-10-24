#include "./Secret/secret.h"
#include "./Camra_config/camra.h"

using namespace Camera;
using namespace Secret;

namespace Backend {
    bool connectToServer() {
        if (WiFi.status() != WL_CONNECTED) {
            return false;
        }
        if (key_api.length() == 0) {
            return false;
        }
        // if(!image_info.img){
        //     return false;
        // }
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
        mqtt_info.topic_sub_CMD_broadcast = 
            "SPU/CMD/group" + String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>() +"/broadcast";
        mqtt_info.topic_sub_CAM_broadcast = 
            "SPU/CAM/group" + String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>()+"/broadcast";
        mqtt_info.topic_pub_status = 
            "SPU/status/group"+ String(device_info.group_id) + "/" + doc["data"]["topic"].as<String>() + "/" + device_info.mac;
        // mqtt_info.topic_pub_rfid = 
        //     "SPU/rfid/group" + String(device_info.group_id) + "/" + device_info.mac +"/"+ doc["data"]["topic"].as<String>();
        Serial.println("topic status: " + mqtt_info.topic_pub_status);     
        Serial.println("topic CAM broadcast : " + mqtt_info.topic_sub_CAM_broadcast);
        Serial.println("topic CMD private : " + mqtt_info.topic_sub_private);
        Serial.println("topic CMD broadcast : " + mqtt_info.topic_sub_CMD_broadcast);    
        // Serial.println("topic rfid: " +  mqtt_info.topic_pub_rfid);
        Serial.println("----------------------------------------");

        return true;
    }

    bool SendImgToBackend(){
        if (image_info.img == NULL) {
            Serial.println("❌ No image buffer to send");
            return false;
}
        if (WiFi.status() != WL_CONNECTED) {
            Camera::clearImageBuffer();
            return false;
        }
        if (Secret::key_api.length() == 0) {
            Serial.println("No key_api in EEPROM, cannot send image to server");
            Camera::clearImageBuffer();
            return false;
        }
        if(Secret::API_upload_url.length() == 0 || portBackend == 0){
            Serial.println("No API URL ,cannot send image to server");
            Camera::clearImageBuffer();
            return false;
        }

        WiFiClient client;
        if (!client.connect(Secret::host.c_str(), Secret::portBackend)) {
            Camera::clearImageBuffer();
            return false;
        }
        String jsonPayload = 
            "{\"device_id\" : " + String(device_info.device_id) + ", \"group_id\" : " + String(device_info.group_id) + ", \"mac\" : \"" + device_info.mac + "\", \"log_id\" : " + String(image_info.log_id) + "}";
        String boundary = "----ESP32-S3-Cam-Boundary";

        //การใช้ /r คือการปัดให้เคอร์เซอร์การพิมพ์ ไปอยู่ทางซ้ายสุด ซึ่งปกติ /n ก็ทำให้อยู่แล้ว แต่ http ยังต้องใช้ /r + /n เพราะเก่าเกินแล้ว
        String body = "--" + boundary + "\r\n";
        body += "Content-Disposition: form-data; name=\"Jsondata\"\r\n"; // Backend จะรับค่าจากชื่อ metadata
        body += "Content-Type: application/json\r\n\r\n"; // บอกว่าข้างในนี้คือ JSON 
        body += jsonPayload + "\r\n"; // ใส่ข้อมูล JSON ลงไป

        body += "--" + boundary + "\r\n";
        body += "Content-Disposition: form-data; name=\"img\"; filename=\"Image.jpg\"\r\n";
        body += "Content-Type: image/jpeg\r\n\r\n";
        //ยังไม่ประกอบ img เพราะ แยกส่งจะได้ไม่กิน Ram 
        String bodyEnd = "\r\n--" + boundary + "--\r\n";

        uint32_t BodyLength = body.length() + image_info.img->len + bodyEnd.length();

        client.print("POST " + Secret::API_upload_url + " HTTP/1.1\r\n");
        client.print("Host: " + Secret::host + "\r\n");
        client.print("authorization: " + Secret::key_api + "\r\n"); // ส่ง API Key ไปใน Header
        client.print("Content-Type: multipart/form-data; boundary=" + boundary + "\r\n");
        client.print("Content-Length: " + String(BodyLength) + "\r\n");
        client.print("\r\n"); // บรรทัดว่างเพื่อจบท่อน Header

        client.print(body);  // ส่ง body 
        client.write(image_info.img->buf, image_info.img->len);  // ส่ง Image ตาม
        client.print(bodyEnd); // ส่ง Suffix ปิดท้าย

        long timeout = millis();
        while (client.available() == 0) {
            if (millis() - timeout > 5000) {
                Serial.println("Client Timeout !");
                client.stop();
                Camera::clearImageBuffer();
                return false;
            }
        }       
        //บรรทัดแรกสุดที่เซิร์ฟเวอร์ตอบกลับมาจะหน้าตาแบบนี้เสมอ: HTTP/1.1 200 OK\r\n
        String statusLine = client.readStringUntil('\n'); 
        int statusCode = 0;

        if (statusLine.startsWith("HTTP/1.")) {
            // หั่น String ตำแหน่งที่ 9 ถึง 12 (ตัวเลข 3 หลัก) แล้วแปลงเป็น Integer
            statusCode = statusLine.substring(9, 12).toInt();
            Serial.print("📡 HTTP Status Code: ");
            Serial.println(statusCode);
        }

        // อ่านและปริ้นท์ Response แต่ส่งแล้ว Backend save ลง DB ได้ไหม ชั่งมันเอาแค่ส่งได้พอ
        Serial.println("Server Response:");
        while (client.available()) {
            String line = client.readStringUntil('\n');
            Serial.print(line);
        }   
        Serial.println();    

        if (statusCode >= 200 && statusCode < 300) {
            Serial.println("✅ Image Uploaded Successfully!");
        } else {
            Serial.println("❌ Upload Failed!");
            client.stop();
            Camera::clearImageBuffer();
            return false;
        }

        client.stop();
        Camera::clearImageBuffer();
        return true;
    };
};