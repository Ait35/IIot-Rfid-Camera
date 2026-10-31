import { InsertData } from '../../Repository/insertQuery.js';
import { Helper } from '../Class_service.js';
import { PoolClient } from 'pg';
import { QueryRedis } from '../../Infra/Redis/cache.js';
import { ActivityLogService } from '../../Repository/Activity_Log/ActivityQuery.js';

export const insertEcpAndEcpLog = async ( payload: any, dataOJB:any ,logOJB : any) => {
        try{
        console.log("----- InsertRfidLog chack Cache -----");
        const result = await Helper.Service.ChackCacheAndSave('epc', dataOJB.epc, 'map_tag', 'epc');
        
        if(result.success){
            // console.log('----- Data in found in DB or cache -----');
            return await Helper.Service.executeWithLog('Insert log_rfid', 'log_rfid', 'INSERT', null ,
                async (transaction: PoolClient)=>{
                    //เอา ecp id ที่เจอใน cache โดยที่ไม่ต้องลง DB เพื่อไปดูว่า ecp นี้ id, tag อะไร
                    //แต่ถ้าไม่เจอใน cache จะต้องลง DB ใน ChackCacheAndSave มีการหาใน DB อยู่แล้ว แล้ว save ลง cache ไปเลย
                    logOJB.epc_id = result.data.epc_id;
                    const insert_log= await InsertData('log_rfid', logOJB, transaction);
                    await QueryRedis.setCache(insert_log.data.log_id , 'log_rfid', insert_log.data);

                    return {
                        result: insert_log,
                        recordId: insert_log.data.log_id , // ส่ง ID กลับไปให้ Helper ทำ Log
                        logPayload: { 
                            device_id: payload.device_id,
                            ip_address: payload.ip, 
                            mac_address: payload.mac
                        }
                    };
                }
            );
        }  
        //กรณีที่ epc ไม่พบใน cache, DB มันจะ insert ecp
        // console.log('----- Data not found in DB or cache -----');
        return await Helper.Service.executeWithLog('Insert map_Tag', 'map_tag', 'INSERT', null , 
            async (transaction: PoolClient)=>{
                let res_query;
                try {
                    res_query = await InsertData('map_tag', dataOJB, transaction);
                } catch (err: any) {
                    // ถ้าเจอ Error ว่าข้อมูลซ้ำ
                    if (err.cause?.code === '23505') {
                        // ให้ไป SELECT ดึงข้อมูลแถวที่มีอยู่แล้วมาแทนเลย ไม่ต้องแครช
                        const existing = await transaction.query(
                            'SELECT * FROM map_tag WHERE epc = $1 FOR UPDATE;', 
                            [dataOJB.epc] //FOR UPDATE คือล็อคไว้ กัน EPC เข้ามาพร้อมกันในเสี้ยววินาที Transaction เลยยังไม่ทันล็อค
                        );
                        res_query = { data: existing.rows[0] };
                    } else {
                        throw err;
                    }
                }

                logOJB.epc_id = res_query.data.epc_id;
                const insert_log = await InsertData('log_rfid', logOJB, transaction);
                console.log('✅ Insert log_rfid Successful!');
                //set Cache ทั้ง ecp และ log_rfid เพราะ epc สำหรับรับจาก esp32 ,ส่วน log ต้อง backend รับ log_id และรูปจาก cam ในการ insert img ทำให้ทั้ง 2 ไม่ต้องเข้า DB
                await QueryRedis.setCache(dataOJB.epc, 'epc', res_query.data);
                await QueryRedis.setCache(insert_log.data.log_id, 'log_rfid', insert_log.data);

                res_query.data.log_id = insert_log.data.log_id;
                await ActivityLogService.Insert_logAction(null, 'INSERT', 'log_rfid', insert_log.data.log_id, {
                    device_id: payload.device_id,
                    ip_address: payload.ip, 
                    mac_address: payload.mac
                }, transaction);

                return {
                    result: res_query,
                    recordId: res_query.data.epc_id, // ส่ง ID กลับไปให้ Helper ทำ Log
                    logPayload: { 
                        device_id: payload.device_id,
                        ip_address: payload.ip, 
                        mac_address: payload.mac
                    }
                };
            });
    }catch(error: any){
        console.error('Error occurred while checking cache or fetching data from database:', error);
    }
}