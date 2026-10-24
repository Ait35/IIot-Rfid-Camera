#ifndef OLED_INCLUDE_H
#define OLED_INCLUDE_H

#pragma once
#include <Wire.h>
#include <Adafruit_GFX.h>
// #include <Adafruit_SSD1306.h>
#include <Adafruit_SH1106.h>
#include <Fonts/FreeSans9pt7b.h>
#include <Fonts/TomThumb.h>
#include <vector>

#define SCL_PIN 22
#define SDA_PIN 21
// #define SCREEN_WIDTH 128
// #define SCREEN_HEIGHT 64

#define OLED_RESET -1 //ไม่มใีปุ่ม reset
#define SCREEN_ADDRESS 0x3C //address of I2C in SSD1306

using namespace std;

class OLED {  
    private:
        Adafruit_SH1106 _display ;
        
    public:
        vector<vector<String>> menuList;
        OLED(TwoWire* wire) : _display(OLED_RESET){};       

        bool begin();
        void clear_display();
        void Ap_status();
        void setUp_any(String what_setup, bool state , int dot_count);
        void enterMenu(int state , int select);
        void main_munu(int select);
        void show_espStatus(int slidePage);
        void show_rfidStatus();
        void show_NetwoekStatus(int select);
        void Network_WiFiStatus(int slidePage);
        void Network_ApStatus(int slidePage);
        void show_MQTTStatus(int slidePage);
        void Restart();
        void show_Reset(int select);
        void MenuActionReset(int select);
};

#endif