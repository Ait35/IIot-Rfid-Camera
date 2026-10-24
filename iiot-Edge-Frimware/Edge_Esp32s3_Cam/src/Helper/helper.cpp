#include "global_variables.h"
#include "helper.h"
#include "./Secret/secret.h"

using namespace Helper;
using namespace Secret;

String Helper::setDeviceId() {
    String mac = WiFi.macAddress();

    mac.replace(":", "");
    Serial.println("Mac Address: " + mac);
    device_info.mac = mac;
    return  mac;
}

bool Helper::checkMemory_SSID_Pass(){
    preferences.begin("wifi-creds", true);
    device_info.EEPROM_SSID = preferences.getString("ssid", "");
    device_info.EEPROM_Pass = preferences.getString("pass", "");
    preferences.end();
    //ดู EEprom 
    if (device_info.EEPROM_SSID.length() > 0) {
        Serial.println("Find SSID in EEPROM: " + device_info.EEPROM_SSID);
        if(device_info.EEPROM_Pass.length() > 0){
            Serial.println("Find Password in EEPROM: " + device_info.EEPROM_Pass);
        } else {
            Serial.println("No Password to connect WiFi");
        }
        return true;
    }
    return false;
}

String Helper::checkMemory_key_api(){
    preferences.begin("key_api-creds", true);
    Secret::key_api = preferences.getString("key_api", "");
    preferences.end();

    if (Secret::key_api.length() > 0) {
        Serial.println("Find key_api in EEPROM: " + Secret::key_api);
        return Secret::key_api;
    }
    return "";
}

String Helper::gettime() {
if (getLocalTime(&timeinfo)) {
    char timeString[50];
    strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", &timeinfo);

    Serial.println("Synced time: " + String(timeString));
    return String(timeString);
} else {
    Serial.println("Failed to obtain time");
    return "";
}
};

String Helper::getEEprom(String name , String key){
String res ;
preferences.begin(name.c_str(),true);
res = preferences.getString(key.c_str() ,"");
preferences.end();
return res;
};

void Helper::claer_ALL_EEprom(String name){
//ลบ
preferences.begin(name.c_str(), false);
preferences.clear();
preferences.end();
};

String  Helper::getUpTime(unsigned long ms){
    unsigned long sec = ms/1000;  
    unsigned long day = sec/86400;  
    unsigned long hour = (sec % 86400)/3600;
    unsigned long min =  (sec % 3600)/60;
    unsigned long sec2 = (sec % 60);

    char buffer[32];
    if(day > 0){
        sprintf(buffer, "%lud %02lu:%02lu:%02lu", day, hour, min, sec2);
    }else{
        sprintf(buffer, "%02lu:%02lu:%02lu", hour, min, sec2);
    }
    return String(buffer);
};
