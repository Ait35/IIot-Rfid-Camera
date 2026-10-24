#pragma onec
#include "../global_variables.h"

#define ROTARY_ENCODER_PIN_A 35
#define ROTARY_ENCODER_PIN_B 26
#define ROTARY_ENCODER_PSH_PIN -1
#define ROTARY_ENCODER_VCC_PIN -1
#define ROTARY_ENCODER_STEPS 4

#define CONFRIM_PIN 34
#define BACK_PIN 27

namespace Encoder_panel{
    void initEncoder();
    bool hasChanged();
    int getValue();

    int getValue_confrim();
    int getValue_back();
}