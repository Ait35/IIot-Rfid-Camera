# IIoT RFID & Camera Server - API Documentation (GET Endpoints & Assets)

เอกสารข้อมูลสเปกการเชื่อมต่อ Web API (เฉพาะเมธอด **GET**) และการดึงไฟล์ภาพ (Static Assets) ของระบบ Backend Server สำหรับเชื่อมต่อกับ Web Frontend Dashboard

> 📄 **เอกสารที่เกี่ยวข้อง:**
> - [docs/API_POST.md](./API_POST.md) - เอกสาร API เมธอด POST
> - [docs/DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - โครงสร้างตารางและ ER Diagram

---

## 📌 สรุปรูปแบบการยืนยันตัวตน (Authentication)

- **GET API Endpoints**: ต้องแนบ JWT Token ของผู้ใช้ผ่าน HTTP Header
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Static Assets (`/uploads/...`)**: เปิดเป็น **Public** สำหรับ Frontend โหลดไฟล์รูปภาพไปแสดงผลในแท็ก `<img>` ได้โดยตรง ไม่ต้องแนบ Header Authorization

---

## 📋 รายการ GET API ทั้งหมด

| Endpoint | หน้าที่ | รูปแบบ Auth | Query Parameters | อัตราจำกัด (Rate Limit) |
|---|---|---|---|---|
| `GET /iiot/get/users` | ดึงรายชื่อบัญชีผู้ใช้ทั้งหมด (ไม่ส่ง `password` และ `token`) | Bearer JWT | `page`, `limit`, `role`, `search`, `is_delete` | 100 req / 15 min |
| `GET /iiot/get/group` | ดึงรายชื่อกลุ่มอุปกรณ์ (พร้อมจำนวนอุปกรณ์ในกลุ่ม) | Bearer JWT | `page`, `limit`, `search`, `is_delete` | 100 req / 15 min |
| `GET /iiot/get/device` | ดึงรายการอุปกรณ์ (RFID / CAM) พร้อมกล้องในกลุ่ม | Bearer JWT | `page`, `limit`, `device_type`, `status`, `group_id`, `search`, `is_delete` | 100 req / 15 min |
| `GET /iiot/get/ip_cam` | ดึงรายการกล้อง IP Camera ประจำกลุ่ม | Bearer JWT | `page`, `limit`, `status`, `group_id`, `search`, `is_delete` | 100 req / 15 min |
| `GET /iiot/get/mqtt` | ดึงรายการการตั้งค่า MQTT ประจำกลุ่ม | Bearer JWT | `page`, `limit`, `group_id`, `search` | 100 req / 15 min |
| `GET /iiot/get/tag` | ดึงรายการแท็ก RFID ที่ลงทะเบียนในระบบ | Bearer JWT | `page`, `limit`, `status`, `search` | 100 req / 15 min |
| `GET /iiot/get/log` | ดึงประวัติการสแกนบัตร RFID พร้อมข้อมูลแท็กและอุปกรณ์ | Bearer JWT | `page`, `limit`, `device_id`, `search` | 100 req / 15 min |
| `GET /iiot/get/system-log` | ดึงประวัติการทำงานของระบบ (System / Activity Logs) | Bearer JWT | `page`, `limit`, `action_type`, `target_table`, `search`, `search_by`, `start_date`, `end_date` | 100 req / 15 min |
| `GET /iiot/get/dashboard` | ดึงข้อมูลสรุปสถิติและ 10 การสแกนล่าสุด | Bearer JWT | *ไม่มี* | 100 req / 15 min |
| `GET /iiot/events/stream` | เชื่อมต่อ Real-time Stream (SSE) สำหรับ Dashboard & Devices | Bearer JWT | *ไม่มี* | Rate Limit SSE |
| `GET /uploads/:filename` | ดึงไฟล์รูปภาพหลักฐานที่บันทึกจากกล้อง | Public | *ไม่มี* | ตามขีดจำกัด Express |

> 💡 **หมายเหตุ:**
> - `GET /iiot/get/me` ถูกปิดใช้งานชั่วคราว เนื่องจาก `POST /iiot/login` ส่งข้อมูลโปรไฟล์ผู้ใช้กลับมาให้พร้อม Token ตั้งแต่ตอนล็อกอินแล้ว
> - เมธอด `GET` ทั้งหมดไม่บันทึกลงตาราง `activity_log` เพื่อลดขนาดฐานข้อมูล

---

## 1. Get Groups (ดึงรายการกลุ่มอุปกรณ์)
ดึงรายชื่อกลุ่มอุปกรณ์ทั้งหมด พร้อมข้อมูลชื่อผู้สร้าง (`by_user_name`)

- **Endpoint**: `GET /iiot/get/group`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |
  | `search` | string | - | ค้นหาชื่อกลุ่ม, ชื่อผู้สร้าง หรือ `group_id` |
  | `is_delete` | boolean | `false` | `true` เพื่อดึงกลุ่มที่ถูก Soft Delete |

- **Request Example**:
  ```http
  GET /iiot/get/group?page=1&limit=10&is_delete=false HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": [
      {
        "group_id": 7,
        "group_name": "ROOM_TEST_101",
        "by_user_id": 3,
        "created_at": "2026-10-18T19:05:43.000Z",
        "is_delete": false,
        "first_name": "Gemini",
        "by_user_name": "Gemini",
        "device_count": 2,
        "ip_cam_count": 1
      }
    ]
  }
  ```

---

## 2. Get Devices (ดึงรายการอุปกรณ์)
ดึงรายชื่ออุปกรณ์ RFID และ Camera พร้อมชื่อกลุ่ม (`group_name`) และรายการกล้อง IP Camera ที่อยู่ในกลุ่มเดียวกัน (`ip_cameras`)

- **Endpoint**: `GET /iiot/get/device`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |
  | `device_type` | string | - | กรองประเภท (`RFID` หรือ `CAM`) |
  | `status` | string | - | กรองสถานะ (`true` / `false`) |
  | `group_id` | integer | - | กรองตาม Group ID |
  | `search` | string | - | ค้นหาชื่ออุปกรณ์, MAC, IP, สถานที่, ชื่อกลุ่ม หรือกล้องในกลุ่ม |
  | `is_delete` | boolean | `false` | `true` เพื่อดึงอุปกรณ์ที่ถูก Soft Delete |

- **Request Example**:
  ```http
  GET /iiot/get/device?page=1&limit=10&is_delete=false HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": [
      {
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
        "local": "Building 5 Floor 9",
        "created_at": "2026-10-18T19:05:49.000Z",
        "is_delete": false,
        "status": false,
        "key_api": "dev_3fe4b975c0779aab62674a004a50a561a68237ebc3a0759a58d2b8a015922a8e",
        "hw_uptime": 0,
        "by_user_name": "Gemini",
        "group_name": "ROOM_TEST_101",
        "ip_cameras": []
      }
    ]
  }
  ```

---

## 3. Get MQTT Configurations (ดึงรายการการตั้งค่า MQTT)
ดึงการตั้งค่า MQTT Broker, Topic และบัญชีเชื่อมต่อประจำแต่ละกลุ่ม พร้อม `group_name`

- **Endpoint**: `GET /iiot/get/mqtt`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |
  | `group_id` | integer | - | กรองตาม Group ID |
  | `search` | string | - | ค้นหา `topic`, `user_mqtt` หรือ `group_name` |

- **Request Example**:
  ```http
  GET /iiot/get/mqtt?page=1&limit=5 HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": [
      {
        "mqtt_id": 7,
        "by_user_id": 3,
        "group_id": 7,
        "topic": "door_test_101",
        "user_mqtt": "test_user",
        "pass_mqtt": "test_pass",
        "created_at": "2026-10-18T19:05:58.000Z",
        "is_delete": false,
        "by_user_name": "Gemini"
      }
    ]
  }
  ```

---

## 4. Get Tags (ดึงรายการแท็ก RFID)
ดึงรายการแท็ก EPC ทั้งหมด พร้อมสถานะ (`pending`, `active`, `stolen`)

- **Endpoint**: `GET /iiot/get/tag`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |
  | `status` | string | - | กรองตามสถานะ (`active`, `pending`, `stolen`) |
  | `search` | string | - | ค้นหา `epc`, ชื่อสิ่งของ (`tag`) หรือชื่อผู้ผูก |

- **Request Example**:
  ```http
  GET /iiot/get/tag?page=1&limit=5 HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": [
      {
        "epc_id": 85,
        "epc": "E280116060000215467151CC",
        "tag": "บัตรนักศึกษา",
        "by_user_id": 3,
        "status": "active",
        "created_at": "2026-10-12T07:26:47.000Z",
        "is_delete": false,
        "by_user_name": "Gemini"
      }
    ]
  }
  ```

---

## 5. Get Logs (ดึงประวัติการสแกนบัตร RFID พร้อมรูปภาพ)
ดึงประวัติการตรวจจับแท็ก RFID ล่าสุด โดยเชื่อมตาราง `log_images`, `map_tag` และ `device_info`

- **Endpoint**: `GET /iiot/get/log`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |
  | `device_id` | integer | - | กรองตาม ID ของเครื่องอ่าน |
  | `search` | string | - | ค้นหา `epc`, `tag`, ชื่ออุปกรณ์ หรือสถานที่ |

- **Request Example**:
  ```http
  GET /iiot/get/log?page=1&limit=10 HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": [
      {
        "log_id": 136,
        "device_id": 1,
        "epc_id": 85,
        "distance": 2.0,
        "time_stamp": "2026-10-17T08:29:45.000Z",
        "image_path": "/uploads/cam_1791997624480-529956532.jpg",
        "epc": "E280116060000215467151CC",
        "tag": "บัตรนักศึกษา",
        "tag_status": "active",
        "device_name": "RFID_Reader_1",
        "local": "Building 5 Floor 9"
      }
    ]
  }
  ```
  *(หมายเหตุ: หากไม่มีรูปภาพที่ผูกกับ Log นั้น ค่า `image_path` จะเป็น `null`)*

---

## 6. Get Dashboard Summary (ดึงข้อมูลสรุป Dashboard)
ดึงตัวเลขภาพรวม (Total Tags, Active Tags, Total Devices, Scans Today) และรายการสแกนบัตรล่าสุด 10 รายการ

- **Endpoint**: `GET /iiot/get/dashboard`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**: *ไม่มี*

- **Request Example**:
  ```http
  GET /iiot/get/dashboard HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
  ```

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "total_tags": "22",
        "active_tags": "5",
        "total_devices": "8",
        "scans_today": "14"
      },
      "recentScans": [
        {
          "log_id": 136,
          "epc": "E280116060000215467151CC",
          "equipment_name": null,
          "tag_status": "pending",
          "distance": 2,
          "time_stamp": "2026-10-17T08:29:45.000Z",
          "scanned_by_device": "RFID_Reader_1",
          "device_type": "RFID",
          "location": "Building 5 Floor 9",
          "latest_image": "/uploads/cam_1791997624480-529956532.jpg"
        }
      ]
    }
  }
  ```

---

## 7. Get IP Cameras (ดึงรายชื่อกล้อง IP Camera ประจำกลุ่ม)
ดึงรายการกล้อง IP Camera ทั้งหมดในระบบ (พร้อมข้อมูล RTSP, Snapshot, LAN IP และชื่อผู้ลงทะเบียน) แบบแบ่งหน้า (Pagination)

- **Endpoint**: GET /iiot/get/ip_cam
- **Authentication**: Bearer <JWT_TOKEN>
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการดึงข้อมูล |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |
  | `status` | string | - | กรองสถานะ (`true` / `false`) |
  | `group_id` | integer | - | กรองตาม Group ID |
  | `search` | string | - | ค้นหาชื่อกล้อง, IP, MAC, สถานที่ หรือชื่อกลุ่ม |
  | `is_delete` | boolean | `false` | `true` เพื่อดึงกล้องที่ถูก Soft Delete |

- **Request Example**:
  `http
  GET /iiot/get/ip_cam?page=1&limit=10 HTTP/1.1
  Authorization: Bearer <TOKEN>
  `

- **Response (200 OK)**:
  `json
  {
    "success": true,
    "status": 200,
    "data": [
      {
        "ip_cam_id": 1,
        "cam_name": "C7816WIP_Entrance_Gate1",
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
        "local": "Building 11 Front Gate",
        "status": false,
        "up_time": 0,
        "last_active_at": "2026-10-26T14:55:23.000Z",
        "created_at": "2026-10-26T14:55:23.000Z",
        "is_delete": false,
        "by_user_name": "Gemini"
      }
    ]
  }
  `

---

## 8. Get My Profile (ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน)
ดึงข้อมูลบัญชีของผู้ใช้ที่กำลังล็อกอินอยู่จาก JWT Token (ไม่คืนค่า `password` และ `token`)

- **Endpoint**: `GET /iiot/get/me`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**: *ไม่มี*
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
      "is_delete": false
    }
  }
  ```

