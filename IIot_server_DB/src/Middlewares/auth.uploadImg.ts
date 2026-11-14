import { Request, Response , NextFunction } from 'express';
import Service from '../service/helper_func.js';
import { getData } from '../Repository/ReadQuery/helper.Read.Query.js';

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
        const result = await Service.executeRead('UploadImg', async () => {
            const result = await getData('device_info', 'key_api', key_api, true);
            return result.data || null;
        });

        if(!result.success){
            console.log(result.error );
            return res.status(result.status).json({ message:'Unauthorized' });
        };
        if((result as any).data === null){
            console.log('Key Api not match to device');
            return res.status(401).json({ message: 'Unauthorized: Key Api not match to device' });
        }

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