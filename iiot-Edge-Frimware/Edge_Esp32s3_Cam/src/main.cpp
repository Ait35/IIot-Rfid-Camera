#include "./Secret/secret.h"
#include "./global_variables.h"
#include "./Helper/helper.h"

#include "./Network_config/WebServerSetup.h"
#include "./Network_config/config_network.h"
#include "./Network_config/esp32_Ap.h"

#include "./Backend/configServer.h"
#include "./Mqtt_service/Mqtt_service.h"
#include  "./Camra_config/camra.h"
#include "./Control_panel/panel.h"
#include <nvs_flash.h>

using namespace Helper;
using namespace Backend;
using namespace Camera;

Mqtt_service mqtt;

//แยกไปส่ง api ใน cpu core อื่น
void uploadTask(void *pvParameters) {
    //*pvParameters ที่มารอรับค่าจากพารามิเตอร์ตัวที่ 4 ของคำสั่ง xTaskCreatePinnedToCore แม้เราจะส่ง NULL มา แต่กฎของภาษา C/C++ บังคับว่าต้องเขียนรับพารามิเตอร์ตัวนี้ไว้เสมอ มิฉะนั้นจะ Compile ไม่ผ่าน
    ImageInfo cur_image_info;
    //Infinite Loop 
    for (;;) {
        //portMAX_DELAY คืแให้หลุดการทำงานนี้ไปเลย ถ้าไม่มี คิว ทำให้กินทรัพยากร 0
        if (xQueueReceive(ImageQueue, &cur_image_info, portMAX_DELAY) == pdTRUE) {
            image_info.log_id = cur_image_info.log_id;
            image_info.img = cur_image_info.img;

            Backend::SendImgToBackend();
        }
        //คล้าย delay(10) ของ Arduino แต่เป็นคำสั่งระดับ OS โดยตรง ส่วน portTICK_PERIOD_MS: คือค่าคงที่ที่ใช้แปลงหน่วยจาก "มิลลิวินาที" ให้กลายเป็นหน่วยเวลาของระบบปฏิบัติการที่เรียกว่า "Tick" (บน ESP32 ปกติ 1 Tick = 1 ms) การเอา 10 ตั้งแล้วหารด้วยค่านี้ = 10 มิลลิวินาที
        vTaskDelay(10 / portTICK_PERIOD_MS);
        //FreeRTOS จะมี Watchdog Timer ถ้า Task ไหนทำงานวนลูปรัวๆ โดยไม่ยอมหยุดพักให้ OS เลยเกิน 5 วินาที Watchdog จะคิดว่าโปรแกรมค้าง และสั่งรีบูตบอร์ดทันที คำสั่งนี้จึงเป็นการบอก OS ว่า "ฉันทำงานรอบนี้เสร็จแล้ว เอาเวลา CPU ไปทำอย่างอื่นก่อนได้เลย 10 ms"
    }
}

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
        Serial.println("🔴 Droadcats disconnected wait for reconnect");
        mqtt.client.disconnect();
        delay(500);
        ESP.restart();
    }else if(String(topic).endsWith("/"+ device_info.mac) && doc["CMD"].as<String>() == "disconnect"){
        Serial.println("🔴 Disconnected wait for reconnect");
        mqtt.client.disconnect();
        delay(500);
        ESP.restart();
    }else if((doc["cap"] == 1 || doc["cap"] == "1") && !doc["log_id"].isNull()){
        camera_fb_t *img = Camera::capture(); 
        if (!img) return;
        
        ImageInfo new_image_into_Queue;
        new_image_into_Queue.log_id = doc["log_id"];
        new_image_into_Queue.img = img;
        // โยนงานใส่คิวแล้วจบการทำงานของ Callback ทันที
        //0 ตัวท้ายคือ เวลาที่จะให้รอถ้าคิวเต็ม การใส่ 0 แปลว่า ไม่ต้องรอเลย ถ้าคิวเต็ม 5 ช่องแล้ว ให้ข้ามไปทันที เพื่อไม่ให้ฟังก์ชัน callback ของ MQTT ต้องหยุดชะงัก
        if (xQueueSend(ImageQueue, &new_image_into_Queue, 0) == pdTRUE) {
            Serial.println("📌 Queued log_id: " + String(new_image_into_Queue.log_id));
        } else {
            Serial.println("⚠️ Queue Full! Dropped log_id: " + String(new_image_into_Queue.log_id));
            esp_camera_fb_return(new_image_into_Queue.img);
        }
        Serial.println("----------------------------------------");
    }else{
        Serial.println("😴 No action");
        Serial.println("----------------------------------------");
    }
}

