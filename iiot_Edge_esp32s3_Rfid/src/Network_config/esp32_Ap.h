#include "global_variables.h"
#include <WiFi.h>

inline void setAP(String *deviceId) {
    WiFi.setHostname(("iiot-mini-" + *deviceId).c_str());

    WiFi.mode(WIFI_MODE_APSTA);
    device_info.apSsid = "TTX-RFID-" + deviceId->substring(deviceId->length() - 6);
    device_info.apPassword = "SPU-" + deviceId->substring(deviceId->length() - 6);
    device_info.apIP = "192.168.4.1";

    if(!WiFi.softAP(device_info.apSsid.c_str(), device_info.apPassword.c_str())){
        Serial.println("AP mode failed to start");
        return;
    }
    device_info.apIP = WiFi.softAPIP().toString();
    device_info.apHostname = WiFi.getHostname();
    dnsServer.start(53, "*", WiFi.softAPIP());
    Serial.println("AP mode started");
    Serial.println("SSID: " + device_info.apSsid + " Password: " + device_info.apPassword);
    Serial.print("AP IP address: " + device_info.apIP);
    Serial.println("\tHostname: " + device_info.apHostname);
    Serial.println("-------------------------------------------");
}