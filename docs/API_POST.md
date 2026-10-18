# IIoT RFID & Camera Server - API Documentation (POST Endpoints)

เอกสารข้อมูลสเปกการเชื่อมต่อ Web API (เฉพาะเมธอด **POST**) ของระบบ Backend Server สำหรับเชื่อมต่อกับ Web Frontend, ESP32 RFID และ ESP32-S3 Camera

> 📄 **เอกสารอ้างอิงฐานข้อมูล:** ดูโครงสร้างตารางและ ER Diagram ได้ที่ [docs/DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

## 📌 สรุปรูปแบบการยืนยันตัวตน (Authentication)

ระบบรองรับการยืนยันตัวตน 2 รูปแบบผ่าน HTTP Header `Authorization`:
1. **User Token (JWT)**: สำหรับ User / Frontend Web Dashboard
   - Header: `Authorization: Bearer <JWT_TOKEN>`
2. **Device API Key**: สำหรับฮาร์ดแวร์ IoT (ESP32 RFID / ESP32-S3 Cam)
   - Header: `Authorization: <key_api>` หรือ `Authorization: Bearer <key_api>`

> ⚠️ **รูปแบบ MAC Address**: ค่า MAC Address ที่ส่งเข้าและออกจากระบบ **จะต้องไม่มีเครื่องหมาย `:` (Colons)** เช่น `246F28ABCDEF` (ความยาว 12 ตัวอักษร)

---

## 📋 รายการ POST API ทั้งหมด

| Endpoint | หน้าที่ | รูปแบบ Auth | Content-Type | Rate Limit |
|---|---|---|---|---|
| `POST /iiot/signin` | สมัคร/ลงทะเบียนผู้ใช้ใหม่ผ่าน API มหาวิทยาลัย | ไม่ต้องมี | `application/json` | 10 req / 5 min |
| `POST /iiot/login` | เข้าสู่ระบบ และรับ Token | ไม่ต้องมี | `application/json` | 10 req / 5 min |
| `POST /iiot/logout` | ออกจากระบบ และทำลาย Session ใน Redis | JWT Token | ไม่มี Body | ค่าเริ่มต้น |
| `POST /iiot/post/group` | สร้างกลุ่มอุปกรณ์ (Device Group) | JWT Token | `application/json` | Global Limit |
| `POST /iiot/post/device` | ลงทะเบียนอุปกรณ์ใหม่ (RFID / CAM) | JWT Token | `application/json` | Global Limit |
| `POST /iiot/post/req_connect` | อุปกรณ์ร้องขอเชื่อมต่อระบบ (Handshake รับ config MQTT) | Device Key | `application/json` | 30 req / 1 min |
| `POST /iiot/post/mqtt` | เพิ่มการตั้งค่า MQTT Broker/Topic สำหรับกลุ่ม | JWT Token | `application/json` | Global Limit |
| `POST /iiot/post/upload_img` | อัปโหลดภาพหลักฐานจากกล้อง ESP32-S3 | Device Key | `multipart/form-data` | 20 req / 1 min |

---

## 1. User Sign In (ลงทะเบียนผู้ใช้งาน)
ดึงข้อมูลยืนยันจากระบบมหาวิทยาลัยเพื่อสร้างบัญชีผู้ใช้งานใหม่ลง Database

- **Endpoint**: `POST /iiot/signin`
- **Authentication**: ไม่มี (Public)
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "university_id": "67199999",
    "password": "password123"
  }
  ```
- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "user_id": 3,
        "university_id": "67199999",
        "first_name": "Gemini",
        "last_name": "Flash3.8",
        "role": "teacher",
        "created_at": "2026-10-18T19:05:34.000Z",
        "last_login_at": "2026-10-18T19:05:34.000Z",
        "is_delete": false,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
    ```
  - **`400 Bad Request` (ข้อมูลไม่ครบถ้วน หรือไม่พบรหัสในระบบส่วนกลาง ม.)**:
    ```json
    { "error": "Missing university id or password" }
    ```
    หรือ
    ```json
    { "success": false, "status": 400, "error": "Invalid university id: 67199999" }
    ```

---

## 2. User Login (เข้าสู่ระบบ)
ตรวจสอบข้อมูลบัญชี และสร้าง/รีเฟรช Token สำหรับนำไปใช้งานต่อ