void setup() {
    Serial.begin(115200);
    delay(500); 
    pinMode(CONFRIM_PIN, INPUT_PULLUP);
    pinMode(BACK_PIN, INPUT_PULLUP);

    Wire.begin(SDA_PIN, SCL_PIN);

    Dumy.addChild(&Root_Menu);
    
    Root_Menu.addChild(&R_esp_Status);
    Root_Menu.addChild(&R_cam_Status);
    Root_Menu.addChild(&R_Network_Status);
    Root_Menu.addChild(&R_MQTT_Status);
    Root_Menu.addChild(&R_Restart);
    Root_Menu.addChild(&R_Reset);
    Root_Menu.countChoice();

    R_Network_Status.addChild(&Net_WiFi_Status);
    R_Network_Status.addChild(&Net_AP_Status);
    R_Network_Status.countChoice();

    R_Reset.addChild(&ReSet_WiFi);
    R_Reset.addChild(&ReSet_API);
    R_Reset.addChild(&ReSet_All);
    R_Reset.countChoice();
  
    oled.begin(&Dumy);
    Encoder_panel::initEncoder();

    // --- เริ่มบล็อกซ่อมแซม NVS ---
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

    int count = 0;
    Serial.println("Connecting to server...");
    key_api = checkMemory_key_api();
    if (key_api.length() > 0) {
        Serial.println("Connecting to server with key_api: " + key_api);
    } else {
        Serial.println("No key_api in EEPROM, start WebServer to setup key_api");
    }

    Camera::setupCamera();
    //set Queue
    ImageQueue = xQueueCreate(3, sizeof(ImageInfo));

    oled.setUp_any("Server", false, 0);
    int serverDot = 0;
    unsigned long lastServerDot = millis();
    unsigned long ServerConnectTime = millis();
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

    //พาราแรกคือ ฟังชั่น , ชื่อเรียกเอาไว้ดูเวลาบอร์ด Crash แล้วพ่น Log , ขนาดใน SRAM ตั้งไว้ที่ 8192 Bytes (8 KB) , พาราที่ส่งเข้าไปในฟังชั่น , ความสำคัญ ปกติ cpu 1 จะที ช defluat 1, ตัวแปร Handle ของ Task เอาไว้ใช้อ้างอิงกรณีอยากสั่งหยุดหรือลบ Task , หมายเลขแกน CPU (0 หรือ 1) เนื่องจาก loop() และ mqtt.client.loop() รันอยู่บน Core 1 เราจึงโยนงานอัปโหลดภาพไปไว้ที่ Core 0 
    xTaskCreatePinnedToCore(uploadTask, "UploadTask", 8192, NULL, 1, NULL, 0);

    configTime(7*3600, 0, "pool.ntp.org");
    device_info.StartTime = gettime();
    device_info.HardWareUpTime = getUpTime(millis());
        
    mqtt.setupMqtt(
        mqtt_info.userMqtt, 
        mqtt_info.passMqtt, 
        mqtt_info.topic_pub_status, 
        mqtt_info.topic_sub_private,
        mqtt_info.topic_sub_CAM_broadcast,
        mqtt_info.topic_sub_CMD_broadcast
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
    oled.render();
    if(Encoder_panel::hasChanged()){
        //Serial.println("hasChanged");
        select_at = Encoder_panel::getValue();
        Serial.println("hasChanged select_at: " + String(select_at));
        oled.NextAndPrev(select_at);
    };
    if(Encoder_panel::getValue_confrim() == 0 && Encoder_panel::getValue_back() == 1){
        //เอา lambda(จำลองฟังชั่น) ครอบเพื่อให้ return ไม่ออก void loop หลัก ออกแค่ lambda
        [&]{
            long PressTime = millis();
            while(Encoder_panel::getValue_confrim() == 0){
                if(millis() - PressTime >3000) return;//ออก lambda
            }// กันปุ่มรั่วเกิน
        
            Serial.println("press confirm BTN");
            //กดเข้าหน้า Reset เปลี่ยนตัว int ทำให้ยังไม่เข้า if พอไปหน้าถัดไปหลังจากเลือกรูปแบบ Reset แล้ว พอเลื่อนปุ่มตัวแปร bool ก็จะเปลี่ยนเป็น True แต่ยังไม่ทำงาน เพราะมี if ตรวจการกดปุ่มครอบอยู่ ต้องกดก่อนถึงจะเข้าเช็คได้
            if(Choice_Reset_FromOLED != 0 && conFrimReset == 1){
                oled.MenuActionReset(); 
                return;
            }else if(Choice_Reset_FromOLED != 0 && conFrimReset == 2){
                Choice_Reset_FromOLED = 0;
                oled.moveUp();
                Serial.println("***Cancel Reset***");
                return;
            }
            oled.moveDown();
        }();
    }else if(Encoder_panel::getValue_confrim() == 1 && Encoder_panel::getValue_back() == 0){
        [&]{
            long PressTime = millis();
            while(Encoder_panel::getValue_back() == 0){
                if(millis() - PressTime >3000) return;//ออก lambda
            }// กันปุ่มรั่วเกิน

            Serial.println("press back BTN");
            if(Choice_Reset_FromOLED > 0){
                conFrimReset = 0;
                Choice_Reset_FromOLED = 0;
            }
            oled.moveUp();
        }();
    }

    if (millis() - publishStatusTime > 30000) { // 30 วินาที
        Serial.println("⚠️ Publish status to MQTT"); 
        device_info.HardWareUpTime = getUpTime(millis());
        Serial.println("HardWareUpTime: " + device_info.HardWareUpTime + " status: true");
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
    delay(5); 
}