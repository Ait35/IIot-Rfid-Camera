import { Router } from 'express'; 
import path_login_sigin from './path/path_account.js';
import path_MQTT from './path/path_MQTT.js';
import path_group from './path/path.group.js';
import path_device from './path/path.device.js';
import path_mapTag from './path/path.mapTag.js';
import path_dashboard from './path/path.dashboard.js';
import path_upload_img from './path/path_upload.img.js';
import path_Log from './path/path.Log.js';

const router = Router();
router.use(path_login_sigin);
router.use(path_MQTT);
router.use(path_group);
router.use(path_device);
router.use(path_mapTag);
router.use(path_dashboard);
router.use(path_upload_img);
router.use(path_Log);


export default router;