#include "settings_routes.h"
#include "routes.h"
#include "repository.h"
#include "validation.h"
#include <ESP8266WiFi.h>
#include <WiFiManager.h>

extern WiFiManager wifiManager;
extern void updateIPWifiSettings();

// =============================================================================
// CONFIGURACIÓN DE RUTAS DE CONFIGURACIÓN
// =============================================================================

void setupSettingsRoutes() {
  server.on("/settings/network", HTTP_ANY, handleNetworkSettings);
  server.on("/settings/auth", HTTP_ANY, handleUser);
  server.on("/settings/about", HTTP_GET, handleGetAbout);
  server.on("/settings/reset_wifi", HTTP_POST, handleResetWiFiSettings);
}

// =============================================================================
// FUNCIONES AUXILIARES DE CONFIGURACIÓN
// =============================================================================

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
  sendJsonResponse(200, true, "Network settings updated");
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
  sendJsonResponse(200, doc);
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

  User user = { username, password }

  saveUser(user);

  sendJsonResponse(200, true, "User updated");
}

void getUser() {
  extern Authentication authentication;
  JsonDocument doc;
  doc["enable"] = authentication.enable;
  doc["username"] = authentication.username;
  sendJsonResponse(200, doc);
}

// =============================================================================
// RUTAS DE CONFIGURACIÓN
// =============================================================================

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

void handleResetWiFiSettings() {
  if (isAuthenticated()) {
    sendJsonResponse(200, true, "WiFi settings have been reset successfully.");
    delay(300);
    wifiManager.resetSettings();
    ESP.restart();
  }
}