---

## 9. การดึงไฟล์รูปภาพจาก Server ไปแสดงผลที่ Dashboard

### 🖼️ Endpoint ให้บริการรูปภาพ (Static Asset Serving)
Backend ให้บริการไฟล์รูปภาพผ่านเส้นทาง `/uploads/...` ซึ่งชี้ตรงไปยังโฟลเดอร์ `public/uploadsImg/` บน Server

- **URL Pattern**: `http://<SERVER_HOST>:<PORT>/uploads/<FILENAME>`
- **Method**: `GET`
- **Authentication**: ไม่ต้องใช้ (Public Static Route)
- **Response**: Binary Data ของรูปภาพ พร้อม Headers:
  - `Content-Type: image/jpeg` หรือ `image/png`
  - `Cache-Control: public, max-age=0`
  - `Accept-Ranges: bytes`

---

### 💻 แนวทางการนำไปเขียนใน Frontend / Dashboard

#### ตัวอย่าง 1: การประกอบ URL บน Frontend
เมื่อ Frontend ได้รับ JSON จาก `GET /iiot/get/log` หรือ `GET /iiot/get/dashboard`:
```javascript
const SERVER_URL = 'http://localhost:3000'; // หรือ IP/Domain ของ Server

// จาก log_res.data[0].image_path เช่น "/uploads/cam_1791997624480-529956532.jpg"
const fullImageUrl = item.image_path 
  ? `${SERVER_URL}${item.image_path}` 
  : '/assets/placeholder-no-image.png';
```

