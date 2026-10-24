#include "oled.h"
#include "../global_variables.h"
#include "./Helper/helper.h"

bool OLED::begin()
{
    _display.begin(SH1106_SWITCHCAPVCC, SCREEN_ADDRESS);
    this->menuList= {
        {"StatusESP"}, 
        {"Rfid"}, 
        {"NetWork" , "WiFi" ,"AP"}, 
        {"MQTT"}, 
        {"Restart"},
        {"Reset"}
    };
    
    _display.clearDisplay();
    _display.setTextSize(2);
    _display.setTextColor(WHITE);
    _display.setCursor(0,0);
    _display.println("Edge");
    _display.setCursor(0,20);
    _display.println("ESP32");
    _display.setCursor(0,40);
    _display.println("RFID");
    _display.display();
    return true;
}

void OLED::clear_display()
{
    _display.clearDisplay();
}

void OLED::Ap_status()
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor(0,10);
    _display.println("SSID: " + device_info.apSsid);
    _display.setCursor(0,25);
    _display.println("PASS: " + device_info.apPassword);
    _display.setCursor(0,40);
    _display.println("ConfigWed:" + device_info.apIP);    
    _display.display();
}

void OLED::setUp_any(String what_setup, bool state, int dot_count)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.drawRoundRect(0, 0, 128, 64, 4, WHITE);

    switch (state) {
        case false:
            if(what_setup == "WiFi") {
                _display.setCursor(52, 16);
                _display.println(what_setup);
                
                _display.setCursor(34, 36);
                _display.print("Connecting");
                for (int i = 0; i < dot_count; i++) { _display.print("."); }
            }
            else { 
                int textWidth = what_setup.length() * 6;
                _display.setCursor((128 - textWidth) / 2, 14);
                _display.println(what_setup);
                
                _display.setCursor(25, 30);
                _display.print("Connecting");
                for (int i = 0; i < dot_count; i++) { _display.print("."); }
            
                _display.setCursor(10, 48);
                _display.print("IP: ");
                _display.print(WiFi.localIP());
            }
            break;

        case true:
            _display.setCursor(34, 28);
            _display.println("Connected!");
            break;
    }
    _display.display();
}


void OLED::enterMenu(int state , int select)
{   
    int IndexPage ;
    int IndexMenuSelect;
    switch (state)
    {
    case 0: //main menu select
        encoder.setBoundaries(0, menuList.size()-1 , true);
        main_munu(select);
        break;
    case 1: //sub main menu select
        switch(StackSrceen[state]){
            case 0:
                IndexPage = 1;
                encoder.setBoundaries(0, IndexPage , true);
                show_espStatus(select);
                break;
            case 1:
                encoder.setBoundaries(0, 0 , true);
                show_rfidStatus();
                break;
            case 2:
                IndexMenuSelect = 1;
                encoder.setBoundaries(0, IndexMenuSelect , true);
                //เฉพาะครั้งแรก ครั้งอื่นมันไม่เกินหรือน้อยกว่าอยู่ละ ไบาลี่จัดการให้
                if(select > IndexMenuSelect){ 
                    select = 0;
                    show_NetwoekStatus(select);
                    break;
                }
                show_NetwoekStatus(select);
                break;
            case 3:
                IndexPage = 4;
                encoder.setBoundaries(0, IndexPage , true);
                if(select > IndexPage){
                    select = 0;
                    show_MQTTStatus(0);
                    break;
                }
                show_MQTTStatus(select);
                break;
            case 4:
                encoder.setBoundaries(0, 0 , true);
                Restart();
                break;
            case 5:
                encoder.setBoundaries(0, 1 , true);
                show_Reset(select);
                break;
        }
        break;
    case 2: //sub ขึ้นอีก 
        switch(StackSrceen[state]){
            case 0:
                IndexPage = 1;
                encoder.setBoundaries(0, IndexPage , true);
                if(select > IndexPage){
                    select = 0;
                    Network_WiFiStatus(0);
                    break;
                }
                Network_WiFiStatus(select);
                break;
            case 1:
                IndexPage = 1;
                encoder.setBoundaries(0, IndexPage , true);
                if(select > IndexPage){
                    select = 0;
                    Network_ApStatus(0);
                    break;
                }
                Network_ApStatus(select);
                break;
        }
        break;
    default:
        break;
    }
}

