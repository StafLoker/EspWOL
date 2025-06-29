#include "settings_routes.h"

// =============================================================================
// CONFIGURATION OF CONFIGURATION PATHS
// =============================================================================

void setupSettingsRoutes() {
  server.on("/settings", HTTP_GET, handleGetSettings);
  server.on("/settings/network", HTTP_ANY, handleNetworkSettings);
  server.on("/settings/auth", HTTP_ANY, handleUser);
  server.on("/settings/about", HTTP_GET, handleGetAbout);
  server.on("/settings/ping_period", HTTP_ANY, handlePingPeriod);
  server.on("/settings/reset_wifi", HTTP_POST, handleResetWiFiSettings);
}

// =============================================================================
// AUXILIARY CONFIGURATION FUNCTIONS
// =============================================================================

void getSettings() {
  JsonDocument doc;
  
  // About information
  JsonObject about = doc.createNestedObject("about");
  about["version"] = VERSION;
  about["hostname"] = wifiManager.getWiFiHostname();
  
  // Ping period
  doc["pingPeriod"] = settings.pingPeriod;
  
  // Network settings
  JsonObject network = doc.createNestedObject("network");
  network["enable"] = settings.networkConfig.enable;
  if (settings.networkConfig.enable) {
    network["ip"] = settings.networkConfig.ip.toString();
    network["networkMask"] = settings.networkConfig.networkMask.toString();
    network["gateway"] = settings.networkConfig.gateway.toString();
    network["dns"] = settings.networkConfig.dns.toString();
  } else {
    network["ip"] = WiFi.localIP().toString();
    network["networkMask"] = WiFi.subnetMask().toString();
    network["gateway"] = WiFi.gatewayIP().toString();
    network["dns"] = WiFi.dnsIP().toString();
  }
  
  sendJsonResponse(200, true, "Settings", doc);
}

void getPingPeriod() {
  JsonDocument doc;
  doc["pingPeriod"] = settings.pingPeriod;
  sendJsonResponse(200, true, "Ping period", doc);
}

void updatePingPeriod() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  if (!doc.containsKey("pingPeriod")) {
    sendJsonResponse(400, false, "Missing pingPeriod field");
    return;
  }

  long pingPeriod = doc["pingPeriod"].as<unsigned long>();
  
  if (!isValidPeriodicPing(pingPeriod)) {
    sendJsonResponse(400, false, "Invalid ping period value");
    return;
  }

  settings.pingPeriod = pingPeriod * 1000;
  saveSettings();
  
  pingTimer.setTime(settings.pingPeriod);
  pingTimer.start();

  JsonDocument responseDoc;
  responseDoc["pingPeriod"] = settings.pingPeriod;
  sendJsonResponse(200, true, "Ping period updated", responseDoc);
}

void updateNetworkSettings() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  if (!doc.containsKey("enable") || !doc.containsKey("ip") || !doc.containsKey("networkMask") || !doc.containsKey("gateway") || !doc.containsKey("dns")) {
    sendJsonResponse(400, false, "Missing required fields");
    return;
  }

  String ip_str = doc["ip"].as<String>();
  String networkMask_str = doc["networkMask"].as<String>();
  String gateway_str = doc["gateway"].as<String>();
  String dns_str = doc["dns"].as<String>();

  if (!doc["enable"].is<bool>()) {
    sendJsonResponse(400, false, "Invalid data format");
    return;
  }

  settings.networkConfig.enable = doc["enable"];
  if (settings.networkConfig.enable) {
    if (!isValidIPAddress(ip_str) || !isValidIPAddress(networkMask_str) || !isValidIPAddress(gateway_str) || !isValidIPAddress(dns_str)) {
      sendJsonResponse(400, false, "Invalid data format");
      return;
    }

    IPAddress ip, networkMask, gateway, dns;
    ip.fromString(ip_str);
    networkMask.fromString(networkMask_str);
    gateway.fromString(gateway_str);
    dns.fromString(dns_str);

    settings.networkConfig.ip = ip;
    settings.networkConfig.networkMask = networkMask;
    settings.networkConfig.gateway = gateway;
    settings.networkConfig.dns = dns;
  }

  saveSettings();
  updateIPWifiSettings();

  JsonDocument responseDoc;
  responseDoc["enable"] = settings.networkConfig.enable;
  if (settings.networkConfig.enable) {
    responseDoc["ip"] = settings.networkConfig.ip.toString();
    responseDoc["networkMask"] = settings.networkConfig.networkMask.toString();
    responseDoc["gateway"] = settings.networkConfig.gateway.toString();
    responseDoc["dns"] = settings.networkConfig.dns.toString();
  } else {
    responseDoc["ip"] = WiFi.localIP().toString();
    responseDoc["networkMask"] = WiFi.subnetMask().toString();
    responseDoc["gateway"] = WiFi.gatewayIP().toString();
    responseDoc["dns"] = WiFi.dnsIP().toString();
  }
  
  sendJsonResponse(200, true, "Network settings updated", responseDoc);
  delay(300);
  ESP.restart();
}

