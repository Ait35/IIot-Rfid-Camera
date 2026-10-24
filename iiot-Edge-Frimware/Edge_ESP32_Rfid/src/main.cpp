#include "./Secret/secret.h"
#include "./global_variables.h"
#include "./Helper/helper.h"

#include "./Control_panel/Encoder_panel.h"
#include "./Network_config/WebServerSetup.h"
#include "./Network_config/config_network.h"
#include "./Network_config/esp32_Ap.h"

#include "./Backend/configServer.h"
#include "./Mqtt_service/Mqtt_service.h"
#include "./Rfid_config/rfid_config.h"
#include <nvs_flash.h>

#define rfid_RxPin 15
#define rfid_TxPin 16

using namespace Helper;
using namespace Rfid;
using namespace Backend;

Mqtt_service mqtt;

void callback(char* topic, uint8_t* payload, unsigned int length)
{
    Serial.print("📩 topic: ");
    Serial.print(topic);

    String message((char*)payload, length);

    Serial.println("📩 message: " + message);
    Serial.println("----------------------------------------");

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);
    if (error) {
      Serial.print("❌ JSON Parse Failed: ");
      Serial.println(error.c_str());
      return; // หยุดการทำงานทันทีเพื่อป้องกันบอร์ดค้าง
    }
    
    if(String(topic).endsWith("/broadcast") && doc["CMD"].as<String>() == "disconnect"){
        Serial.println("🔴 Broadcast disconnected wait for reconnect");
        mqtt.client.disconnect();
        delay(500);
        ESP.restart();
    }else if(String(topic).endsWith("/"+ device_info.mac) && doc["CMD"].as<String>() == "disconnect"){
        Serial.println("🔴 Disconnected wait for reconnect");
        mqtt.client.disconnect();
        delay(500);
        ESP.restart();
    }
    else{
        Serial.println("😴 No action");
        Serial.println("----------------------------------------");
    }
}

void setup() {
    Serial.begin(115200);
    Serial2.begin(115200, SERIAL_8N1, rfid_RxPin, rfid_TxPin);
    pinMode(CONFRIM_PIN, INPUT);
    pinMode(BACK_PIN, INPUT);

    Wire.begin(SDA_PIN, SCL_PIN);
    oled.begin();
    Encoder_panel::initEncoder();

    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        Serial.println("NVS partition was truncated. Erasing...");
        nvs_flash_erase();
        err = nvs_flash_init();
    }
    if (err == ESP_OK) {
        Serial.println("NVS Initialized successfully");
  }
    if (!LittleFS.begin(true)) {
        Serial.println("An Error has occurred while mounting LittleFS");
    }
    WiFi.mode(WIFI_MODE_STA);

    device_info.deviceName = setDeviceId();
    setAP(&device_info.deviceName);
    server.begin();
    setupWebServer();

    Serial.print("connect internet...");
    //เช็ค SSID / password in EEprom
    if(!checkMemory_SSID_Pass()) {
        Serial.println("No SSID in EEPROM, start WebServer to setup WiFi");
        Serial.println("-------------------------------------------------");
    }else{
        Serial.println("Connecting to WiFi: " + device_info.EEPROM_SSID);
        connectWiFi(&device_info.EEPROM_SSID, &device_info.EEPROM_Pass);
        IsWedGetIP = true;
        WiFi.softAPdisconnect(true);
    }

    while (!IsWedGetIP || WiFi.status() != WL_CONNECTED) {
        loopWebServer();
        oled.Ap_status();
        delay(10);
    }       
    Serial.println("Browser is " + WiFi.localIP().toString());

    Serial.println("Connecting to server...");
    Secret::key_api = checkMemory_key_api();
    if (Secret::key_api.length() > 0) {
        Serial.println("Connecting to server with key_api: " + Secret::key_api);
    } else {
        Serial.println("No key_api in EEPROM, start WebServer to setup key_api");
    }

    oled.setUp_any("Server", false, 0);
    int serverDot = 0;
    unsigned long lastServerDot = millis();
    ServerConnectTime = millis();
    bool connect = Backend::connectToServer();
    while (!connect) {
        loopWebServer();   
        if (WiFi.status() != WL_CONNECTED) ESP.restart();

        // อัปเดตจุดกำลังโหลด Server ให้ขยับลื่นไหลทุก 300ms
        if (millis() - lastServerDot >= 300) {
            serverDot = (serverDot + 1) % 4;
            oled.setUp_any("Server", false, serverDot);
            lastServerDot = millis();
        }

        if(millis() - ServerConnectTime > 3000){            
            if (Backend::connectToServer()) {
                Serial.println("✅ Connected to server");
                connect = true;
                break;
            }
            Serial.println("Failed to connect to server, retrying in 3 seconds...");
            ServerConnectTime = millis();
        }
        delay(5);
    }
    oled.setUp_any("Server", true, 0);
    delay(500);
    
    configTime(7*3600, 0, "pool.ntp.org");
    device_info.StartTime = gettime();
    device_info.HardWareUpTime = getUpTime(millis());
        
    mqtt.setupMqtt(
        mqtt_info.userMqtt, 
        mqtt_info.passMqtt, 
        mqtt_info.topic_pub_status, 
        mqtt_info.topic_pub_rfid,
        mqtt_info.topic_sub_private,
        mqtt_info.topic_sub_broadcats
    );

    mqtt.reconnect(&oled);
    mqtt.client.setCallback(callback);
    publishStatusTime = millis();
}