- **Endpoint**: `POST /iiot/login`
- **Authentication**: ไม่มี (Public)
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "university_id": "67199999",
    "password": "password123"
  }
  ```
- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - **`400 Bad Request` (รหัสผ่านไม่ถูกต้อง หรือส่งข้อมูลไม่ครบ)**:
    ```json
    { "success": false, "status": 400, "error": "Invalid password" }
    ```
  - **`404 Not Found` (ไม่พบบัญชีผู้ใช้ในระบบ)**:
    ```json
    { "success": false, "status": 404, "error": "not find user" }
    ```

---

## 3. User Logout (ออกจากระบบ)
ลบ Token Session ออกจาก Redis เพื่อตัดการเชื่อมต่อทันที

- **Endpoint**: `POST /iiot/logout`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Request Body**: *ไม่มี (ไม่ต้องส่ง Body)*
- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "message": "Logged out successfully"
    }
    ```
  - **`401 Unauthorized` (Token ไม่ถูกต้อง หรือหมดอายุแล้ว)**:
    ```json
    { "message": "Unauthorized: ไม่พบ Token" }
    ```

---

## 4. Create Group (สร้างกลุ่มอุปกรณ์)
สร้างกลุ่มสำหรับจัดระเบียบอุปกรณ์ IoT (เช่น ประตู 1, ห้อง 101)

- **Endpoint**: `POST /iiot/post/group`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "group_name": "ROOM_TEST_101"
  }
  ```
- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "group_id": 7,
        "group_name": "ROOM_TEST_101",
        "by_user_id": 3,
        "created_at": "2026-10-18T19:05:43.000Z",
        "is_delete": false
      }
    }
    ```
  - **`400 Bad Request` (ไม่ได้ระบุชื่อกลุ่ม)**:
    ```json
    { "error": "Missing data" }
    ```

---

## 5. Register Device (ลงทะเบียนอุปกรณ์ใหม่)
เพิ่มอุปกรณ์ RFID Reader หรือ กล้อง CAM พร้อมระบบจะสุ่มสร้าง `key_api` ประจำตัวอุปกรณ์ให้อัตโนมัติ

- **Endpoint**: `POST /iiot/post/device`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `device_name` | string | ✅ | ชื่ออุปกรณ์ เช่น `RFID_Reader_1` |
  | `mac` | string | ✅ | MAC Address **(ไม่มี colon เช่น `246F28ABCDEF`)** |
  | `type` | string | ✅ | ประเภทอุปกรณ์: `"RFID"` หรือ `"CAM"` |
  | `group_id` | number | ✅ | รหัสกลุ่มที่อุปกรณ์สังกัดอยู่ |
  | `local` | string | ✅ | สถานที่ติดตั้ง เช่น `Building 5 Floor 9` |

  ```json
  {
    "device_name": "RFID_Reader_1",
    "mac": "246F28ABCDEF",
    "type": "RFID",
    "group_id": 7,
    "local": "Building 5 Floor 9"
  }
  ```

- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "device_id": 8,
        "device_name": "RFID_Reader_1",
        "device_type": "RFID",
        "group_id": 7,
        "by_user_id": 3,
        "mac": "246F28ABCDEF",
        "ip": "127.0.0.1",
        "subnet": "255.255.255.0",
        "gate_way": "127.0.0.1",
        "last_active_at": null,
        "hw_uptime": 0,
        "local": "Building 5 Floor 9",
        "created_at": "2026-10-18T19:05:49.000Z",
        "is_delete": false,
        "status": false,
        "key_api": "dev_3fe4b975c0779aab62674a004a50a561a68237ebc3a0759a58d2b8a015922a8e"
      }
    }
    ```
  - **`400 Bad Request` (ข้อมูลไม่ครบ)**:
    ```json
    { "error": "Missing data" }
    ```

---

## 6. Device Request Connect (ฮาร์ดแวร์ IoT ขอเชื่อมต่อระบบ)
ฮาร์ดแวร์ (ESP32 RFID หรือ ESP32-S3) ส่ง MAC Address พร้อม API Key เพื่อตรวจสอบสิทธิ์ และรับ Topic กับบัญชี MQTT ประจำกลุ่มกลับไปใช้เชื่อมต่อ

- **Endpoint**: `POST /iiot/post/req_connect`
- **Authentication**: `<key_api>` (ของอุปกรณ์)
- **Headers**:
  ```http
  Authorization: dev_3fe4b975c0779aab62674a004a50a561a68237ebc3a0759a58d2b8a015922a8e
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "mac": "246F28ABCDEF"
  }
  ```
- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "mqtt_id": 7,
        "by_user_id": 3,
        "group_id": 7,
        "topic": "door_test_101",
        "user_mqtt": "test_user",
        "pass_mqtt": "test_pass",
        "created_at": "2026-10-18T19:05:58.000Z",
        "is_delete": false,
        "device_id": 8,
        "mac": "246F28ABCDEF"
      }
    }
    ```
  - **`401 Unauthorized` (API Key หรือ MAC ไม่ตรงกับระบบ)**:
    ```json
    { "message": "Unauthorized: Key Api not match to device" }
    ```

