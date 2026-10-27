# IIoT RFID & Camera Server - System Documentation Hub

เอกสารระบบศูนย์กลางสำหรับ Backend Server, ระบบ MQTT Broker, ฮาร์ดแวร์ IoT (ESP32 RFID & Camera) และ Web Frontend Dashboard

---

## 📚 สารบัญเอกสารแยกตามหมวดหมู่ (Documentation Index)

เอกสารทั้งหมดถูกจัดเก็บอยู่ในโฟลเดอร์ [`docs/`](./docs/):

| เอกสาร | รายละเอียด | ลิงก์เข้าสู่เอกสาร |
|---|---|---|
| 🟢 **API Endpoints (GET)** | สเปก API ดึงข้อมูลทั้งหมด (`/get/group`, `/get/device`, `/get/mqtt`, `/get/tag`, `/get/log`, `/get/dashboard`) พร้อมวิธีการดึงรูปภาพ Static Assets ไปแสดงผลที่ Dashboard | 🔗 [docs/API_GET.md](./docs/API_GET.md) |
| 🔵 **API Endpoints (POST)** | สเปก API บันทึก/ส่งข้อมูลทั้งหมด (`/signin`, `/login`, `/logout`, `/post/group`, `/post/device`, `/post/req_connect`, `/post/mqtt`, `/post/upload_img`) | 🔗 [docs/API_POST.md](./docs/API_POST.md) |
| 🟠 **API Endpoints (PATCH)** | สเปก API อัปเดตข้อมูลและ Soft Delete ทั้งหมด (`/patch/account`, `/patch/group`, `/patch/device`, `/patch/mqtt`, `/patch/tag`) | 🔗 [docs/API_PATCH.md](./docs/API_PATCH.md) |
| 📡 **MQTT Protocol Spec** | มาตรฐานการสื่อสารผ่าน MQTT, Topic Hierarchy (`status`, `rfid`, `CAM`, `CMD`), โครงสร้าง Payload, LWT และ QoS | 🔗 [docs/MQTT_PROTOCOL.md](./docs/MQTT_PROTOCOL.md) |
| 🔌 **Hardware Integration Guide** | วงจรชีวิตของฮาร์ดแวร์ (Lifecycle), Flow Handshake, ลูปการทำงาน, การต่อสาย Pinout และข้อกำหนดสำหรับเปลี่ยนกล้องรุ่นอื่นในอนาคต | 🔗 [docs/HARDWARE_INTEGRATION.md](./docs/HARDWARE_INTEGRATION.md) |
| 🗄️ **Database Schema & ERD** | Data Dictionary ละเอียดทั้ง 8 ตาราง, ชนิดข้อมูล, ค่า Default, Foreign Keys และ Mermaid Entity-Relationship Diagram | 🔗 [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) |

---

## ⚡ สรุปรูปแบบการยืนยันตัวตน (Authentication Overview)

1. **User JWT Token**: ใช้สำหรับฝั่ง Web Dashboard ในการเรียกใช้งาน API Protected Routes (GET / POST / PATCH)
   - Header: `Authorization: Bearer <JWT_TOKEN>`
   - ได้รับจากการยิง `POST /iiot/login` หรือ `POST /iiot/signin`
2. **Device API Key**: ใช้สำหรับฮาร์ดแวร์ IoT (ESP32 RFID / ESP32-S3 Cam)
   - Header: `Authorization: <key_api>`
   - ได้รับครั้งแรกเมื่อแอดมินสร้างอุปกรณ์ผ่าน `POST /iiot/post/device`
3. **Public Static Files**: เข้าถึงได้โดยตรงผ่าน Web Browser หรือแท็ก `<img>`
   - URL: `http://<SERVER_HOST>:<PORT>/uploads/<FILENAME>`

---

## 🛠️ รายการ Endpoint ทั้งหมดโดยสรุป

### 🟢 เมธอด GET
- `GET /iiot/get/dashboard` — สรุปสถิติระบบและ 10 สแกนล่าสุด
- `GET /iiot/get/log` — ประวัติการสแกนบัตร RFID พร้อม `image_path`
- `GET /iiot/get/device` — รายชื่ออุปกรณ์ RFID / CAM
- `GET /iiot/get/ip_cam` — รายชื่อกล้อง IP Camera ประจำกลุ่ม
- `GET /iiot/get/group` — รายชื่อกลุ่มอุปกรณ์
- `GET /iiot/get/mqtt` — รายชื่อการตั้งค่า MQTT ประจำกลุ่ม
- `GET /iiot/get/tag` — รายการแท็ก RFID ในระบบ
- `GET /uploads/:filename` — ดึงไฟล์ภาพถ่ายหลักฐานจาก Server

### 🔵 เมธอด POST
- `POST /iiot/signin` — ลงทะเบียนผู้ใช้งานใหม่ผ่าน API มหาวิทยาลัย
- `POST /iiot/login` — เข้าสู่ระบบ
- `POST /iiot/logout` — ออกจากระบบและทำลาย Session ใน Redis
- `POST /iiot/post/group` — สร้างกลุ่มอุปกรณ์ใหม่
- `POST /iiot/post/device` — ลงทะเบียนอุปกรณ์ใหม่ (รับ `key_api`)
- `POST /iiot/post/req_connect` — อุปกรณ์ IoT ส่ง MAC + Key เพื่อ Handshake รับ Config MQTT
- `POST /iiot/post/mqtt` — บันทึกการตั้งค่า Broker/Topic ประจำกลุ่ม
- `POST /iiot/post/upload_img` — กล้อง ESP32-S3 อัปโหลดภาพหลักฐาน (Multipart Form-Data)
- `POST /iiot/post/ip_cam` — ลงทะเบียนกล้อง IP Camera (RTSP / ONVIF / Snapshot พร้อม Zod Validation)

### 🟠 เมธอด PATCH
- `PATCH /iiot/patch/account` — แก้ไขสิทธิ์ (Role), รหัสผ่าน, หรือระงับบัญชีผู้ใช้
- `PATCH /iiot/patch/group` — แก้ไขชื่อกลุ่มอุปกรณ์ หรือ Soft Delete / Restore
- `PATCH /iiot/patch/device` — แก้ไขข้อมูลอุปกรณ์ IoT (พร้อมเตือน MQTT disconnect)
- `PATCH /iiot/patch/ip_cam` — แก้ไขข้อมูลกล้อง IP Camera หรือ Soft Delete / Restore (พร้อม Zod Validation)
- `PATCH /iiot/patch/mqtt` — แก้ไขการตั้งค่า MQTT Broker/Topic ประจำกลุ่ม (Broadcast disconnect)
- `PATCH /iiot/patch/tag` — ผูกป้ายชื่อบัตรแท็ก, เปลี่ยนสถานะ (`active`, `pending`, `stolen`) หรือลบแท็ก

> 💡 **หมายเหตุสำคัญเรื่อง MAC Address:** ทุก Endpoint ที่รับหรือส่ง MAC Address จะอยู่ในรูปแบบตัวพิมพ์ใหญ่และ **ไม่มีเครื่องหมาย `:`** เช่น `246F28ABCDEF`
