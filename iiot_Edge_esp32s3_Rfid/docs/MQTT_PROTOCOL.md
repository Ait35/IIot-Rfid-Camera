# MQTT Communication Protocol & Topic Specification

เอกสารกำหนดมาตรฐานโปรโตคอลการสื่อสารผ่าน **MQTT Broker** ระหว่าง **Backend Server**, **ESP32 RFID Reader** และ **ESP32-S3 Camera**

---

## 🌐 ข้อมูลการเชื่อมต่อ MQTT Broker

| พารามิเตอร์ | ค่ากำหนด (Development / Production) |
|---|---|
| **Broker URL** | `broker.emqx.io` (หรือตั้งค่าใน `.env`: `MQTT_BROKER_URL`) |
| **Port** | `1883` (TCP Plain) / `8883` (TLS) |
| **Client ID Format** | `ESP32Client-<randomHex>` (เช่น `ESP32Client-4a7b`) |
| **KeepAlive** | `30` วินาที |
| **Username / Password** | รับค่าจาก API Handshake (`POST /iiot/post/req_connect`) |
| **Data Format** | JSON String (`UTF-8`) |

---

## 🗺️ โครงสร้าง Topic Hierarchy

Topic ทั้งหมดในระบบจะถูกจัดกลุ่มตามลำดับชั้น (Hierarchy) ดังนี้:
```text
SPU/
├── status/group{group_id}/{topic}/{mac}          (ESP32 -> Backend: Heartbeat & Health)
├── rfid/group{group_id}/{topic}/{mac}            (ESP32 -> Backend: Scanned RFID Tag)
├── CAM/group{group_id}/{topic}/broadcast         (Backend -> Camera: Trigger Capture)
└── CMD/group{group_id}/{topic}/
    ├── {mac}                                     (Backend -> ESP32: Private Control CMD)
    └── broadcast                                 (Backend -> Group: Broadcast Control CMD)
```
- `{group_id}`: รหัสกลุ่มอุปกรณ์ เช่น `group7`
- `{topic}`: ชื่อ Topic ของกลุ่มที่กำหนดไว้ใน Database เช่น `door_test_101`
- `{mac}`: MAC Address ของอุปกรณ์ (ไม่มีเครื่องหมาย `:`) เช่น `246F28ABCDEF`

---

## 📋 ตารางสรุป Topics และทิศทางการรับ-ส่ง

| Topic | ทิศทาง | ผู้ส่ง (Publisher) | ผู้รับ (Subscriber) | หน้าที่ | QoS / Retain |
|---|---|---|---|---|---|
| `SPU/status/group{id}/{topic}/{mac}` | $\rightarrow$ Server | บอร์ด IoT (RFID / CAM) | Backend Server | ส่งสถานะเครื่อง / Health Monitor / LWT | QoS 0 / Retain: true |
| `SPU/rfid/group{id}/{topic}/{mac}` | $\rightarrow$ Server | ESP32 RFID | Backend Server | ส่งรหัสบัตร EPC เมื่อตรวจพบ | QoS 0 / Retain: false |
| `SPU/CAM/group{id}/{topic}/broadcast` | $\rightarrow$ Device | Backend Server | ESP32-S3 Camera | สั่งกล้องให้ถ่ายรูปหลักฐาน | QoS 0 / Retain: false |
| `SPU/CMD/group{id}/{topic}/{mac}` | $\rightarrow$ Device | Backend Server | บอร์ดเฉพาะเครื่อง (`{mac}`) | ส่งคำสั่งเฉพาะเครื่อง เช่น Reconnect | QoS 0 / Retain: false |
| `SPU/CMD/group{id}/{topic}/broadcast` | $\rightarrow$ Device | Backend Server | ทุกบอร์ดในกลุ่ม | สั่งการทุกบอร์ดในกลุ่มพร้อมกัน | QoS 0 / Retain: false |

---

## 📦 รายละเอียด Payloads แต่ละ Topic

### 1. Topic: `SPU/status/...` (รายงานสถานะและ Heartbeat)
ส่งทุกๆ 30 วินาที เพื่อรายงานว่าเครื่องยังออนไลน์ และส่งข้อมูลสุขภาพของระบบ

- **Publisher**: ESP32 RFID หรือ ESP32-S3 Camera
- **Subscriber**: Backend Server
- **Last Will & Testament (LWT)**: เมื่อบอร์ดขาดการเชื่อมต่ออย่างกะทันหัน Broker จะส่งข้อความนี้อัตโนมัติ:
  ```json
  {
    "status": false,
    "device_id": 8,
    "mac": "246F28ABCDEF"
  }
  ```
