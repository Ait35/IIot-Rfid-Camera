#ifndef DATA_INCLUDE_H
#define DATA_INCLUDE_H
#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <DNSServer.h>
#include <ArduinoJson.h>
#include "time.h"
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <Preferences.h>
#include <WebServer.h>
#include "AiEsp32RotaryEncoder.h"

#include "esp_camera.h"
#include "./Control_panel/panel.h"
#include "OLED/oled.h"

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
    String topic_sub_private;
    String topic_sub_CAM_broadcast;
    String topic_sub_CMD_broadcast;
};

struct ImageInfo {
    int log_id;
    camera_fb_t *img ;
};


inline QueueHandle_t ImageQueue;
inline int countImage = 0;

inline DNSServer dnsServer;
inline Preferences preferences;

inline  deviceInfo device_info;
inline MqttInfo mqtt_info;
inline ImageInfo image_info;

AiEsp32RotaryEncoder inline encoder(ROTARY_ENCODER_PIN_A, ROTARY_ENCODER_PIN_B, ROTARY_ENCODER_PSH_PIN, ROTARY_ENCODER_VCC_PIN, ROTARY_ENCODER_STEPS);
inline OLED oled(&Wire);
inline int select_at = 0;
inline int Choice_Reset_FromOLED = 0;
inline int conFrimReset = 0;

inline struct tm timeinfo;
inline bool IsWedGetIP = false;
// inline int countToRestartESP ;
inline unsigned long WedServerCountTime = 0;
inline unsigned long publishStatusTime = 0;

inline Srceen_Info Dumy("Dumy",1 ,nullptr);
inline Srceen_Info Root_Menu("Menu" , 1 ,[&](){oled.main_munu(select_at);});
inline Srceen_Info R_esp_Status("ESP Status", 2 ,[&](){oled.randerEspStatus(select_at);});
inline Srceen_Info R_cam_Status("Camera Status" ,1 ,[&](){oled.randerCamStatus();});

inline Srceen_Info R_Network_Status("Network Status" ,1 , [&](){oled.randerNetwoekStatus(select_at);});
inline Srceen_Info Net_WiFi_Status("WiFi Status" , 2 , [&](){oled.randerWiFiStatus(select_at);});
inline Srceen_Info Net_AP_Status("AP Status", 2 ,[&](){oled.randerApStatus(select_at);});

inline Srceen_Info R_MQTT_Status("MQTT Status", 5 ,[&](){oled.randerMQTTStatus(select_at);});
inline Srceen_Info R_Restart("Restart", 1 ,[&](){oled.Restart();});
inline Srceen_Info R_Reset("Reset", 1 ,[&](){oled.randerReset(select_at);});
inline Srceen_Info ReSet_WiFi("Reset WiFi" , 1,[&](){oled.randerResetPopUp(select_at);});
inline Srceen_Info ReSet_API("Reset API" ,1 , [&](){oled.randerResetPopUp(select_at);});
inline Srceen_Info ReSet_All("Reset All", 1, [&](){oled.randerResetPopUp(select_at);});



#endif