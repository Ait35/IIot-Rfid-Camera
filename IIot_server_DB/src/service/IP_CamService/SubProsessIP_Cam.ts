import net from 'net';
import * as fs from 'fs'
import * as path from 'path';
import { pipeline } from 'stream/promises';
import Service from '../helper_func.js';
import { fileURLToPath } from 'url';
import { request } from 'urllib';
import http from 'http';

export const SubProcess = {
    getCameraPort(rtsp_url?: string, onvif_url?: string , snapshot_url?: string): number|null {
        if (snapshot_url) {
            const match = snapshot_url.match(/:(\d+)(?=[/?#]|$)/); 
            if(match){
                return Number(match[1]) 
            }
        } //ใช้ if แทน else if เพราะ กันกรณีที่ใส่ url มาผิด แต่ตัวอื่นถูก
        if (rtsp_url) {
            const match = rtsp_url.match(/:(\d+)(?=[/?#]|$)/); 
            if(match){
                return Number(match[1]) 
            }
        }
        if (onvif_url) {
            const match = onvif_url.match(/:(\d+)(?=[/?#]|$)/); 
            if(match){
                return Number(match[1]) 
            }
        } 
        
        return null;
    },
    async CheckAuthType(
        user: string | null | undefined , 
        password: string | null| undefined  , 
        IncomeUrl: string | null| undefined 
    ){
        if(!IncomeUrl || !user || !password){
            return null ;
        }
        const typelist = ["query" ,"basic", "digest"]

        const customAgent = new http.Agent({ insecureHTTPParser: true } as any);
        let type = null ;
        for (const typeIs of typelist){
            let url = IncomeUrl
            const options: any = {
                agent: customAgent,
                timeout: 1500,
            };
            
            switch (typeIs) {
                case "query": 
                    type = "query";
                    url = `${url}?user=${user}&pwd=${password}`;
                    break;
                case "digest" :
                    type = "digest" ;
                    options.digestAuth = `${user}:${password}`;
                    break;
                default:
                    type = "basic" ;
                    options.auth = `${user}:${password}`;
                    break;
            }
            const response = await request(url, options);

            if (response.status === 200){
                return type
            }
        }
        return type
    },
    async Socket_TCP_Check (camInfo :any):Promise<unknown>{
        return new Promise(resolve => {
            const port = camInfo.keep_alive_port? camInfo.keep_alive_port : 
                this.getCameraPort(
                    camInfo.rtsp_url,
                    camInfo.onvif_url,
                    camInfo.snapshot_url
                )
            const socket = new net.Socket();
            socket.setTimeout(300);

            socket.on('connect', () => {
                socket.destroy();

                // console.log(`IP: ${camInfo.ip} port: ${port} -> ✅ success`)
                resolve({ip_cam_id: camInfo.ip_cam_id , status: true ,date: new Date()}); // กล้องเปิดอยู่และตอบสนอง!
            });
            socket.on('timeout', () => {
                socket.destroy();

                console.warn(`⚠️ [Camera Timeout] IP: ${camInfo.ip} port: ${port} -> ❌ time out`)
                resolve({ip_cam_id: camInfo.ip_cam_id , status: false, date: null});
            });
            socket.on('error', () => {
                socket.destroy();
    
                console.warn(`⚠️ [Camera Error] IP: ${camInfo.ip} port: ${port} -> ❌ error`)
                resolve({ip_cam_id: camInfo.ip_cam_id , status: false, date: null});
            });
            
            socket.connect(port, camInfo.ip);
        }
    )},
    async fetch_snapshot(
        log_id:number , 
        ip: string ,
        url: string , 
        user:string ,
        password: string,
        auth : string
    ){
        if (!url || typeof url !== 'string') return ({ path: "" });
        console.log("Get Images");
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const imageName = `IP_cam_${log_id}_${Service.getFormattedTimestamp()}.jpg`
        const saveToFloder = path.join(__dirname, "../../../public/uploadsImg" , imageName);

        console.log(`user: ${user} pass : ${password} auth: ${auth}`)
        try{
            if(auth != "digest"){
                console.log(`IP ${ip} Switching to Raw TCP mode...`);
                return await this.fetch_snapshot_raw_tcp(url, saveToFloder, user, password, auth);
            }

            const customAgent = new http.Agent({ insecureHTTPParser: true } as any);
            const options: any = {
                agent: customAgent,
                timeout: 1500,
                insecureHTTPParser: true,
                digestAuth: `${user}:${password}`,
                streaming: true // บอก urllib ว่าขอรับ Response กลับมาเป็น Stream ไม่ใช่ Buffer
            };

            const response = await request(url, options);

            if (response.status === 200) {
                // ใช้ pipeline ตาม Best Practice ของ Node.js ยุคใหม่
                const fileStream = fs.createWriteStream(saveToFloder);
                await pipeline(response.res, fileStream);
                
                console.log(`IP ${ip} get image success => Name: ${imageName}`);
                return { path: saveToFloder };
            } else {
                console.log(`IP ${ip} Failed with status: ${response.status}`);
                if (response.res) response.res.resume(); // เคลียร์ Stream ทิ้ง
                if (fs.existsSync(saveToFloder)) fs.unlinkSync(saveToFloder);
                return { path: "" };
            }
        }catch (err: any) {
            // 2. ถ้าเจอ VStarcam (urllib v3 จะพ่น Error เพราะ Header เพี้ยน) 
            // ให้สลับไปใช้ Raw TCP    
            if (err.message.includes("Invalid header token") || err.message.includes("Parse Error") || err.code === 'HPE_INVALID_HEADER_TOKEN') {
                console.log(`IP ${ip} HTTP parser failed. Switching to Raw TCP mode...`);
                return await this.fetch_snapshot_raw_tcp(url, saveToFloder, user, password, auth);
            }

            console.error(`IP ${ip} Error fetching snapshot:`, err.message);
            if (fs.existsSync(saveToFloder)) fs.unlinkSync(saveToFloder);
            return { path: "" };
        }
    },
    async fetch_snapshot_raw_tcp( 
        targetUrl: string, 
        saveToFolder: string ,
        user : string,
        pass : string,
        auth: string
    ): Promise<{ path: string }> {
        return new Promise((resolve) => {
            let authBase64: string = '' ;
            switch (auth) {
                case "basic" :
                    const TranFromBase64 = Buffer.from(`${user}:${pass}`).toString('base64');
                    authBase64 = `Authorization: Basic ${TranFromBase64}\r\n`;
                    break;
                default:
                    targetUrl = `${targetUrl}?user=${user}&pwd=${pass}`
                    console.log("qurery");
                    break;
            }

            const parsedUrl = new URL(targetUrl);
            const client = new net.Socket();
            let dataBuffer = Buffer.alloc(0);
            const port = parsedUrl.port ? parseInt(parsedUrl.port) : 80;

            client.setTimeout(1500);

            client.connect(port, parsedUrl.hostname, () => {
            //ถ้าเป็น basic ตัว parsedUrl.search = '' 
            //ถ้า ที่ต้องมี \r\n บวกตอนท้ายเพราะ ถ้าหลังจบ http ต้องมี \r\n 2 รอบ
                const rawHttpGet = `GET ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.0\r\n`
                + authBase64 + `\r\n`; 
            //ถ้า authBase64 = ค่าว่าง \r\n จะติดกันพอดี ถ้า authBase64 != ค่าว่าง มันจะมี \r\n ข้างหลังเสมอ
                console.log(rawHttpGet);
                client.write(rawHttpGet);
            });

            //ข้อมูลจากสายแลนจะไหลมาเป็นก้อนเล็กๆ (Chunk)
            client.on('data', (chunk: Buffer<ArrayBuffer> ) => {
                // เอาข้อมูลที่ไหลเข้ามา ประกอบร่างรวมกันไว้ในถังพัก
                dataBuffer = Buffer.concat([dataBuffer, chunk]);
            });

            // เมื่อกล้องส่งเสร็จและตัดสาย (Connection Closed)
            client.on('close', () => {
                // ไฟล์ JPEG ทุกไฟล์ในโลกต้องเริ่มด้วย FF D8 และจบด้วย FF D9 เสมอ
                const JPEG_SOI = Buffer.from([0xFF, 0xD8]); // SOI (Start of Image)
                const JPEG_EOI = Buffer.from([0xFF, 0xD9]); // EOI (End of Image)

                // ค้นหาตำแหน่งของลายเซ็นในถังพักข้อมูล
                const startIndex = dataBuffer.indexOf(JPEG_SOI);
                const endIndex = dataBuffer.lastIndexOf(JPEG_EOI);

                // ถ้าเจอลายเซ็นทั้งหัวและท้ายครบถ้วน
                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    // ใช้คำสั่ง subarray หั่นเอาเฉพาะช่วงเนื้อภาพออกมา 
                    // (+2 เพื่อให้ครอบคลุมตัวอักษร 0xFF 0xD9 ตอนจบด้วย)
                    const pureImageBuffer = dataBuffer.subarray(startIndex, endIndex + 2);
                    
                    fs.writeFileSync(saveToFolder, pureImageBuffer);
                    console.log(`IP ${parsedUrl.hostname} get image success (TCP Extracted)`);
                    resolve({ path: saveToFolder });
                } else {
                    console.log(`IP ${parsedUrl.hostname} Failed: No JPEG signature found in stream`);
                    resolve({ path: "" });
                }
            });

            client.on('timeout', () => {
                client.destroy();
                resolve({ path: "" });
            });

            client.on('error', (err) => {
                client.destroy();
                resolve({ path: "" });
            });
        });
    }
}