- **Heartbeat Payload ปกติ (ส่งทุก 30 วินาที)**:
  ```json
  {
    "device_id": 8,
    "mac": "246F28ABCDEF",
    "hw_uptime": 3600000,
    "free_heap": 184520,
    "rssi": -58,
    "status": true
  }
  ```
  | Field | Type | Description |
  |---|---|---|
  | `device_id` | integer | รหัสอุปกรณ์ในฐานข้อมูล |
  | `mac` | string | MAC Address ไร้ colon |
  | `hw_uptime` | integer | เวลาทำงานของฮาร์ดแวร์ตั้งแต่เปิดเครื่อง (มิลลิวินาทีจาก `millis()`) |
  | `free_heap` | integer | หน่วยความจำ RAM ว่างคงเหลือ (Bytes จาก `ESP.getFreeHeap()`) |
  | `rssi` | integer | ความแรงสัญญาณ WiFi (dBm จาก `WiFi.RSSI()`) |
  | `status` | boolean | `true` = Online, `false` = Offline |

---

### 2. Topic: `SPU/rfid/...` (ส่งข้อมูลสแกนบัตร RFID)
ส่งทันทีเมื่อเครื่องอ่าน RFID (เช่น UHF Reader ผ่าน Serial2) สแกนพบแท็ก

- **Publisher**: ESP32 RFID Reader
- **Subscriber**: Backend Server
- **Payload Example**:
  ```json
  {
    "device_id": 8,
    "group_id": 7,
    "epc": "E280116060000215467151CC",
    "distance": 2.5
  }
  ```
  | Field | Type | Description |
  |---|---|---|
  | `device_id` | integer | ID ของเครื่อง RFID ที่อ่านบัตร |
  | `group_id` | integer | ID กลุ่มอุปกรณ์ |
  | `epc` | string | รหัสประจำตัวบัตร RFID (Electronic Product Code) |
  | `distance` | number | ระยะห่าง หรือค่าคำนวณสัญญาณ RSSI (เมตร/หน่วย) |

> 🔄 **Backend Processing Flow:**
> เมื่อ Backend ได้รับข้อมูลนี้ จะทำการบันทึกลงฐานข้อมูล `log_rfid` และส่ง MQTT ไปยัง `SPU/CAM/...` ทันที

---

### 3. Topic: `SPU/CAM/...` (คำสั่งสั่งกล้องถ่ายรูป)
Backend ส่งคำสั่งไปยังกล้องในกลุ่มเดียวกันทันทีหลังจากที่บันทึก Log RFID สำเร็จ

- **Publisher**: Backend Server
- **Subscriber**: ESP32-S3 Camera
- **Topic Pattern**: `SPU/CAM/group{group_id}/{topic}/broadcast`
- **Payload Example**:
  ```json
  {
    "log_id": 105,
    "cap": "1"
  }
  ```
  | Field | Type | Description |
  |---|---|---|
  | `log_id` | integer | รหัส Log RFID ที่เพิ่งถูกบันทึกลงฐานข้อมูล |
  | `cap` | string / int | `"1"` หรือ `1` คำสั่งสั่งให้กล้องจับภาพ (Capture) |

> 📷 **Camera Action:**
> เมื่อกล้องได้รับข้อความนี้ จะทำการถ่ายภาพ `Camera::capture()` $\rightarrow$ นำเข้าคิว FreeRTOS $\rightarrow$ ยิง HTTP POST Multipart ไปที่ `/iiot/post/upload_img` โดยแนบ `log_id` ไปด้วย

---

### 4. Topic: `SPU/CMD/...` (คำสั่งควบคุมบอร์ดจากระยะไกล)
Backend ส่งคำสั่งควบคุมไปยังอุปกรณ์ เช่น เมื่อแอดมินแก้ไขการตั้งค่าในเว็บ

- **Publisher**: Backend Server
- **Subscriber**: ESP32 RFID / ESP32-S3 Camera
- **Topic Options**:
  - เฉพาะเจาะจงเครื่อง: `SPU/CMD/group{group_id}/{topic}/{mac}`
  - ทั้งกลุ่ม: `SPU/CMD/group{group_id}/{topic}/broadcast`
- **Payload Example**:
  ```json
  {
    "CMD": "disconnect"
  }
  ```
- **คำสั่งที่รองรับ (Commands)**:
  - `"disconnect"`: สั่งให้บอร์ดตัดการเชื่อมต่อ MQTT และรีบูตบอร์ด (`ESP.restart()`) เพื่อดึงการตั้งค่าใหม่จาก Backend
