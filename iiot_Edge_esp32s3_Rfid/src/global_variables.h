#ifndef DATA_INCLUDE_H
#define DATA_INCLUDE_H
#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <DNSServer.h>
#include <ArduinoJson.h>
#include "time.h"
#include <HTTPClient.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <Preferences.h>
#include <WebServer.h>
//#include "AiEsp32RotaryEncoder.h"

#include "./OLED/oled.tree.h"

 using namespace std;

struct deviceInfo {
    String EEPROM_SSID ;
    String EEPROM_Pass ;
    String deviceName ;
    int device_id ;
    int group_id ;

    String apSsid ;
    String apPassword ;
    String apIP ;
    String apHostname ;

    String IP ;
    String mac ;
    String subnet;
    String gateway ;
    String StartTime ;
    String HardWareUpTime ;
};

struct MqttInfo {
    String userMqtt;
    String passMqtt;
    String topic_pub_status;
    String topic_pub_rfid;
    String topic_sub_private;
    String topic_sub_broadcats;
};

struct Rfid_data {
    String tag;
    int distance;
};

inline OLED oled(&Wire);
inline int select_at = 0;

inline String prevRfid ;
inline long Rfid_lastTime = 0;

inline DNSServer dnsServer;
inline Preferences preferences; 

inline deviceInfo device_info;
inline MqttInfo mqtt_info;
inline Rfid_data rfid_data;

inline vector<uint8_t> frameBuffer;

inline struct tm timeinfo;
inline bool IsWedGetIP = false;
inline int countToRestartESP = 0;
inline unsigned long ServerConnectTime = 0;
inline unsigned long publishStatusTime = 0;

inline Srceen_Info Dumy("Dumy",1 ,nullptr);
inline Srceen_Info Root_Menu("Menu" , 1 ,[&](){oled.main_munu(select_at);});
inline Srceen_Info R_esp_Status("ESP Status", 2 ,[&](){oled.randerEspStatus(select_at);});
inline Srceen_Info R_cam_Status("RFID Status" ,1 ,[&](){oled.randerCamStatus();});

inline Srceen_Info R_Network_Status("Network Status" ,1 , [&](){oled.randerNetwoekStatus(select_at);});
inline Srceen_Info Net_WiFi_Status("WiFi Status" , 2 , [&](){oled.randerWiFiStatus(select_at);});
inline Srceen_Info Net_AP_Status("AP Status", 2 ,[&](){oled.randerApStatus(select_at);});

inline Srceen_Info R_MQTT_Status("MQTT Status", 5 ,[&](){oled.randerMQTTStatus(select_at);});
// inline Srceen_Info R_Restart("Restart", 1 ,[&](){oled.Restart();});
// inline Srceen_Info R_Reset("Reset", 1 ,[&](){oled.randerReset(select_at);});
// inline Srceen_Info ReSet_WiFi("Reset WiFi" , 1,[&](){oled.randerResetPopUp(select_at);});
// inline Srceen_Info ReSet_API("Reset API" ,1 , [&](){oled.randerResetPopUp(select_at);});
// inline Srceen_Info ReSet_All("Reset All", 1, [&](){oled.randerResetPopUp(select_at);});

#endif