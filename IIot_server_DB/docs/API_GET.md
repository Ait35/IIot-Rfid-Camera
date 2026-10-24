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
| `GET /iiot/get/group` | ดึงรายชื่อกลุ่มอุปกรณ์ทั้งหมด (พร้อม pagination) | Bearer JWT | `page`, `limit` | 100 req / 15 min |
| `GET /iiot/get/device` | ดึงรายการอุปกรณ์ทั้งหมด (RFID / CAM) | Bearer JWT | `page`, `limit` | 100 req / 15 min |
| `GET /iiot/get/mqtt` | ดึงรายการการตั้งค่า MQTT ประจำกลุ่ม | Bearer JWT | `page`, `limit` | 100 req / 15 min |
| `GET /iiot/get/tag` | ดึงรายการแท็ก RFID ที่ลงทะเบียนในระบบ | Bearer JWT | `page`, `limit` | 100 req / 15 min |
| `GET /iiot/get/log` | ดึงประวัติการสแกนบัตร RFID พร้อม URL รูปภาพ | Bearer JWT | `page`, `limit` | 100 req / 15 min |
| `GET /iiot/get/dashboard` | ดึงข้อมูลสรุปสถิติและ 10 การสแกนล่าสุด | Bearer JWT | *ไม่มี* | 100 req / 15 min |
| `GET /uploads/:filename` | ดึงไฟล์รูปภาพหลักฐานที่บันทึกจากกล้อง | Public | *ไม่มี* | ตามขีดจำกัด Express |

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

- **Request Example**:
  ```http
  GET /iiot/get/group?page=1&limit=5 HTTP/1.1
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
        "by_user_name": "Gemini"
      }
    ]
  }
  ```

---

## 2. Get Devices (ดึงรายการอุปกรณ์)
ดึงรายชื่ออุปกรณ์ RFID และ Camera ทั้งหมดที่ไม่ได้ถูกลบ (`is_delete = false`)

- **Endpoint**: `GET /iiot/get/device`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |

- **Request Example**:
  ```http
  GET /iiot/get/device?page=1&limit=5 HTTP/1.1
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
        "by_user_name": "Gemini"
      }
    ]
  }
  ```

---

## 3. Get MQTT Configurations (ดึงรายการการตั้งค่า MQTT)
ดึงการตั้งค่า MQTT Broker, Topic และบัญชีเชื่อมต่อประจำแต่ละกลุ่ม

- **Endpoint**: `GET /iiot/get/mqtt`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |

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
ดึงประวัติการตรวจจับแท็ก RFID ล่าสุด โดยระบบจะเชื่อมตาราง (`LEFT JOIN`) กับ `log_images` เพื่อคืนค่า `image_path` ของกล้องให้ทันที

- **Endpoint**: `GET /iiot/get/log`
- **Authentication**: `Bearer <JWT_TOKEN>`
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `page` | integer | `1` | หน้าที่ต้องการแสดง |
  | `limit` | integer | `10` | จำนวนรายการต่อหน้า |

- **Request Example**:
  ```http
  GET /iiot/get/log?page=1&limit=5 HTTP/1.1
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
        "image_path": "/uploads/cam_1791997624480-529956532.jpg"
      },
      {
        "log_id": 135,
        "device_id": 1,
        "epc_id": 85,
        "distance": 2.0,
        "time_stamp": "2026-10-17T08:28:40.000Z",
        "image_path": null
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

## 7. การดึงไฟล์รูปภาพจาก Server ไปแสดงผลที่ Dashboard

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
