import { MqttWrite } from './mqttService/write.mqtt.js';
import { MqttRead } from './mqttService/read.mqtt.js';
import Service from './helper_func.js';
import { Query } from '../Repository/helperQuery.js';
import { DeviceWrite } from './DeviceService/write.device.js';
import { DeviceRead } from './DeviceService/read.device.js';
import { GroupWrite } from './GroupService/writ.group.js';
import { GroupRead } from './GroupService/read_group.js';
import { Map_tagWrite } from './MapService/write.tag.js';
import { TagRead } from './MapService/read.tag.js';
import { LogRead } from './LogService/read.log.js';
import { IP_CamWrite } from './IP_CamService/write.service.js';
import { IP_CamRead } from './IP_CamService/read.service.js';
import { SubProcess } from "./IP_CamService/SubProsessIP_Cam.js"
import { MainProcess } from "./IP_CamService/processIP_Cam.js"

export const Helper = {
    Service : Service,
    Query : Query
};

export const MqttService = {
    Write : MqttWrite,
    Read : MqttRead
};

export const GroupService = {
    Write : GroupWrite,
    Read : GroupRead
};

export const DeviceService = {
    Write : DeviceWrite,
    Read : DeviceRead
};

export const MapTagService = {
    Write : Map_tagWrite,
    Read : TagRead
};

export const LogService = {
    Read : LogRead
};

export const IP_CamService = {
    Write : IP_CamWrite,
    Read : IP_CamRead,
    Process : MainProcess,
    SubProcess: SubProcess
};
