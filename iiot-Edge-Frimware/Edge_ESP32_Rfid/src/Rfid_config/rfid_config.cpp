#include "rfid_config.h"
#include <math.h>

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
        while (Serial2.available() > 0){
            lastByteTime = millis();
            uint8_t rfid_value = Serial2.read();

            if(frameBuffer.empty() && rfid_value != 0x52){
                continue; // ข้ามไบต์ขยะไปหา 0x52 ('R') ทันที ไม่ต้องรอรอบ loop ถัดไป
            }
            frameBuffer.push_back(rfid_value);

            // เช็กไบต์ที่ 2 ต้องเป็น 0x46 ('F') เท่านั้น ป้องกันเฟรมค้างตอนสัญญาณอ่อน
            if(frameBuffer.size() == 2 && frameBuffer[1] != 0x46){
                frameBuffer.clear();
                if(rfid_value == 0x52) frameBuffer.push_back(0x52);
                continue;
            }
            
            if(frameBuffer.size() >= 8){ 
                int Data_length = (frameBuffer[6] << 8 | frameBuffer[7]) + 9;
                if (Data_length > 64 || Data_length < 10) {
                    frameBuffer.clear();
                    continue;
                }

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

float Rfid::get_distance(int rssiRaw)
{
    if (rssiRaw <= 0) {
        return 0.0f;
    }

    // 1. กรองสัญญาณแบบ Peak-Hold (เกาะค่าสัญญาณแรงสุด + กันสัญญาณดรอปวูบจากมือบัง/คลื่นสะท้อน)
    static String lastTag = "";
    static float filteredRssi = 0.0f;
    static float stableDistance = 0.0f;
    static unsigned long lastReadMs = 0;

    unsigned long now = millis();
    // ถ้าเปลี่ยนบัตร หรือเว้นช่วงอ่านเกิน 3 วินาที ให้เริ่มจับค่าใหม่
    if (rfid_data.tag != lastTag || filteredRssi == 0.0f || (now - lastReadMs > 3000)) {
        filteredRssi = (float)rssiRaw;
        lastTag = rfid_data.tag;
        stableDistance = 0.0f;
    } else {
        if ((float)rssiRaw >= filteredRssi) {
            // ถ้าสัญญาณแรงขึ้น (ค่าจริงไม่โดนคลื่นหักล้าง) ให้ปรับตามทันที 60%
            filteredRssi = (0.40f * filteredRssi) + (0.60f * (float)rssiRaw);
        } else {
            // ถ้าสัญญาณดรอปวูบ (เช่น จาก 179 ตกไป 147 เพราะมือบัง/คลื่นสะท้อน) ให้จำกัดการตกครั้งละไม่เกิน 6 หน่วย และถ่วงน้ำหนักช้าๆ 15%
            float clampedRaw = ((float)rssiRaw < filteredRssi - 6.0f) ? (filteredRssi - 6.0f) : (float)rssiRaw;
            filteredRssi = (0.85f * filteredRssi) + (0.15f * clampedRaw);
        }
    }
    lastReadMs = now;

    // 2. สมการ Log-Distance Path Loss ปรับตามช่วงค่าจริงที่บัตรตื่น (158 ถึง 200 -> 5.0m ถึง 0.5m)
    // เพราะต่ำกว่า ~155 บัตร Passive Tag จะไม่ได้รับพลังงานพอที่จะตื่น (สแกนไม่ติด)
    const float RSSI_AT_1M   = 188.0f; // ค่า RSSI Raw อ้างอิงที่ระยะ 1.0 เมตร
    const float SCALE_FACTOR = 42.0f;  // 200->0.5m, 188->1.0m, 180->1.6m, 174->2.2m, 167->3.2m, 158->5.0m

    float distance_m = powf(10.0f, (RSSI_AT_1M - filteredRssi) / SCALE_FACTOR);

    // 3. จำกัดขอบเขตตามสเปกเครื่องอ่าน (0.20 เมตร ถึงสูงสุด 5.00 เมตร)
    if (distance_m < 0.20f) distance_m = 0.20f;
    if (distance_m > 5.00f) distance_m = 5.00f;

    // 4. ปัดเศษทศนิยม 1 ตำแหน่ง และมี Deadband 0.25m กันตัวเลขสวิงตอนถือบัตรอยู่ที่เดิม
    distance_m = roundf(distance_m * 10.0f) / 10.0f;
    if (fabsf(distance_m - stableDistance) >= 0.25f || stableDistance == 0.0f) {
        stableDistance = distance_m;
    }

    Serial.printf("📶 RSSI Raw: %d (Filtered: %.1f) -> 📏 Distance: %.2f m\n",
                  rssiRaw, filteredRssi, stableDistance);
    return stableDistance;
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