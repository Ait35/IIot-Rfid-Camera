#include "panel.h"

void IRAM_ATTR interrup_ReadEncoder(){
    encoder.readEncoder_ISR();
}

void Encoder_panel::initEncoder()
{
    encoder.begin();
    encoder.setup(interrup_ReadEncoder);
    encoder.setAcceleration(250);
}

bool  Encoder_panel::hasChanged(){
    return encoder.encoderChanged();
}

int Encoder_panel::getValue()
{
    return encoder.readEncoder();
}

int Encoder_panel::getValue_confrim()
{
    return digitalRead(CONFRIM_PIN);
}

int Encoder_panel::getValue_back()
{
    return digitalRead(BACK_PIN);
}
