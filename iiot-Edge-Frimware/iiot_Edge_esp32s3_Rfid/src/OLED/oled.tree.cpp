#include "oled.tree.h"
#include "../global_variables.h"
#include <Helper/helper.h>

void Srceen_Info::addChild(Srceen_Info *c)
{
    c->parent = this;
    if(!this->child){
        this->child = c;
    }else{
        Srceen_Info* temp = this->child;
        while(temp->next){
            temp = temp->next;
        }
        temp->next = c;
        c->prev = temp;
    }
}

void Srceen_Info::countChoice()
{
    this->Choice = 0;

    if(!this->child){
        return;
    }
    Srceen_Info* temp = this->child;
    
    while(temp->next){
        temp = temp->next;
        this->Choice++;
    }
    Serial.println("Choice: " + String(this->Choice));
}

void OLED::begin(Srceen_Info* rootN)
{
    _display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS);
    
    this->rootNode = rootN->child;
    this->ActionPointer = this->rootNode;
    this->NodePointer = this->rootNode->child;
    this->deep = 0;

    _display.clearDisplay();
    _display.setTextSize(2);
    _display.setTextColor(WHITE);
    _display.setCursor(0,0);
    _display.println("Edge");
    _display.setCursor(0,20);
    _display.println("ESP32");
    _display.setCursor(0,40);
    _display.println("CAM");
    _display.display();
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

    _display.setCursor(0, 10);
    _display.println("SSID: " + device_info.apSsid);
    _display.setCursor(0, 25);
    _display.println("PASS: " + device_info.apPassword);
    _display.setCursor(0, 40);
    _display.println("ConfigWeb: " + device_info.apIP);    
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

void OLED::NextAndPrev(int select)
{
    if(select > this->count){
        for (this->count; select > this->count ; this->count++) {
            if(this->NodePointer->next){
                this->NodePointer = this->NodePointer->next;
            } 
        }
        Serial.println("next " + String(this->NodePointer->name));
    }else if(select < this->count){
        for (this->count; select < this->count ; this->count--) {
            if(this->NodePointer->prev){
                this->NodePointer = this->NodePointer->prev;
            }
        }
        Serial.println("prev " + String(this->NodePointer->name));
    }
}

void OLED::moveDown()
{
    if(this->ActionPointer->child ){
        this->ActionPointer = this->NodePointer;
    }else{
        Serial.println("❌ No child");
        return;
    }

    if(this->NodePointer->child){
        this->NodePointer = this->NodePointer->child;
    }else{
        Serial.println("Last child");
    }

    this->deep++;
    this->count = 0;
    //encoder.setEncoderValue(0);
    select_at = 0;
    this->ActionPointer->action();
}

  void OLED::moveUp()
{
    if (this->deep <= 0 || this->ActionPointer == this->rootNode || this->ActionPointer->parent == nullptr) {
        Serial.println("❌ Is Root");
        return;
    }
    
    this->deep--;
    this->ActionPointer = this->ActionPointer->parent;
    this->NodePointer = this->ActionPointer->child;
    this->count = 0;
    // encoder.setEncoderValue(0);
    select_at = 0;
    this->ActionPointer->action();
}

void OLED::randerHeader()
{
    _display.clearDisplay();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(2,0);
    _display.println(ActionPointer->name);
    _display.setCursor(2,10);
    _display.println("--------------------");

}

void OLED::main_munu(int select)
{
    //encoder.setBoundaries(0, this->ActionPointer->Choice , true);

    this->NextAndPrev(select);
    this->randerHeader();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor(95, 0);
    _display.print("(1/1)");
    if(select == 0 && this->NodePointer->next && this->NodePointer->next->next){
        _display.setCursor(15 , 23);
        _display.println("=> " + String(this->NodePointer->name));
        _display.setCursor(15 , 38);
        _display.println(this->NodePointer->next->name);
        _display.setCursor(15 , 53);
        _display.println(this->NodePointer->next->next->name);
    }else if (select != 0 && this->NodePointer->next && this->NodePointer->prev){
        _display.setCursor(15 , 23);
        _display.println(this->NodePointer->prev->name);
        _display.setCursor(15 , 38);
        _display.println("=> " + String(this->NodePointer->name));
        _display.setCursor(15 , 53);
        _display.println(this->NodePointer->next->name);
    }else if (this->NodePointer->next == nullptr && this->NodePointer->prev && this->NodePointer->prev->prev){
        _display.setCursor(15 , 23);
        _display.println(this->NodePointer->prev->prev->name);
        _display.setCursor(15 , 38);
        _display.println(this->NodePointer->prev->name);
        _display.setCursor(15 , 53);
        _display.println("=> " + String(this->NodePointer->name));
    }else{
        // Serial.println("select"+select);
        // Serial.println("name NodePointer->name: " + String(this->NodePointer->name));

        Serial.println("❌ No prev node");
    }
    
    _display.display();
}

