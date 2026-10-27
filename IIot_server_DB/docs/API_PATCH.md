# IIoT RFID & Camera Server - API Documentation (PATCH Endpoints)

เอกสารข้อมูลสเปกการเชื่อมต่อ Web API (เฉพาะเมธอด **PATCH**) สำหรับการอัปเดตข้อมูล (Update) และการลบแบบซอฟต์ดีลีต (Soft Delete / Restore) ของระบบ Backend Server

> 📄 **เอกสารที่เกี่ยวข้อง:**
> - [docs/API_POST.md](./API_POST.md) - เอกสาร API เมธอด POST
> - [docs/API_GET.md](./API_GET.md) - เอกสาร API เมธอด GET & Assets
> - [docs/DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - โครงสร้างตารางและ ER Diagram

---

## 📌 สรุปรูปแบบการยืนยันตัวตน (Authentication)

ทุก Endpoint ในหมวด PATCH ต้องระบุ JWT Token ของผู้ใช้ผ่าน HTTP Header:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📋 รายการ PATCH API ทั้งหมด

| Endpoint | หน้าที่ | Body สำคัญ | ฟังก์ชันเพิ่มเติม / Side Effects |
|---|---|---|---|
| `PATCH /iiot/patch/account` | แก้ไขรหัสผ่าน, สิทธิ์ (Role) หรือลบบัญชีผู้ใช้ | `role`, `password`, `is_delete` | หาก `is_delete: true` จะเตะ Session ใน Redis ออกทันที |
| `PATCH /iiot/patch/group` | แก้ไขชื่อกลุ่มอุปกรณ์ หรือระงับกลุ่ม | `group_id`, `group_name`, `is_delete` | รองรับ Soft Delete/Restore |
| `PATCH /iiot/patch/device` | แก้ไขข้อมูลอุปกรณ์ (ชื่อ, IP, สถานที่ติดตั้ง) | `device_id`, `device_name`, `local`, ... | ยิงคำสั่ง MQTT `CMD: "disconnect"` บังคับให้อุปกรณ์ต่อใหม่ |
| `PATCH /iiot/patch/mqtt` | แก้ไข Topic, Username, Password ของ MQTT | `mqtt_id`, `topic`, `user_mqtt`, `pass_mqtt` | Broadcast MQTT `CMD: "disconnect"` ไปยังอุปกรณ์ในกลุ่ม |
| `PATCH /iiot/patch/tag` | ผูกชื่อแท็ก (Label), เปลี่ยนสถานะบัตร, ลบแท็ก | `epc_id`, `tag`, `status`, `is_delete` | อัปเดตสถานะ เช่น `'pending'` $\rightarrow$ `'active'` |

---

## 1. Update Account (แก้ไขข้อมูลบัญชีผู้ใช้)
ใช้สำหรับเปลี่ยนสิทธิ์ (Role), เปลี่ยนรหัสผ่าน หรือระงับบัญชี (Soft Delete) โดย User ID จะถูกดึงจาก JWT Token อัตโนมัติ

- **Endpoint**: `PATCH /iiot/patch/account`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Rate Limit**: `reqLimitUpdateAcc` (5 req / 15 min)
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `role` | string | ❌ | สิทธิ์ใหม่: `'student'`, `'teacher'`, `'admin'`, `'dev'` |
  | `password` | string | ❌ | รหัสผ่านใหม่ |
  | `is_delete` | boolean | ❌ | `true` เพื่อระงับบัญชี (ลบ session ทันที), `false` เพื่อคืนสถานะ |

  *ตัวอย่าง Body:*
  ```json
  {
    "role": "teacher"
  }
  ```

- **Response (200 OK)**:
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
      "last_login_at": "2026-10-18T19:31:33.000Z",
      "is_delete": false,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
  }
  ```

---

## 2. Update Group (แก้ไขกลุ่มอุปกรณ์)
เปลี่ยนชื่อกลุ่มอุปกรณ์ หรือสั่ง Soft Delete / Restore กลุ่มอุปกรณ์

- **Endpoint**: `PATCH /iiot/patch/group`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `group_id` | integer | ✅ | ID กลุ่มอุปกรณ์ที่ต้องการแก้ไข |
  | `group_name` | string | ❌ | ชื่อกลุ่มใหม่ เช่น `"ROOM_TEST_101_UPDATED"` |
  | `is_delete` | boolean | ❌ | `true` เพื่อลบกลุ่ม, `false` เพื่อกู้คืนกลุ่ม |

  *ตัวอย่าง Body:*
  ```json
  {
    "group_id": 7,
    "group_name": "ROOM_TEST_101_UPDATED"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": {
      "group_id": 7,
      "group_name": "ROOM_TEST_101_UPDATED",
      "by_user_id": 3,
      "created_at": "2026-10-18T19:05:43.000Z",
      "is_delete": false
    }
  }
  ```

---

## 3. Update Device (แก้ไขข้อมูลอุปกรณ์ IoT)
อัปเดตข้อมูลอุปกรณ์ เช่น เปลี่ยนชื่ออุปกรณ์, เปลี่ยนกลุ่ม, เปลี่ยนตำแหน่งติดตั้ง หรือสั่ง Soft Delete
*(เมื่อแก้ไขสำเร็จ ระบบจะส่งคำสั่ง MQTT `CMD: "disconnect"` ไปยังอุปกรณ์เป้าหมายอัตโนมัติ เพื่อให้อุปกรณ์รับรู้การเปลี่ยนแปลง)*

- **Endpoint**: `PATCH /iiot/patch/device`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `device_id` | integer | ✅ | ID ของอุปกรณ์ที่ต้องการแก้ไข |
  | `device_name` | string | ❌ | ชื่ออุปกรณ์ใหม่ |
  | `device_type` | string | ❌ | `'RFID'` หรือ `'CAM'` |
  | `group_id` | integer | ❌ | ย้ายกลุ่มอุปกรณ์ |
  | `local` | string | ❌ | ตำแหน่งติดตั้งใหม่ |
  | `ip` | string | ❌ | IP Address |
  | `subnet` | string | ❌ | Subnet Mask |
  | `gate_way` | string | ❌ | Gateway |
  | `key_api` | string | ❌ | รีเซ็ต Key API ประจำเครื่อง |
  | `is_delete` | boolean | ❌ | `true` เพื่อลบ, `false` เพื่อกู้คืน |

  *ตัวอย่าง Body:*
  ```json
  {
    "device_id": 8,
    "device_name": "RFID_Reader_1_Edited",
    "local": "Building 5 Room 901"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": {
      "device_id": 8,
      "device_name": "RFID_Reader_1_Edited",
      "device_type": "RFID",
      "group_id": 7,
      "by_user_id": 3,
      "mac": "246F28ABCDEF",
      "ip": "127.0.0.1",
      "subnet": "255.255.255.0",
      "gate_way": "127.0.0.1",
      "last_active_at": null,
      "local": "Building 5 Room 901",
      "created_at": "2026-10-18T19:05:58.000Z",
      "is_delete": false,
      "status": false,
      "key_api": "dev_3fe4b975c0779aab62674a004a50a561a68237ebc3a0759a58d2b8a015922a8e",
      "hw_uptime": 0,
      "mqtt_id": 7,
      "topic": "door_test_101",
      "user_mqtt": "test_user",
      "pass_mqtt": "test_pass"
    }
  }
  ```

---

## 4. Update MQTT (แก้ไขการตั้งค่า MQTT ประจำกลุ่ม)
แก้ไขชื่อ Topic หรือข้อมูลผู้ใช้ MQTT Broker ประจำกลุ่มอุปกรณ์
*(เมื่อแก้ไขสำเร็จ ระบบจะ Broadcast MQTT CMD `disconnect` ไปยังทุกอุปกรณ์ในกลุ่ม เพื่อให้อุปกรณ์ต่อใหม่ด้วยการตั้งค่าล่าสุด)*

- **Endpoint**: `PATCH /iiot/patch/mqtt`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `mqtt_id` | integer | ✅ | ID ของรายการ MQTT ที่ต้องการแก้ไข |
  | `topic` | string | ❌ | ชื่อ Topic ใหม่ |
  | `user_mqtt` | string | ❌ | Username ใหม่สำหรับ Broker |
  | `pass_mqtt` | string | ❌ | Password ใหม่สำหรับ Broker |
  | `group_id` | integer | ❌ | เปลี่ยนกลุ่มที่สังกัด |
  | `is_delete` | boolean | ❌ | `true` เพื่อลบ, `false` เพื่อกู้คืน |

  *ตัวอย่าง Body:*
  ```json
  {
    "mqtt_id": 7,
    "topic": "door_test_101_updated"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": {
      "mqtt_id": 7,
      "by_user_id": 3,
      "group_id": 7,
      "topic": "door_test_101_updated",
      "user_mqtt": "test_user",
      "pass_mqtt": "test_pass",
      "created_at": "2026-10-18T19:05:58.000Z",
      "is_delete": false
    }
  }
  ```

---

## 5. Update Map Tag (แก้ไขข้อมูลแท็ก RFID)
ใช้สำหรับกำหนดชื่อป้ายกำกับแท็ก (Assign Tag Label), เปลี่ยนสถานะบัตร หรือลบแท็ก

- **Endpoint**: `PATCH /iiot/patch/tag`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Request Body**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `epc_id` | integer | ✅ | ID ของแท็ก RFID ที่ต้องการแก้ไข |
  | `tag` | string | ❌ | ชื่อเรียกหรือป้ายกำกับ เช่น `"Gemini RFID Card"` |
  | `status` | string | ❌ | สถานะ: `'pending'`, `'active'`, `'stolen'` |
  | `is_delete` | boolean | ❌ | `true` เพื่อลบแท็ก, `false` เพื่อกู้คืนแท็ก |

  *ตัวอย่าง Body:*
  ```json
  {
    "epc_id": 85,
    "tag": "Gemini RFID Card",
    "status": "active"
  }
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": {
      "epc_id": 85,
      "epc": "E280116060000215467151CC",
      "tag": "Gemini RFID Card",
      "by_user_id": 3,
      "status": "active",
      "created_at": "2026-10-12T07:26:47.000Z",
      "is_delete": false
    }
  }
  ```


---

## 6. Update IP Camera (แก้ไขข้อมูล / Soft Delete กล้อง IP Camera)
ใช้สำหรับอัปเดตการตั้งค่ากล้อง IP Camera ประจำกลุ่มประตู (เช่น เปลี่ยนชื่อ, เปลี่ยน IP, อัปเดต URL สตรีม หรือระงับการใช้งานผ่าน `is_delete`) โดยมี Zod ตรวจสอบ `ip_cam_id` เสมอ และต้องมีอย่างน้อย 1 ฟิลด์ที่ต้องการแก้ไข

- **Endpoint**: `PATCH /iiot/patch/ip_cam`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <TOKEN>
  ```