---

## 7. Create MQTT Configuration (ตั้งค่า MQTT ประจำกลุ่ม)
บันทึกข้อมูล Topic, Username และ Password สำหรับ Broker MQTT ของกลุ่มอุปกรณ์ (1 กลุ่ม มีได้ 1 การตั้งค่า)

- **Endpoint**: `POST /iiot/post/mqtt`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Headers**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `topic` | string | ✅ | ชื่อ Topic หลัก เช่น `door_test_101` |
  | `group_id` | number | ✅ | ID กลุ่มอุปกรณ์ |
  | `user_mqtt` | string | ❌ | ชื่อผู้ใช้ MQTT (Optional) |
  | `pass_mqtt` | string | ❌ | รหัสผ่าน MQTT (Optional) |

  ```json
  {
    "topic": "door_test_101",
    "group_id": 7,
    "user_mqtt": "test_user",
    "pass_mqtt": "test_pass"
  }
  ```

- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "mqtt_id": 7,
        "by_user_id": 3,
        "group_id": 7,
        "topic": "door_test_101",
        "user_mqtt": "test_user",
        "pass_mqtt": "test_pass",
        "created_at": "2026-10-18T19:05:58.000Z",
        "is_delete": false
      }
    }
    ```
  - **`400 Bad Request` (ข้อมูลไม่ครบ)**:
    ```json
    { "error": "Missing data" }
    ```

---

## 8. Upload Log Image (อัปโหลดรูปภาพหลักฐานจากกล้อง)
กล้อง ESP32-S3 Camera ถ่ายภาพแล้วส่งอัปโหลดเข้ามาผูกกับ `log_id` ของ RFID สแกนล่าสุด

- **Endpoint**: `POST /iiot/post/upload_img`
- **Authentication**: `<key_api>` (ของกล้อง CAM)
- **Headers**:
  ```http
  Authorization: dev_camera_api_key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  Content-Type: multipart/form-data
  ```
- **Request Body (`multipart/form-data`)**:
  | Part / Field | Type | Content |
  |---|---|---|
  | `Jsondata` | Text / String | JSON string ระบุ `{ "log_id": 105, "device_id": 2, "group_id": 7, "mac": "A0B1C2D3E4F5" }` |
  | `img` | Binary File | ไฟล์รูปภาพ (`.jpg`, `.jpeg`, `.png`) ขนาดไม่เกิน 5 MB |

  *ตัวอย่างค่าในฟิลด์ `Jsondata`:*
  ```json
  {
    "log_id": 105,
    "device_id": 2,
    "group_id": 7,
    "mac": "A0B1C2D3E4F5"
  }
  ```

- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "image_id": 42,
        "log_id": 105,
        "camera_device_id": 2,
        "image_path": "/uploads/img-1729272300000-123456789.jpg",
        "created_at": "2026-10-18T19:06:00.000Z"
      }
    }
    ```
  - **`400 Bad Request` (ไฟล์ไม่ถูกต้อง / ข้อมูลไม่ครบ / กลุ่มไม่ตรงกัน)**:
    ```json
    { "error": "ไม่พบไฟล์รูปภาพ" }
    ```
    หรือ
    ```json
    { "success": false, "status": 400, "error": "กล้องและเครื่อง RFID ไม่ได้อยู่ในกลุ่มเดียวกัน" }
    ```
  - **`401 Unauthorized` (API Key ของกล้องไม่ถูกต้อง)**:
    ```json
    { "message": "Unauthorized: Key Api not match to device" }
    ```
  - **`404 Not Found` (ไม่พบ Log RFID ที่อ้างถึง)**:
    ```json
    { "success": false, "status": 404, "error": "ไม่พบ log_rfid ที่ต้องการส่งรูปภาพ" }
    ```
