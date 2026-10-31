import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connect_DB } from './Infra/connect_db.js';
import redis from './Infra/Redis/connect_redis.js';
import { initMqtt } from './Infra/Mqtt.infra.js';
import { dispatch_message } from './service/Message.Mqtt.Service/dispatch.js';
import Router from './Router/Export_router.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

import { IP_CamService } from "./service/Class_service.js"
import { getData } from "./Repository/ReadQuery.js"

async function startServer() {
  try {
    await connect_DB();
    console.log('--- Database Connected ---');

    await redis.connect();
    console.log('✅ Connected to Redis');

    await initMqtt.connect();

    initMqtt.callbackMessage(dispatch_message);

  } catch (error) {
    console.error('😵 Error starting the server:', error);
    process.exit(1); 
  }
}
let totalGroup = 0;
let indexGroup = 0;
let listGroup = [] as number[] //กันเจอ soft delete
// export const global = {
//   totalGroup : 0,
//   indexGroup : 0,
//   listGroup : [] as number[] //กันเจอ soft delete
// };

export const updataTatalGroup = async(transaction? : any) => {
    const result = transaction? 
      await getData("device_group" , "is_delete" , false , false , transaction , "group_id ASC"):
      await getData("device_group" , "is_delete" , false , false , null , "group_id ASC")

    if(result.success && result.data){
      //ตรวจว่าเป็น array ไหม ถ้าไม่ใช่ กรณีมีข้อมูล 1 ตัว ก้จับมันใส่ [result.data] ซะ กล่ยเป็น array
      const rows = Array.isArray(result.data) ? result.data : [result.data];
      totalGroup = rows.length;
      
      // เคลียร์และสร้าง listGroup ใหม่ ไม่ให้ข้อมูลเก่าเบิ้ลซ้ำ
      listGroup = rows.map((item: any) => +(item.group_id));
    }else{
      totalGroup = 0;
      listGroup = [];
    }
    console.log ("maxGroup : " , totalGroup)
    console.log("active listGroup :", listGroup);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// และให้ไปดึง IP จริงๆ ของ User จาก Header (เช่น X-Forwarded-For) มาใส่ใน req.ip
//app.set('trust proxy', 1); // เลข 1 คือจำนวนชั้นของ Proxy (ส่วนใหญ่เป็น 1 ถ้าใช้ Cloudflare หรือ Nginx)

app.use(cors());
app.use(express.json());
// เปิดให้ Frontend เข้าถึงไฟล์รูปภาพผ่าน URL /uploads/...
app.use('/uploads', express.static(path.join(__dirname, '../public/uploadsImg')));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`⏱️ [${req.method}] ${req.originalUrl} - ${duration}ms (Status: ${res.statusCode})`);
    });
    next();
});

app.use(Router);

await startServer();

app.listen(process.env.PORT, () => {
  console.log('--- Server is running on port', process.env.PORT, '---');
});
console.log("==============================================");

//สร้างโฟรเดอรืสำรหับเก้บรูปภาพเวลารันครั้งแรก
if (!fs.existsSync("../public/uploadsImg")) {
    fs.mkdirSync("../public/uploadsImg", { recursive: true })
}

await updataTatalGroup()
//console.log(listGroup)
setInterval(async () =>{
  if(totalGroup <= 0){
    return;
  }
  if(indexGroup >= totalGroup){
    indexGroup = 0 ;
  }
  const start = Date.now();
  const res = await IP_CamService.Process.checkCameraAlive(listGroup[indexGroup] as number)
  indexGroup++;
 // console.log("==============================================");
  // console.log(`⏱️ [KeepAlive] - ${Date.now() - start}ms (Status: ${(res as any)?.status})`)

} , 30000)