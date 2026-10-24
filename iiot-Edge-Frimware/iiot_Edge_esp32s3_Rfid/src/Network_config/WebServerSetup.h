#include "global_variables.h"
#include "./Helper/helper.h"

using namespace Helper;

WebServer server(80);
bool shouldRestartForWiFi = false;

 // ยิง Request ไปขอ status
void handleStatus() {
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
void handleScan() {
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

// รับค่า SSID/Password จากหน้าเว็บเพื่อบันทึก
void handleConnect() {
    String ssid = server.arg("ssid");
    String pass = server.arg("password");

    if (ssid.length() > 0) {
        preferences.begin("wifi-creds", false); // โหมดเขียน
        preferences.putString("ssid", ssid);
        preferences.putString("pass", pass);
        preferences.end();

        server.send(200, "text/plain", "Saved successfully");

        shouldRestartForWiFi = true;
        ServerConnectTime = millis();
    } else {
        server.send(400, "text/plain", "SSID cannot be empty");
    }
}

void handleConnectServer() {
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

void handleIsConnected(){
    if (WiFi.status() == WL_CONNECTED) {
        server.send(200, "application/json", 
            "{\"ip\": \"" + WiFi.localIP().toString() + "\"}");
        IsWedGetIP = true;
        return;
    }
    server.send(200, "application/json", "{\"ip\" : \"\"}");
}

void handleLogout(){
    claer_ALL_EEprom("wifi-creds");

    server.send(200, "text/plain", "Cleared");
    delay(1000);
    ESP.restart(); // restart เพื่อเริ่มใหม่ จะได้เรียก AP
}

void handleReset_key_api(){
    claer_ALL_EEprom("key_api-creds");
    server.send(200, "text/plain", "Cleared");
    
    delay(1000);
    ESP.restart(); // restart เพื่อเริ่มใหม่ จะได้เรียก api ใหม่
}

void setupWebServer() {
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
    server.on("/connect", HTTP_POST, handleConnect);
    server.on("/connectSever", HTTP_POST, handleConnectServer);
    server.on("/is_connected", HTTP_GET, handleIsConnected);
    server.on("/resetKey_Api", HTTP_POST, handleReset_key_api);
    server.on("/logout", HTTP_POST, handleLogout);

    Serial.println("HTTP server started");
}


void loopWebServer() {
    server.handleClient(); // คอยฟังสัญญาณ HTTP จาก Client

        // 3. ย้ายการเช็กเวลาสั่ง Restart มาไว้ตรงนี้ (Non-blocking)
    if (shouldRestartForWiFi && (millis() - ServerConnectTime > 2000)) {
        Serial.println("Restarting now!");
        ESP.restart();      // restart เพื่อจะได้เิอาค่าจาก EEprom 
    } 
}