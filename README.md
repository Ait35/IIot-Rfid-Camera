# IIoT RFID & Camera Security System

ระบบสถาปัตยกรรม IIoT จัดการการแตะบัตร RFID บันทึกข้อมูลแบบ Real-time และสั่งการกล้องวงจรปิดถ่ายภาพ Snapshot พร้อมระบบ Caching และ Concurrency Control

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```
[ ESP32 RFID Reader ]
        │ (MQTT: SPU/rfid/group{id}/...)
        ▼
[ MQTT Broker (EMQX) ]
        │
        ▼
[ Node.js + TypeScript Backend ]
   ├── 1. เช็ค Redis Cache (epc:<EPC>)
   │       ├── Cache Hit  ──> ดึง epc_id ทันที (ไม่ต้อง query DB)
   │       └── Cache Miss ──> Query PostgreSQL (และเซ็ตลง Redis)
   ├── 2. บันทึก log_rfid ลง PostgreSQL
   ├── 3. ยิง MQTT สั่งถ่ายภาพ (SPU/CAM/group{id}/.../broadcast)
   ├── 4. ดึง Snapshot จากกล้องวงจรปิด (Raw TCP / HTTP Digest)
   └── 5. บันทึกไฟล์ภาพแบบ Async และบันทึกตาราง log_images
```

---

## ⚡ สิ่งที่ปรับปรุงล่าสุด (Latest Updates & Optimizations)

### 1. ระบบจัดการกล้องวงจรปิด (IP Camera Auto Detection)
* **Auto Auth & Port:** API รองรับการส่ง `auth: "auto"` เพื่อให้ระบบทดสอบและเลือกประเภท Authentication (`query`, `basic`, `digest`) อัตโนมัติ และ `keep_alive_port: "auto"` เพื่อแกะพอร์ตจาก URL
* **Raw TCP JPEG Parser:** รองรับกล้อง Firmware เก่า (เช่น VStarcam) ที่ส่ง Header ไม่ได้มาตรฐาน (`HPE_INVALID_HEADER_TOKEN`) โดยใช้ Raw TCP Socket ดึง Byte Stream และหั่นเฉพาะช่วงเนื้อภาพ JPEG (`0xFF 0xD8` ถึง `0xFF 0xD9`)
* **Async Disk Writing:** เปลี่ยนการบันทึกภาพลง Disk เป็น `await fs.promises.writeFile` แบบ Asynchronous เพื่อไม่บล็อก Event Loop ของ Node.js ขณะให้บริการ REST API อื่นๆ

### 2. การจัดการข้อมูลบัตร (Tag Lifecycle & Cache Invalidation)
* **Soft Delete:** เมื่อส่ง `is_delete: true` ระบบจะรีเซ็ตคอลัมน์อื่นๆ กลับเป็นค่า Default (โดยคงค่า `epc` ไว้) และลบ Cache ออกจาก Redis ทันที
* **Restore:** เมื่อส่ง `is_delete: false` ระบบจะอัปเดตสถานะกลับมาพร้อมเซ็ต Cache คืนเข้า Redis
* **Concurrency Lock:** จัดการการแตะบัตรซ้ำในเสี้ยววินาที (Race Condition) โดยดักจับข้อผิดพลาด `23505` แล้ว fallback ด้วย `SELECT ... FOR UPDATE` ป้องกันข้อมูลซ้ำซ้อนและระบบไม่แครช

---

## 🔌 API Updates Reference (สำหรับผู้ใช้งาน API)

### เพิ่ม/แก้ไขกล้องวงจรปิด (`ip_camera`)
* ฟิลด์ `auth` (Optional): `"query" | "basic" | "digest" | "auto"` (ค่าเริ่มต้น: `"auto"`)
* ฟิลด์ `keep_alive_port` (Optional): `number | "auto"` (ค่าเริ่มต้น: `"auto"`)
* เงื่อนไข: หากระบุ `cam_password` จำเป็นต้องระบุ `cam_username` เสมอ

### อัปเดตสถานะบัตร (`map_tag`)
* **Soft Delete:** ส่ง `{ epc_id: 104, is_delete: true }`
* **Restore:** ส่ง `{ epc_id: 104, is_delete: false }`