- **Request Body (JSON)**:
  | Field | Type | Required | Description |
  |---|---|---|---|
  | `ip_cam_id` | number | ✅ | ID ของกล้อง IP Camera ที่ต้องการแก้ไข |
  | `cam_name` | string | ❌ | ชื่อเรียกกล้องใหม่ |
  | `group_id` | number | ❌ | ย้ายกลุ่มประตู |
  | `ip` | string | ❌ | IP Address ใหม่ |
  | `rtsp_url` | string | ❌ | URL สตรีมสดใหม่ |
  | `snapshot_url` | string | ❌ | URL ดึงภาพนิ่งใหม่ |
  | `ONVIF_url` | string | ❌ | URL ONVIF ใหม่ |
  | `status_url` | string | ❌ | URL ดึงสถานะใหม่ |
  | `cam_username` | string | ❌ | Username ใหม่ |
  | `cam_password` | string | ❌ | Password ใหม่ |
  | `local` | string | ❌ | สถานที่ติดตั้งใหม่ |
  | `status` | boolean | ❌ | สถานะ Online/Offline (`true`/`false`) |
  | `is_delete` | boolean | ❌ | Soft Delete (`true` = ลบกล้อง, `false` = กู้คืนกล้อง) |

  *ตัวอย่าง Body (อัปเดตสถานที่และชื่อกล้อง):*
  ```json
  {
    "ip_cam_id": 1,
    "cam_name": "C7816WIP_Updated_Name",
    "local": "Building 11 Floor 3 North Gate"
  }
  ```

