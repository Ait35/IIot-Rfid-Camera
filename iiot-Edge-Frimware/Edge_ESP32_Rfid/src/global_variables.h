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
#include "AiEsp32RotaryEncoder.h"

#include "./OLED/oled.h"
#include "./Control_panel/Encoder_panel.h"

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

AiEsp32RotaryEncoder inline encoder(ROTARY_ENCODER_PIN_A, ROTARY_ENCODER_PIN_B, ROTARY_ENCODER_PSH_PIN, ROTARY_ENCODER_VCC_PIN, ROTARY_ENCODER_STEPS);

inline OLED oled(&Wire);
inline int select_at = 0;
inline int state = 0;
inline vector<int> StackSrceen = {0};
inline bool stateBTN = false;

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

#endif