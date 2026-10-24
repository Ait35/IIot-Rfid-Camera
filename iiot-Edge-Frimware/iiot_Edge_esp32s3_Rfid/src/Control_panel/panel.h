#pragma once
#include "../global_variables.h"
#include "../OLED/oled.tree.h"

namespace panel{
    void handleButtons() {
        static unsigned long lastDebounce = 0;
        static unsigned long selectPressTime = 0;
        static bool selectPressed = false;

        if (digitalRead(BTN_UP_PIN) == LOW) {
            if (millis() - lastDebounce > 200) {
                lastDebounce = millis();
                int maxLimit = 
                (oled.ActionPointer->child != nullptr) ? oled.ActionPointer->Choice : (oled.ActionPointer->page - 1);

                if (maxLimit < 0) maxLimit = 0;

                select_at--;
                if (select_at < 0) select_at = maxLimit; 

                Serial.println("⬆️ UP: " + String(select_at));
                if (oled.ActionPointer->child != nullptr) {
                    oled.NextAndPrev(select_at);
                }
            }
        }

        if (digitalRead(BTN_DOWN_PIN) == LOW) {
            if (millis() - lastDebounce > 200) {
                lastDebounce = millis();
                int maxLimit = (oled.ActionPointer->child != nullptr) ? oled.ActionPointer->Choice : (oled.ActionPointer->page - 1);
                if (maxLimit < 0) maxLimit = 0;

                select_at++;
                if (select_at > maxLimit) select_at = 0;

                Serial.println("⬇️ DOWN: " + String(select_at));
                if (oled.ActionPointer->child != nullptr) {
                    oled.NextAndPrev(select_at);
                }
            }
        }

        if (digitalRead(BTN_SELECT_PIN) == LOW) {
            if (!selectPressed) {
                selectPressed = true;
                selectPressTime = millis();
            }
        } else {
            if (selectPressed) {
                unsigned long duration = millis() - selectPressTime;
                selectPressed = false;

                if (duration >= 600) {
                    // กดค้างเกิน 0.6 วินาที = BACK (ถอยกลับ)
                    Serial.println("🔙 Long Press -> BACK");
                    oled.moveUp();
                } else if (duration >= 50) {
                    // กดสั้น = SELECT (ถ้ามีเมนูย่อยให้เข้า ถ้าเป็นหน้าสุดท้ายให้กดย้อนกลับ)
                    Serial.println("🔘 Short Press -> SELECT");
                    if (oled.ActionPointer->child != nullptr) {
                        oled.moveDown();
                    } else {
                        oled.moveUp();
                    }
                }
            }
        }
    }
}