void OLED::randerEspStatus(int slidePage)
{
    // encoder.setBoundaries(0, this->ActionPointer->page-1 , true);
    this->randerHeader();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor(95, 0);
    _display.print("(" + String(slidePage + 1) + "/" + String(this->ActionPointer->page) + ")");
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

void OLED::randerCamStatus()
{
    //encoder.setBoundaries(0, this->ActionPointer->Choice , true);
    this->randerHeader();

    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor((128-(6*1*7))/2,((64-10)-(8*1))/2);
    _display.println("No Data");
    _display.display();
}

void OLED::randerNetwoekStatus(int select)
{
    // encoder.setBoundaries(0, this->ActionPointer->Choice , true);
    this->NextAndPrev(select);
    this->randerHeader();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor(95, 0);
    _display.print("(1/1)");
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

void OLED::randerWiFiStatus(int slidePage)
{
    // encoder.setBoundaries(0, this->ActionPointer->page-1 , true);
    this->randerHeader();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);

    _display.setCursor(95, 0);
    _display.print("(" + String(slidePage + 1) + "/" + String(this->ActionPointer->page) + ")");
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

void OLED::randerApStatus(int slidePage)
{   
    //encoder.setBoundaries(0, this->ActionPointer->page-1 , true);
    this->randerHeader();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    _display.setCursor(95, 0);
    _display.print("(" + String(slidePage + 1) + "/" + String(this->ActionPointer->page) + ")");
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

void OLED::randerMQTTStatus(int slidePage)
{    
    //encoder.setBoundaries(0, this->ActionPointer->page-1 , true);
    this->randerHeader();
    _display.setTextSize(1);
    _display.setTextColor(WHITE);
    
    _display.setCursor(95, 0);
    _display.print("(" + String(slidePage + 1) + "/" + String(this->ActionPointer->page) + ")");

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
        _display.println("topicStatus (Pub):");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_pub_status.substring(0, 20));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_pub_status.substring(20));
        break;
    case 2:
        _display.setCursor(2,23);
        _display.println("topicRfid (Pub) : ");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_pub_rfid.substring(0, 20));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_pub_rfid.substring(20));
        break;
    case 3:
        _display.setCursor(2,23);
        _display.println("topicList (Private):");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_sub_private.substring(0, 20));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_sub_private.substring(20));
        break;
    case 4:
        _display.setCursor(2,23);
        _display.println("topic CMD (Broadcast):");
        _display.setCursor(2,38);
        _display.println(mqtt_info.topic_sub_broadcats.substring(0, 20));
        _display.setCursor(2,53);
        _display.println(mqtt_info.topic_sub_broadcats.substring(20));
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

// void OLED::randerReset(int select)
// {
//     //encoder.setBoundaries(0, this->ActionPointer->Choice-1 , true);
//     this->NextAndPrev (select);
//     this->randerHeader();
//     _display.setTextSize(1);
//     _display.setTextColor(WHITE);

//     _display.setCursor(95, 0);
//     _display.print("(1/1)");
//     switch (select)
//     {
//     case 0:
//         _display.setCursor(5,23);
//         _display.println("=> Reset WiFi");
//         _display.setCursor(5,38);
//         _display.println("Reset API");
//         _display.setCursor(5,53);
//         _display.println("Reset All");
//         Choice_Reset_FromOLED = select + 1;
//         break;
//     case 1:
//         _display.setCursor(5,23);
//         _display.println("Reset WiFi");
//         _display.setCursor(5,38);
//         _display.println("=> Reset API");
//         _display.setCursor(5,53);
//         _display.println("Reset All");
//         Choice_Reset_FromOLED = select + 1;
//         break;  
//     case 2:
//         _display.setCursor(5,23);
//         _display.println("Reset WiFi");
//         _display.setCursor(5,38);
//         _display.println("Reset API");
//         _display.setCursor(5,53);
//         _display.println("=> Reset All");
//         Choice_Reset_FromOLED = select + 1;
//         break;
//     default:
//         Serial.println("❌ No action");
//         break;
//     }
//     _display.display();
// }

// void OLED::randerResetPopUp(int select)
// {
//     _display.fillRect(10, 10, 108, 44, BLACK);
//     _display.drawRect(10, 10, 108, 44, WHITE);
    
//     _display.setTextSize(1);
//     _display.setTextColor(WHITE);

//     _display.setCursor((128 - (13 * 6)) / 2, 18);
//     _display.println("Are you sure?");
//     int y_pos = 38; 
    
//     switch (select)
//     {
//     case 0:
//         _display.setCursor(20, y_pos);
//         _display.println("=> Yes");
        
//         _display.setCursor(85, y_pos);
//         _display.println("   No");
//         conFrimReset = 1;
//         break;   
//     case 1:
//     default:
//         _display.setCursor(20, y_pos);
//         _display.println("   Yes");
        
//         _display.setCursor(85, y_pos);
//         _display.println("=> No");
//         conFrimReset = 2;
//         break;
//     }
//     _display.display();
// }

// void OLED::MenuActionReset() {
//     switch (Choice_Reset_FromOLED)
//     {
//     case 1:
//         Serial.println("Reset WiFi");
//         Helper::claer_ALL_EEprom("wifi-creds");
//         break;
//     case 2:
//         Serial.println("Reset API");
//         Helper::claer_ALL_EEprom("key_api-creds");
//         break;
//     case 3:
//         Serial.println("Reset All");
//         Helper::claer_ALL_EEprom("wifi-creds");
//         Helper::claer_ALL_EEprom("key_api-creds");
//         break;
//     default:
//         Serial.println("Cancel Reset");
//         Choice_Reset_FromOLED = 0;
//         this->moveUp();
//         break;
//     }
// }