void loop() {
    loopWebServer();
    mqtt.client.loop();

    if(WiFi.status() != WL_CONNECTED){
        ESP.restart();
    }
    if (!mqtt.client.connected()) {
        mqtt.reconnect(&oled);
    }

    if(Encoder_panel::hasChanged() || state == 0){
        //Serial.println("hasChanged");
        select_at = Encoder_panel::getValue();
       // Serial.println("hasChanged select_at: " + String(select_at));
        oled.enterMenu(state , select_at);
    };
    if(Encoder_panel::getValue_confrim() == 0 && Encoder_panel::getValue_back() == 1){
        //เอา lambda(จำลองฟังชั่น) ครอบเพื่อให้ return ไม่ออก void loop หลัก ออกแค่ lambda
        [&]{
            long PressTime = millis();
            while(Encoder_panel::getValue_confrim() == 0){
                if(millis() - PressTime >3000) return;//ออก lambda
            }// กันปุ่มรั่วเกิน
        
            Serial.println("press confirm BTN");
            //ดักขับว่าอยุ่หน้า Reset ไหม จะทำให้ทำงาน
            if(StackSrceen.back() == 5){
                oled.MenuActionReset(select_at); 
                return;
            }
            if(oled.menuList[StackSrceen[state]].size() > state){
                state ++;
                StackSrceen.push_back(select_at);
                encoder.setEncoderValue(0);
                select_at = 0; //เริ่ม page ถัดไปที่ เมนูแรก
            }
            //Serial.println("select: " + String(select_at));
            oled.enterMenu(state , select_at);
        }();
    }else if(Encoder_panel::getValue_confrim() == 1 && Encoder_panel::getValue_back() == 0){
        [&]{
            long PressTime = millis();
            while(Encoder_panel::getValue_back() == 0){
                if(millis() - PressTime >3000) return;//ออก lambda
            }// กันปุ่มรั่วเกิน

            Serial.println("press back BTN");
            if(state > 0 && StackSrceen.size() > 1){
                state --;
                StackSrceen.pop_back();
                encoder.setEncoderValue(0);
                select_at = 0;
                oled.enterMenu(state ,StackSrceen.back());
            }
        }();
    }
    
    if (millis() - publishStatusTime > 30000) { // 30 วินาที
        Serial.println("⚠️ Publish status to MQTT"); 
        device_info.HardWareUpTime = getUpTime(millis());
        Serial.println("HardWareUpTime: " + device_info.HardWareUpTime + " status: true") ;
        mqtt.publishStatus(
            "{\"device_id\":" + String(device_info.device_id) + 
            ", \"mac\":\"" + device_info.mac + "\"" +
            ", \"hw_uptime\":" + String(millis()) + 
            ", \"free_heap\":" + String(ESP.getFreeHeap()) + 
            ", \"rssi\":" + String(WiFi.RSSI()) + 
            ", \"status\":true}"
        );
        publishStatusTime = millis(); //re
    }
    if(Rfid::readRfid()){
        delay(1000);
        Serial.println("Read Rfid Success");
        Rfid::chackType();
        Rfid::parsedFrame();
        Serial.println("-------------------------------------------------");
        mqtt.publishEPC(
            "{\"device_id\" : " +  String(device_info.device_id) + ", \"group_id\" : " + String(device_info.group_id) + ", \"epc\" : \"" + rfid_data.tag + "\", \"distance\" : " + String(rfid_data.distance) +"}"
        );

        frameBuffer.clear();
    }
    if(!frameBuffer.empty() && (millis() - Rfid::lastByteTime > 50)){
        frameBuffer.clear();
        Rfid::lastByteTime = 0;
        Serial.println("Clear FrameBuffer after No data for 50 ms");
        Serial.println("-------------------------------------------------");
    }
    delay(5); 
}