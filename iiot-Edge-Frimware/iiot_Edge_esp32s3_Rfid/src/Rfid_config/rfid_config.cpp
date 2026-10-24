#include "rfid_config.h"

// uint8_t mockData[] = {0x52, 0x46, 0x02, 0x00, 0x00, 0x80, 0x00, 0x13, 0x50, 0x11, 0x01, 0x0C, 0xE2, 0x80, 0x11, 0x60, 0x60, 0x00, 0x02, 0x15, 0x46, 0x71, 0x51, 0xCC, 0x05, 0x01, 0x87, 0xBA};
uint8_t mockData[] = {};
int mockIndex = 0;
unsigned long lastMockTime = 0;

// ฟังก์ชันจำลองพฤติกรรม Serial2.available()
int mockAvailable() {
    // หน่วงเวลาให้ข้อมูลทยอยเข้ามาทีละนิด เหมือนสาย Serial จริงๆ
    if (mockIndex < sizeof(mockData) && millis() - lastMockTime > 5) {
        return 1;
    }
    return 0;
}

// ฟังก์ชันจำลองพฤติกรรม Serial2.read()
uint8_t mockRead() {
    lastMockTime = millis();
    return mockData[mockIndex++];
}

bool Rfid::readRfid() {
        while (Serial2.available() > 0) {
            lastByteTime = millis();
            // uint8_t rfid_value = Serial2.read();
            uint8_t rfid_value = Serial2.read();

            if(frameBuffer.empty() && rfid_value != 0x52){
                frameBuffer.clear();
                return false;
            }
            frameBuffer.push_back(rfid_value);
            
            if(frameBuffer.size() >= 8){ 
                /*เลือน index 6 ไปทางซ้าย 8 บิต เพื่อเอา index 7 มา + เข้าข้างหลัง uint8_t = byte = 8 bit
                เช่น เก็บ 1 uint8_t(index 6) ที่มาจาก Serial ลง int (4 uint8_t) = 0*8(1byte) 0*8(1byte) 0*8(1byte) 0000 0001(1byte) 
                หลัง shift = 0*8(1byte) 0*8(1byte) 0000 0001(1byte) 0*8(1byte) ประมาณนี้ แล้วเอา index 7 = 1100 1010 ไปใส่ท้ายสุด 
                จะกลายเป็น = 0*8(1byte) 0*8(1byte) 0000 0001(1byte) 1100 1010(1byte) ก็จะได้ความยาวที่เอา 2 uint8_t มาต่อกัน*/
                int Data_length = (frameBuffer[6] << 8 | frameBuffer[7]) + 9;

                if (frameBuffer.size() == Data_length){
                    uint8_t check_sum = 0;

                    Serial.print("Data incoming: ");
                    for (uint8_t Inframe : frameBuffer) {
                        check_sum += Inframe;
                        Serial.print(Inframe, HEX);
                        Serial.print(" ");
                    }
                    Serial.println();
                    Serial.println("Check sum: " + String(check_sum, HEX));
                    if(check_sum != 0){
                        Serial.println("****Lost data (check sum error)****");
                        frameBuffer.clear();
                        return false;
                    }
                    return true;
                } 
            }
        };
    return false;
    }

void Rfid::chackType()
{
    Serial.println("🔍 Chack type");
    if(frameBuffer[2] == 0x02 && frameBuffer[5] == 0x80){
        Serial.println("✅ Have tag");
    }else if (frameBuffer[2] == 0x01){
        Serial.println("✅ Response : " + String(frameBuffer[5], HEX));
    }else{
        Serial.println("No Found");
    }
}

int Rfid::get_distance(int rssiRaw)
{
    if (rssiRaw >= 140) {
        return 1; // คลื่นแรงมาก = 1 เมตร
    } 
    else if (rssiRaw >= 120) {
        return 2; // คลื่นแรง = 2 เมตร
    } 
    else if (rssiRaw >= 90) {
        return 3; // คลื่นปานกลาง = 3 เมตร
    } 
    else if (rssiRaw >= 70) {
        return 4; // คลื่นอ่อน = 4 เมตร
    } 
    else {
        return 5; // คลื่นอ่อนมาก/ปลายระยะ = 5 เมตร
    }
}

