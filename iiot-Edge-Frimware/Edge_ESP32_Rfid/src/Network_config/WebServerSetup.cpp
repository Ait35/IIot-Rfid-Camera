#include "WebServerSetup.h"
#include "global_variables.h"
#include "./Helper/helper.h"

using namespace Helper;

 // ยิง Request ไปขอ status
void WebService::handleStatus() {
    preferences.begin("wifi-creds", true); // โหมดอ่าน
    String savedSSID = preferences.getString("ssid", "");
    preferences.end();

    bool hasSaved = (savedSSID.length() > 0);
    String json = "{\"connected\": false, \"hasSavedCredentials\": " + 
                  String(hasSaved ? "true" : "false") + 
                  ", \"ssid\": \"" + savedSSID + "\"}";
    
    server.send(200, "application/json", json);
}
  // Request ไปขอ scan WiFi
void WebService::handleScan() {
    WiFi.scanDelete();
    int n = WiFi.scanNetworks();
    String json = "[";
    for (int i = 0; i < n; ++i) {
        if (i > 0) json += ",";
        json += "\"" + WiFi.SSID(i) + "\"";
    }
    json += "]";
    
    server.send(200, "application/json", json);
}

void WebService::handleUserMqtt() {
    preferences.begin("mqtt-creds", true); // โหมดอ่าน
    String savedUser = preferences.getString("mqtt_user");
    preferences.end();

    bool hasSaved = (savedUser.length() > 0 && savedUser != "null");
    String json = "{\"connected\": false, \"hasSavedCredentials\": " + 
                  String(hasSaved ? "true" : "false") + 
                  ", \"MqttUser\": \"" + savedUser + "\"}";
    
    server.send(200, "application/json", json);
}

// รับค่า SSID/Password จากหน้าเว็บเพื่อบันทึก
void WebService::handleConnect() {
    String ssid = server.arg("ssid");
    String pass = server.arg("password");

    if (ssid.length() > 0) {
        WiFi.begin(ssid.c_str(), pass.c_str());
        uint32_t startAttemptTime = millis(); 
        Serial.println("Test Connect !");

        // รอเชื่อมต่อ WiFi สูงสุด 10 วินาที
        while (millis() - startAttemptTime < 10000) {
            if (WiFi.status() == WL_CONNECTED) {
                preferences.begin("wifi-creds", false); // โหมดเขียน
                preferences.putString("ssid", ssid);
                preferences.putString("pass", pass);
                preferences.end();
                server.send(200, "application/json", 
                    "{\"ip\": \"" + WiFi.localIP().toString() + "\"}"
                ); // บันทึกเวลาที่เชื่อมต่อสำเร็จ
                shouldRestartForWiFi = true;
                ServerConnectTime = millis();
                break;
            }
            delay(200);
            Serial.print("=");
        }

        server.send(400, "text/plain", "SSID cannot be empty");
    } else {
        server.send(400, "text/plain", "SSID cannot be empty");
    }
}

void WebService::handleConnectServer() {
    String income_key_api = server.arg("key_api");

    if (income_key_api.length() > 0) {
        preferences.begin("key_api-creds", false); // โหมดเขียน
        preferences.putString("key_api", income_key_api);
        preferences.end();
        server.send(200, "text/plain", "Saved successfully");
        
        delay(1000);
        ESP.restart(); // restart เพื่อเริ่มใหม่
    } else {
        server.send(400, "text/plain", "key api cannot be empty");
    }
}

void WebService::handleConnectMqtt() {
    String mqtt_pass = server.arg("mqtt_pass");
    
    // โหมดเขียน (บันทึกลง Preferences กลุ่มใหม่ชื่อ "mqtt-creds")
    Serial.println("User : " + mqtt_info.userMqtt + ", Pass: " + mqtt_pass);
    preferences.begin("mqtt-creds", false); // โหมดเขียน
    preferences.putString("mqtt_pass", mqtt_pass);
    preferences.end(); // ปิดการเขียน Preferences
    mqtt_info.passMqtt = mqtt_pass ;
    
    server.send(200, "text/plain", "MQTT Saved successfully");
    ServerConnectTime = millis();
    while((millis() - ServerConnectTime) < 1500) {
        Serial.print('=');
        delay(10);
    }
    Serial.println("\nRestarting now!");
    ESP.restart();
}

void WebService::handleLogout(){
    claer_ALL_EEprom("wifi-creds");

    server.send(200, "text/plain", "Cleared");
    delay(1000);
    ESP.restart(); // restart เพื่อเริ่มใหม่ จะได้เรียก AP
}

void WebService::handleReset_key_api(){
    claer_ALL_EEprom("key_api-creds");
    server.send(200, "text/plain", "Cleared");
    
    delay(1000);
    ESP.restart(); // restart เพื่อเริ่มใหม่ จะได้เรียก api ใหม่
}

void WebService::setupWebServer() {
    Serial.println("Starting WebServer for WiFi setup...");
    if (!LittleFS.begin(true)) {
        Serial.println("An Error has occurred while mounting LittleFS");
        return;
    }

    // Server ส่งไฟล์ HTML/CSS/JS อัตโนมัติเมื่อมี request
    server.serveStatic("/", LittleFS, "/web_connet/index.html");
    server.serveStatic("/style.css", LittleFS, "/web_connet/style.css");
    server.serveStatic("/script.js", LittleFS, "/web_connet/script.js");

    server.on("/status", HTTP_GET, handleStatus);
    server.on("/scan", HTTP_GET, handleScan);
    server.on("/getUserMqtt", HTTP_GET, handleUserMqtt);
    server.on("/connect", HTTP_POST, handleConnect);
    server.on("/connectSever", HTTP_POST, handleConnectServer);
    server.on("/connectMqtt", HTTP_POST, handleConnectMqtt);
    server.on("/resetKey_Api", HTTP_POST, handleReset_key_api);
    server.on("/logout", HTTP_POST, handleLogout);

    Serial.println("HTTP server started");
}


void WebService::loopWebServer() {
    server.handleClient(); // คอยฟังสัญญาณ HTTP จาก Client

        // 3. ย้ายการเช็กเวลาสั่ง Restart มาไว้ตรงนี้ (Non-blocking)
    if (shouldRestartForWiFi && (millis() - ServerConnectTime > 5000)) {
        Serial.println("Restarting now!");
        ESP.restart();      // restart เพื่อจะได้เิอาค่าจาก EEprom 
    } 
}