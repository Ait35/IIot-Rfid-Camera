#include "./Secret/secret.h"
#include "./global_variables.h"
#include "./OTA.h"
#include "./Helper/helper.h"

#include "./OLED/oled.tree.h"
#include "./Control_panel/panel.h"
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
    pinMode(BTN_UP_PIN, INPUT);
    pinMode(BTN_DOWN_PIN, INPUT);
    pinMode(BTN_SELECT_PIN, INPUT);

    Wire.begin(SDA_PIN, SCL_PIN);

    Dumy.addChild(&Root_Menu);
    Root_Menu.addChild(&R_esp_Status);
    Root_Menu.addChild(&R_cam_Status);
    Root_Menu.addChild(&R_Network_Status);
    Root_Menu.addChild(&R_MQTT_Status);
    // Root_Menu.addChild(&R_Restart);
    // Root_Menu.addChild(&R_Reset);
    Root_Menu.countChoice();

    R_Network_Status.addChild(&Net_WiFi_Status);
    R_Network_Status.addChild(&Net_AP_Status);
    R_Network_Status.countChoice();

    // R_Reset.addChild(&ReSet_WiFi);
    // R_Reset.addChild(&ReSet_API);
    // R_Reset.addChild(&ReSet_All);
    // R_Reset.countChoice();
  
    oled.begin(&Dumy);

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
            //oled.setUp_any("Server", false, serverDot);
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

    setupOTA();
    ArduinoOTA.begin();

}

void loop() {
    loopWebServer();
    mqtt.client.loop();
    ArduinoOTA.handle();

    if(WiFi.status() != WL_CONNECTED){
        ESP.restart();
    }
    if (!mqtt.client.connected()) {
        mqtt.reconnect(&oled);
    }

    oled.render();
    panel::handleButtons();   

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
    if(millis() - Rfid_lastTime > 3000){
        prevRfid = "";
        Rfid_lastTime = millis();
    }
    if(Rfid::readRfid()){
        delay(500);
        Rfid_lastTime = millis();
        Serial.println("Read Rfid Success");
        Rfid::chackType();
        Rfid::parsedFrame();
        Serial.println("-------------------------------------------------");

        if(rfid_data.tag != prevRfid){
            mqtt.publishEPC(
                "{\"device_id\" : " +  String(device_info.device_id) + ", \"group_id\" : " + String(device_info.group_id) + ", \"epc\" : \"" + rfid_data.tag + "\", \"distance\" : " + String(rfid_data.distance) +"}"
            );
            prevRfid = rfid_data.tag;
        }else{
            Serial.println("////Tag is same////");
            Serial.println("-------------------------------------------------");
        }

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