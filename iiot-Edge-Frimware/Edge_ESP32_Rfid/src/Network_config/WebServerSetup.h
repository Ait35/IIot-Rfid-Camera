#pragma once

namespace WebService {
    void handleStatus();
    void handleScan();
    void handleUserMqtt();
    void handleConnect();
    void handleConnectServer();
    void handleConnectMqtt();
    void handleLogout();
    void handleReset_key_api();
    void setupWebServer();
    void loopWebServer();
}

// WebServer server(80);
// bool shouldRestartForWiFi = false;
