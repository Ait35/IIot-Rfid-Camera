#include "global_variables.h"

void connectWiFi(String *ssid = nullptr, String *password = nullptr) {
    if (ssid != nullptr && *ssid != "") {
        if (password != nullptr) {
            WiFi.begin(ssid->c_str(), password->c_str());
        }else {
            WiFi.begin(ssid->c_str());
        }
        //time out 10 sec
        oled.setUp_any("WiFi", false, 0);
        int dot = 0;
        unsigned long startAttemptTime = millis();
        unsigned long lastDotTime = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
            if (millis() - lastDotTime >= 300) {
                dot = (dot + 1) % 4;
                oled.setUp_any("WiFi", false, dot);
                lastDotTime = millis();
            }
            delay(10);
            Serial.print(".");
        }

        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\n✅ Connected to Wifi Success");
            oled.setUp_any("WiFi", true, 0);
            delay(500);
        } else {
            Serial.println("\n❌ Failed to connect to WiFi, restarting...");

            preferences.begin("wifi-creds", false);
            preferences.clear();
            preferences.end();
            ESP.restart();
        }
        configTime(7*3600, 0, "pool.ntp.org");
        //IsWedGetIP = true;
        device_info.subnet = WiFi.subnetMask().toString();
        device_info.gateway = WiFi.gatewayIP().toString();
        device_info.IP = WiFi.localIP().toString();
   
        Serial.print("\nConnected! IP: " + WiFi.localIP().toString());
        Serial.println("\tSubnet: " + device_info.subnet);
        Serial.println("Gateway: " + device_info.gateway);
    } else {
        Serial.println("not find to SSID");
    }
}