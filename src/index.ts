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

async function startServer() {
  try {
    await connect_DB();
    console.log('--- Database Connected ---');

    await redis.connect();
    console.log('✅ Connected to Redis');

    await initMqtt.connect();

    initMqtt.callbackMessage(dispatch_message);

    app.listen(process.env.PORT, () => {
      console.log('--- Server is running on port', process.env.PORT, '---');
    });

  } catch (error) {
    console.error('😵 Error starting the server:', error);
    process.exit(1); 
  }
}

startServer();