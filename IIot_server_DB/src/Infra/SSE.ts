import { Request, Response } from 'express';
import { DashboardService } from '../service/DashboardService/dashboard.service.js';

const clients = new Set<Response>();

//setup ก่อน
export function registerSseClient(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream'); //บอก Browser ว่าข้อมูลนี้เป็น Stream
    res.setHeader('Cache-Control', 'no-cache'); //ห้าม Browser หรือ Proxy เก็บ Cache ของ Stream นี้
    res.setHeader('Connection', 'keep-alive'); //บอกให้เปิดท่อ HTTP นี้ค้างไว้
    res.setHeader('X-Accel-Buffering', 'no'); //สั่ง Nginx (ถ้ามีอยู่ข้างหน้า) ว่าห้ามกักข้อมูลไว้รอเต็มกล่อง ให้ส่งผ่านทันที
    res.flushHeaders(); //ดัน Header ทั้งหมดออกไปหา Browser ทันที เพื่อยืนยันว่า "เปิดท่อติดแล้ว" แม้ยังไม่มีข้อมูลส่งไปก็ตาม

    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    clients.add(res); //ส่ง Event แรกชื่อconnectedพร้อมข้อมูลออกไป ผ่าน res จาก Browser

    const cleanup = () => {
        clearInterval(heartbeat);
        clients.delete(res);
    };

    const heartbeat = setInterval(() => {
        if (res.writableEnded) {
            cleanup();
            return; 
        }
        try {
            res.write(': keep-alive\n\n');
        } catch {
            cleanup();
        }
    }, 25000); //ส่ง Keep-alive (บรรทัดขึ้นต้นด้วย : เป็น comment ของ SSE ช่วยปลุกท่อ)

    req.on('close', cleanup); //ดักฟังเหตุการณ์ตอนผู้ใช้ปิดแท็บ เปลี่ยนหน้า หรือเน็ตหลุด
}

 //ทำงานละ
export function broadcastSse(eventName: string, data: unknown) {
    if (clients.size === 0) return; 
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of clients) { //วนลูป res ของทุกคนที่เปิด Dashboard อยู่ตอนนี้
        if (client.writableEnded) {
            clients.delete(client);
            continue;
        }
        try{
            client.write(payload);
        }catch (error) {
            console.error('Error broadcasting SSE to a client:', error);
            clients.delete(client); //ลบ res ของคนที่หลุดไปแล้วออกจาก Set
        }
    }
}

export async function pushDashboardUpdate() {
    if (clients.size === 0) return; // ไม่มีใครเปิดเว็บอยู่ ข้ามการ Query DB ไปเลย
    const summary = await DashboardService.get_dashboardSummary();
    if (summary.success && summary.data) {
    // ส่งก้อน stats + recentScans (ที่มี latest_image ครบแล้ว) พุ่งไปหน้าเว็บตรงๆ
        broadcastSse('dashboard_update', summary.data);
    }
}