void getNetworkSettings() {
  JsonDocument doc;
  doc["enable"] = settings.networkConfig.enable;
  if (settings.networkConfig.enable) {
    doc["ip"] = settings.networkConfig.ip.toString();
    doc["networkMask"] = settings.networkConfig.networkMask.toString();
    doc["gateway"] = settings.networkConfig.gateway.toString();
    doc["dns"] = settings.networkConfig.dns.toString();
  } else {
    doc["ip"] = WiFi.localIP().toString();
    doc["networkMask"] = WiFi.subnetMask().toString();
    doc["gateway"] = WiFi.gatewayIP().toString();
    doc["dns"] = WiFi.dnsIP().toString();
  }
  sendJsonResponse(200, true, "Network settings", doc);
}

void updateUser() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  if (!doc.containsKey("username") || !doc.containsKey("password")) {
    sendJsonResponse(400, false, "Missing required fields");
    return;
  }

  String username = doc["username"].as<String>();
  String password = doc["password"].as<String>();

  if (username.length() < 3 || !isValidPassword(password)) {
    sendJsonResponse(400, false, "Invalid data format");
    return;
  }

  User user = { username, password };

  saveUser(user);

  // Devolver el nuevo username
  JsonDocument responseDoc;
  responseDoc["username"] = username;
  sendJsonResponse(200, true, "User updated", responseDoc);
}

void getUser() {
  User user = loadUser();
  JsonDocument doc;
  doc["username"] = user.username;
  sendJsonResponse(200, true, "User", doc);
}

// =============================================================================
// CONFIGURATION ROUTES
// =============================================================================

void handleGetSettings() {
  if (isAuthenticated()) {
    getSettings();
  }
}

void handleNetworkSettings() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getNetworkSettings();
    } else if (server.method() == HTTP_PUT) {
      updateNetworkSettings();
    } else {
      sendJsonResponse(405, false, "HTTP Method Not Allowed");
    }
  }
}

void handleUser() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getUser();
    } else if (server.method() == HTTP_PUT) {
      updateUser();
    } else {
      sendJsonResponse(405, false, "HTTP Method Not Allowed");
    }
  }
}

void handleGetAbout() {
  if (isAuthenticated()) {
    JsonDocument doc;
    doc["version"] = VERSION;
    doc["hostname"] = wifiManager.getWiFiHostname();
    sendJsonResponse(200, true, "App general information", doc);
  }
}

void handleUpdatePingPeriod() {
  if (isAuthenticated()) {
    updatePingPeriod();
  }
}

void handlePingPeriod() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getPingPeriod();
    } else if (server.method() == HTTP_PUT) {
      updatePingPeriod();
    } else {
      sendJsonResponse(405, false, "HTTP Method Not Allowed");
    }
  }
}

void handleResetWiFiSettings() {
  if (isAuthenticated()) {
    sendJsonResponse(200, true, "WiFi settings have been reset successfully.");
    delay(300);
    wifiManager.resetSettings();
    ESP.restart();
  }
}