void OLED::main_munu(int select = 0)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(15,0);
    _display.println("Menu");
    _display.setCursor(15,10);
    _display.println("------------------");

    if(select == 0){
        _display.setCursor(15 , 23);
        _display.println("=> " + menuList[select][0]);
        _display.setCursor(15 , 38);
        _display.println(menuList[select + 1][0]);
        _display.setCursor(15 , 53);
        _display.println(menuList[select + 2][0]);
    }else if (select != 0 && select+1 <= menuList.size()-1){
        _display.setCursor(15 , 23);
        _display.println(menuList[select - 1][0]);
        _display.setCursor(15 , 38);
        _display.println("=> " + menuList[select][0]);
        _display.setCursor(15 , 53);
        _display.println(menuList[select + 1][0]);
    }else{
        _display.setCursor(15 , 23);
        _display.println(menuList[select - 2][0]);
        _display.setCursor(15 , 38);
        _display.println(menuList[select - 1][0]);
        _display.setCursor(15 , 53);
        _display.println("=> " + menuList[select][0]);
    }
    
    _display.display();
}

void OLED::show_espStatus(int slidePage)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(5,0);
    _display.println("ESP32 Status");
    _display.setCursor(5,10);
    _display.println("------------------");

     if(slidePage == 0){ 
        _display.setCursor(5,23);
        _display.println("mac: " + device_info.mac);
        _display.setCursor(5,38);
        _display.println("UpTime: " + String(device_info.HardWareUpTime));
        _display.setCursor(5,53);
        _display.println("FreeHeap: " + String(ESP.getFreeHeap()));
    }else if (slidePage == 1){
        _display.setCursor(5,23);
        _display.println("UpTime: " + String(device_info.HardWareUpTime));
        _display.setCursor(5,38);
        _display.println("FreeHeap: " + String(ESP.getFreeHeap()));
        _display.setCursor(5,53);
        _display.println("RSSI: " + String(WiFi.RSSI()));
    }
    _display.display();
}

void OLED::show_rfidStatus()
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(5,0);
    _display.println("ESP32 Rfid");
    _display.setCursor(5,10);
    _display.println("------------------");

    _display.setCursor((128-(6*1*7))/2,((64-10)-(8*1))/2);
    _display.println("No Data");
    _display.display();
}

void OLED::show_NetwoekStatus(int select)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(5,0);
    _display.println("NetWork Status");
    _display.setCursor(5,10);
    _display.println("------------------");

    switch(select){
        case 0:
            _display.setCursor(5,23);
            _display.println("=> WiFi Status");
            _display.setCursor(5,38);
            _display.println("AP Status");
            break;
        case 1:
            _display.setCursor(5,23);
            _display.println("WiFi Status");
            _display.setCursor(5,38);
            _display.println("=> AP Status");
            break;
    }
    _display.display();
}

void OLED::Network_WiFiStatus(int slidePage)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(3,0);
    _display.println("WiFi Status");
    _display.setCursor(3,10);
    _display.println("-------------------");

    switch (slidePage)
    {
    case 0:
        _display.setCursor(3,23);
        _display.println("SSID: " + device_info.EEPROM_SSID);
        _display.setCursor(3,38);
        _display.println("PASS: " + device_info.EEPROM_Pass);
        _display.setCursor(3,53);
        _display.println("IP: " + device_info.IP);
        break;
    case 1:
        _display.setCursor(3,23);
        _display.println("subnet: " + device_info.subnet);
        _display.setCursor(3,38);
        _display.println("gateway: " + device_info.gateway);
        _display.setCursor(3,53);
        _display.setFont(&TomThumb);
        _display.println("hostname: " + device_info.apHostname);
        _display.setFont();
        break;
    }
    _display.display();
}

void OLED::Network_ApStatus(int slidePage)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(3,0);
    _display.println("AP Status");
    _display.setCursor(3,10);
    _display.println("------------------");

    switch (slidePage)
    {
    case 0:
        _display.setCursor(3,23);
        _display.println("SSID: " + device_info.apSsid);
        _display.setCursor(3,38);
        _display.println("PASS: " + device_info.apPassword);
        _display.setCursor(3,53);
        _display.println("IP: " + device_info.apIP);
        break;
    case 1:
        _display.setCursor(3,23);
        _display.println("IP: " + device_info.apIP);
        _display.setCursor(3,38);
        _display.println("gateway: " + device_info.apIP);
        _display.setCursor(3,53);
        _display.setFont(&TomThumb);
        _display.println("hostname: " + device_info.apHostname);
        _display.setFont();
        break;
    }
    _display.display();
}

