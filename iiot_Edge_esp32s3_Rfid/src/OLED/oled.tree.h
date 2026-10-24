#ifndef OLED_INCLUDE_H
#define OLED_INCLUDE_H

#pragma once

#include <Wire.h>
#include <functional>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Fonts/FreeSans9pt7b.h>
#include <Fonts/TomThumb.h>

#define SCL_PIN 5
#define SDA_PIN 4

#define BTN_UP_PIN 17
#define BTN_DOWN_PIN 18
#define BTN_SELECT_PIN 0

#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64 
#define OLED_RESET -1 //ไม่มใีปุ่ม reset
#define SCREEN_ADDRESS 0x3C //address of I2C in SSD1306

using namespace std;

struct Srceen_Info {
    const char* name;
    function<void()> action; 
    Srceen_Info* parent;
    Srceen_Info* prev;
    Srceen_Info* next;
    Srceen_Info* child;
    int Choice;
    int page;

    Srceen_Info(const char* n, int p ,function<void()> a = nullptr){
        this->name = n;
        this->page = p;
        this->action = a;
    }

    void addChild(Srceen_Info* c);
    void countChoice();
};

class OLED {
    private:
        Adafruit_SSD1306 _display;
        Srceen_Info* rootNode = nullptr;
        Srceen_Info* NodePointer = nullptr;
        int count = 0;
        int deep = 0;

    public:
        Srceen_Info* ActionPointer = nullptr;
        OLED(TwoWire* wire) : _display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET){};     

        void begin(Srceen_Info* rootN);
        void clear_display();
        void Ap_status();
        void setUp_any(String what_setup, bool state, int dot_count);

        void render() {this->ActionPointer->action();}
        void NextAndPrev(int select);
        void moveDown();
        void moveUp();
        void randerHeader();
        void main_munu(int select = 0);
        void randerEspStatus(int slidePage);
        void randerCamStatus();
        void randerNetwoekStatus(int select);
        void randerWiFiStatus(int slidePage);
        void randerApStatus(int slidePage);
        void randerMQTTStatus(int slidePage);
        void Restart();
        void randerReset(int select);
        void randerResetPopUp(int select);
        void MenuActionReset();
    };

#endif