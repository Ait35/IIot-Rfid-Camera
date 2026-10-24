#pragma once
#include "./global_variables.h"

namespace Rfid{
    inline unsigned long lastByteTime ;

    bool readRfid() ;
    void chackType();
    int get_distance(int rssiRaw);
    void parsedFrame();

}
   
   