void OLED::show_MQTTStatus(int slidePage)
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(2,0);
    _display.println("MQTT Status");
    _display.setCursor(2,10);
    _display.println("--------------------");

    switch (slidePage)
    {
    case 0:
        _display.setCursor(2,23);
        _display.println("user: " + mqtt_info.userMqtt);
        _display.setCursor(2,38);
        _display.println("pass: " + mqtt_info.passMqtt);
        _display.setCursor(2,53);
        _display.print("QoS: 0");
        _display.setCursor(50,53);
        _display.println("LWT: True");
        break;
    case 1:
        _display.setCursor(2,23);
        _display.println("topicStatus (Pub) :");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_pub_status.substring(0, 21));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_pub_status.substring(21, mqtt_info.topic_pub_status.length()));
        break;
    case 2:
        _display.setCursor(2,23);
        _display.println("topicRfid (Pub) : ");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_pub_rfid.substring(0, 21));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_pub_rfid.substring(21, mqtt_info.topic_pub_rfid.length()));
        break;
    case 3:
        _display.setCursor(2,23);
        _display.println("topicList (Private):");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_sub_private.substring(0, 20));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_sub_private.substring(20, mqtt_info.topic_sub_private.length()));
        break;
    case 4:
        _display.setCursor(2,23);
        _display.println("topicList (Broadcast)");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_sub_broadcats.substring(0, 20));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_sub_broadcats.substring(20, mqtt_info.topic_sub_broadcats.length()));
        break;
    }
    _display.display();
}

void OLED::show_Reset(int select)
{
    _display.fillRect(10, 10, 108, 44, BLACK);
    _display.drawRect(10, 10, 108, 44, WHITE);
    
    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor((128 - (13 * 6)) / 2, 18);
    _display.println("Are you sure?");
    int y_pos = 38; 
    
    switch (select)
    {
    case 0:
        _display.setCursor(20, y_pos);
        _display.println("=> Yes");
        
        _display.setCursor(85, y_pos);
        _display.println("   No");
        break;   
    case 1:
    default:
        _display.setCursor(20, y_pos);
        _display.println("   Yes");
        
        _display.setCursor(85, y_pos);
        _display.println("=> No");
        break;
    }
    _display.display();
}

void OLED::Restart()
{
    // ตั้งค่าฟอนต์และข้อความล่วงหน้าเพื่อคำนวณตำแหน่ง
    int barWidth = 90;
    int barHeight = 6;
    int barX = (128 - barWidth) / 2; // จัดแถบให้อยู่กึ่งกลางจอพอดี
    int barY = 42;

    // ทำอนิเมชันแถบวิ่ง (วนลูป 15 ครั้ง ครั้งละ 100ms = 1500ms พอดี)
    for (int i = 0; i <= 15; i++) {
        _display.clearDisplay();
        
        // 1. วาดกรอบสี่เหลี่ยมโค้งมนรอบจอเพิ่มความนุ่มนวล
        _display.drawRoundRect(2, 2, 124, 60, 4, WHITE);
        
        // 2. พิมพ์ข้อความหัวข้อด้วยฟอนต์เท่ๆ จัดกึ่งกลางจอ
        _display.setFont(&FreeSans9pt7b);
        _display.setTextColor(WHITE);
        _display.setTextSize(1);
        // "Restarting..." (ยาวประมาณ 78 พิกเซล) จัดให้อยู่กลางจอ
        _display.setCursor((128 - 78) / 2, 26); 
        _display.println("Restarting");
        _display.setFont(); // คืนค่าฟอนต์มาตรฐาน
        
        // 3. วาดตัวกรอบ Progress Bar
        _display.drawRect(barX, barY, barWidth, barHeight, WHITE);
        
        // 4. วาดแถบข้างในให้ค่อยๆ ยาวขึ้นตามเวลา i
        int currentProgress = (barWidth - 4) * i / 15;
        _display.fillRect(barX + 2, barY + 2, currentProgress, barHeight - 4, WHITE);
        
        _display.display();
        delay(100); // ดึงเชนจ์ทีละนิดเพื่อให้เห็นภาพเคลื่อนไหว
    }
    
    // ดับเครื่อง
    ESP.restart();
}


void OLED::MenuActionReset(int select) {
    switch (select)
    {
    case 0: 
        Serial.println("Reset ESP32");
        Helper::claer_ALL_EEprom("wifi-creds");
        Helper::claer_ALL_EEprom("key_api-creds");

        this->Restart();
        break;   
    case 1: 
    default:
        Serial.println("Cancel Reset");
        if(state > 0 && StackSrceen.size() > 1){
            state--;
            int previous_select = StackSrceen.back(); // เก็บค่าเมนูก่อนหน้าไว้
            StackSrceen.pop_back(); 

            encoder.setEncoderValue(0); 
            select_at = 0; 
            
            // วาดเมนูก่อนหน้าขึ้นมาใหม่
            this->enterMenu(state, StackSrceen.back());
        }
        break;
    }
}