void Rfid::parsedFrame() {
    Serial.println("✂️ Parsed Rfid");
    rfid_data.tag = "";
    String Rssi_distance = "";
    
    if (frameBuffer.size() > 8 && frameBuffer[2] == 0x02 && frameBuffer[5] == 0x80) {
        Serial.println("✅ Tag Found");
        
        int count = 8; // เริ่มที่ Index 8
        char hexBuffer[3]; // เอาไว้แก้ปัญหา String(HEX) เลขศูนย์หาย
        
        if (count < frameBuffer.size() && frameBuffer[count] == 0x50) {
            count += 2; 
        }
        
        while (count < frameBuffer.size() - 1) {
            uint8_t tag_type = frameBuffer[count];      // ไบต์บอกประเภท (0x01 = EPC, 0x05 = RSSI)
            uint8_t tag_len = frameBuffer[count + 1];   // ไบต์บอกความยาว
            count += 2; // ขยับ Index ไปที่ตัวข้อมูลจริงๆ
 
            if (tag_type == 0x01) { 
                for (int i = 0; i < tag_len; i++) {
                    sprintf(hexBuffer, "%02X", frameBuffer[count + i]);
                    rfid_data.tag += String(hexBuffer);
                }
            } 
            else if (tag_type == 0x05) { 
                for (int i = 0; i < tag_len; i++) {
                    sprintf(hexBuffer, "%02X", frameBuffer[count + i]);
                    Rssi_distance += String(hexBuffer);
                }
            }
            
            count += tag_len; 
        }
        rfid_data.distance = get_distance(strtol(Rssi_distance.c_str(), NULL, 16));
    }
}

    // static std::vector<uint8_t> frameBuffer;

    // while (Serial2.available() > 0) {
    //     uint8_t value = Serial2.read();
        
    //     if (frameBuffer.empty() && value != 0x52) continue; 
    //     frameBuffer.push_back(value);

    //     if (frameBuffer.size() == 28) {
            
    //         Serial.print("Data incoming: ");
    //         for (uint8_t b : frameBuffer) {
    //             if (b < 0x10) Serial.print("0");
    //             Serial.print(b, HEX);
    //             Serial.print(" ");
    //         }
    //         Serial.println();

    //         // 🎯 [แก้ไขจุดนี้] เช็กตำแหน่งที่ 2 และ 5 ให้ตรงตามข้อมูลจริง
    //         if (frameBuffer[2] == 0x02 && frameBuffer[5] == 0x80) {
                
    //             // แกะรหัส EPC 12 Bytes (24 ตัวอักษร) เริ่มจากตำแหน่ง uint8_t ที่ 12
    //             String currentEpc = "";
    //             for (int i = 12; i < 24; i++) {
    //                 if (frameBuffer[i] < 0x10) currentEpc += "0";
    //                 currentEpc += String(frameBuffer[i], HEX);
    //             }
    //             currentEpc.toUpperCase();

    //             if (currentEpc == "E28069950000401636C74999") {
    //                 Serial.println("➔ [พบสินค้า A] : สั่งเปิดไฟสีเขียว 🟢");
    //             } 
    //             else if (currentEpc == "E28069950000400C84B2D120") {
    //                 Serial.println("➔ [พบสินค้า B] : สั่งเปิดไฟสีแดง 🔴");
    //             } 
    //             else if (currentEpc == "E28069950000401636C76D99") { 
    //                 Serial.println("➔ [พบสินค้า C] : สั่งเปิดไฟสีเหลือง 🟡");
    //             }
    //             else {
    //                 Serial.printf("➔ พบแท็กใบอื่น ๆ รหัสคือ: %s\n", currentEpc.c_str());
    //             }
    //             testPub();
    //             sendDataToAPI(currentEpc);
    //         }
            
    //         frameBuffer.clear(); 
    //     }
    // }

    // static uint32_t lastByteTime = 0;
    // if (Serial2.available() > 0) lastByteTime = millis();
    // if (!frameBuffer.empty() && (millis() - lastByteTime > 50)) {
    //     frameBuffer.clear();
    // }