- **Response**:
  - **`200 OK` (สำเร็จ)**:
    ```json
    {
      "success": true,
      "status": 200,
      "data": {
        "ip_cam_id": 1,
        "cam_name": "C7816WIP_Updated_Name",
        "mac": "00E04C123456",
        "group_id": 1,
        "by_user_id": 3,
        "ip": "192.168.1.150",
        "onvif_url": "http://192.168.1.150:80/onvif/device_service",
        "status_url": null,
        "rtsp_url": "rtsp://admin:888888@192.168.1.150:554/tcp/av0_0",
        "snapshot_url": "http://192.168.1.150/get_snapshot.cgi?user=admin&pwd=888888",
        "cam_username": "admin",
        "cam_password": "password888888",
        "local": "Building 11 Floor 3 North Gate",
        "status": false,
        "up_time": 0,
        "last_active_at": "2026-10-26T14:55:23.000Z",
        "created_at": "2026-10-26T14:55:23.000Z",
        "is_delete": false
      }
    }
    ```
  - **`400 Bad Request` (ลืมส่ง ip_cam_id หรือไม่มีฟิลด์ให้อัปเดต)**:
    ```json
    {
      "success": false,
      "status": 400,
      "error": "Validation Error",
      "details": [
        { "field": "ip_cam_id", "message": "กรุณาระบุ ip_cam_id เป็นตัวเลข" }
      ]
    }
    ```
