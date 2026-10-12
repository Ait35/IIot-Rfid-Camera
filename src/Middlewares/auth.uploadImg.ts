import { Request, Response , NextFunction } from 'express';
import { Helper } from '../service/Class_service.js';
import { getData } from '../Repository/ReadQuery.js';

export const Auth_uploadImg = async (req: Request, res: Response , next: NextFunction) => {
    console.log('----- API action: Auth_uploadImg -----');
    let key_api = req.headers.authorization;

    if (!key_api) {
        return res.status(401).json({ message: 'Unauthorized: ไม่พบ API Key' });
    }
    if (key_api.startsWith('Bearer ')) {
        key_api = key_api.split(' ')[1] as string;
    }
    console.log('API Key :', key_api);
    try{
        //prefix : string, cacheKey : string, DBtable : string , DBcolumn : string
        const result = await Helper.Service.readAndWriteLog('UploadImg' , 'Device_info' , null , null,
                async ()=>  {
                const result = await getData('device_info', 'key_api', key_api, true);
            
                return { 
                    result: result,
                    logPayload: {
                        device_id : result.data.device_id? result.data.device_id : null, 
                        mac : result.data.mac ? result.data.mac : null}
                };
            });

        if(!result.success){
            console.log(result.error );
            return res.status(result.status).json({ message:'Unauthorized' });
        };
        // กัน Crash
        if (!(req as any).payload) {
            (req as any).payload = {};
        }

        (req as any).payload.key_api = key_api;
        console.log("✅ Auth_uploadImg Successful!");
        return next();
    } catch (error) {

        console.error('Middleware Auth Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }finally{
        console.log("====================================================");
    }
};