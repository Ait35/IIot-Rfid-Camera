#include "./global_variables.h"
#include "camra.h"

void Camera::setupCamera()
{
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // ตรวจสอบ PSRAM
    if (psramFound())
    {
    Serial.println("PSRAM found. Using High Resolution.");
    config.frame_size = FRAMESIZE_UXGA; // 1600x1200
    config.jpeg_quality = 10;
    config.fb_count = 3;
    config.grab_mode = CAMERA_GRAB_LATEST;
    }
    else
    {
    Serial.println("WARNING: PSRAM not found. Using Low Resolution.");
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM;
    }

    // Initialize Camera
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK)
    {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return;
    }
}

// ใน camra.cpp
camera_fb_t* Camera::capture()
{
    camera_fb_t *img = esp_camera_fb_get();
    if (!img) {
        Serial.println("❌ Camera capture failed");
        return NULL;
    }
    Serial.println("✅ Camera captured");
    countImage++;
    return img;
}

void Camera::clearImageBuffer()
{
    if(image_info.img == NULL){
        Serial.println("❌ No image buffer to clear");
        return;
    }
    //คืน Memory ลง Buffer
    esp_camera_fb_return(image_info.img);
    image_info.img = NULL; // เคลียร์เป็น NULL กันลั่นซ้ำสอง
    Serial.println("deleted Image Buffer");
}
