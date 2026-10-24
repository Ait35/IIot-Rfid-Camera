#pragma onec
#include "../global_variables.h"

#define ROTARY_ENCODER_PIN_A 1
#define ROTARY_ENCODER_PIN_B 2
#define ROTARY_ENCODER_PSH_PIN -1
#define ROTARY_ENCODER_VCC_PIN -1
#define ROTARY_ENCODER_STEPS 4

#define CONFRIM_PIN 41  
#define BACK_PIN 42

namespace Encoder_panel{
    void initEncoder();
    bool hasChanged();
    int getValue();

    int getValue_confrim();
    int getValue_back();
}