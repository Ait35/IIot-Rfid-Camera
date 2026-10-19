#include "global_variables.h"
#include "./Secret/secret.h"
#pragma once

namespace Helper {
    String setDeviceId();
    bool checkMemory_SSID_Pass();
    String checkMemory_key_api();
    String gettime();
    String getEEprom(String name , String key = "");
    void claer_ALL_EEprom(String name);
    String getUpTime(unsigned long ms);
};