#### ตัวอย่าง 2: การเขียน Component ใน React
```jsx
function ScanLogCard({ log }) {
  const SERVER_URL = "http://localhost:3000";
  const imageSrc = log.image_path 
    ? `${SERVER_URL}${log.image_path}` 
    : "/images/no-camera.png";

  return (
    <div className="scan-card">
      <img 
        src={imageSrc} 
        alt={`Log #${log.log_id}`} 
        className="scan-thumbnail"
        onError={(e) => {
          // Fallback เมื่อรูปภาพหาไม่เจอ หรือเซิร์ฟเวอร์ตอบ 404
          e.target.src = "/images/no-camera.png";
        }}
      />
      <div className="scan-info">
        <h4>Log ID: {log.log_id}</h4>
        <p>EPC: {log.epc_id}</p>
        <p>เวลา: {new Date(log.time_stamp).toLocaleString()}</p>
      </div>
    </div>
  );
}
```

#### ตัวอย่าง 3: การเขียนใน HTML ธรรมดา
```html
<!-- เรียกรูปภาพได้โดยตรงผ่านแท็ก <img> -->
<img 
  src="http://localhost:3000/uploads/cam_1791997624480-529956532.jpg" 
  alt="หลักฐานการสแกน" 
  width="320" 
/>
```

---

## 9. Get Users (ดึงรายชื่อบัญชีผู้ใช้)
ดึงรายชื่อผู้ใช้งานในระบบ โดยคัดเฉพาะฟิลด์ที่ปลอดภัย (**ไม่ส่ง `password` และ `token`**)

- **Endpoint**: `GET /iiot/get/users`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `20` | จำนวนรายการต่อหน้า |
  | `role` | string | - | กรองตามสิทธิ์ (`admin`, `teacher`, `dev`) |
  | `search` | string | - | ค้นหา `university_id`, `first_name`, `last_name` หรือ `role` |
  | `is_delete` | boolean | `false` | `true` เพื่อดูบัญชีที่ถูก Soft Delete |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": [
      {
        "user_id": 1,
        "university_id": "67159200",
        "first_name": "อธิป",
        "last_name": "ปทุมสูติ",
        "role": "dev",
        "created_at": "2026-10-18T19:05:34.000Z",
        "last_login_at": "2026-11-17T13:12:55.000Z",
        "is_delete": false
      }
    ]
  }
  ```

---

## 10. Server-Sent Events (SSE Real-time Stream)
ใช้เปิดการเชื่อมต่อค้างไว้เพื่อรับการอัปเดต Dashboard และสถานะอุปกรณ์แบบ Real-time

- **Endpoint**: `GET /iiot/events/stream`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Events ที่ส่งกลับมา**:
  - `event: connected` ➔ `data: {"ok":true}` (ส่งทันทีเมื่อเชื่อมต่อสำเร็จ)
  - `event: DashboardUpdate` ➔ ส่งสถิติและรายการสแกนล่าสุดเมื่อมีการแตะบัตรหรืออัปโหลดภาพใหม่
  - `event: DevicesUpdate` ➔ ส่ง Array ของอุปกรณ์/กล้องที่มีการเปลี่ยนสถานะ Online/Offline
