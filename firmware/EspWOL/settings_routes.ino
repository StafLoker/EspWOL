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
  server.on("/networkSettings", HTTP_ANY, handleNetworkSettings);
  server.on("/authenticationSettings", HTTP_ANY, handleAuthenticationSettings);
  server.on("/about", HTTP_GET, handleGetAbout);
  server.on("/resetWifi", HTTP_POST, handleResetWiFiSettings);
}

// =============================================================================
// FUNCIONES AUXILIARES DE CONFIGURACIÓN
// =============================================================================

void updateNetworkSettings() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  if (!doc.containsKey("enable") || !doc.containsKey("ip") || !doc.containsKey("networkMask") || !doc.containsKey("gateway") || !doc.containsKey("dns")) {
    sendJsonResponse(400, "Missing required fields", false);
    return;
  }

  extern NetworkConfig networkConfig;
  String ip_str = doc["ip"].as<String>();
  String networkMask_str = doc["networkMask"].as<String>();
  String gateway_str = doc["gateway"].as<String>();
  String dns_str = doc["dns"].as<String>();

  if (!doc["enable"].is<bool>()) {
    sendJsonResponse(400, "Invalid data format", false);
    return;
  }
  
  networkConfig.enable = doc["enable"];
  if (networkConfig.enable) {
    if (!isValidIPAddress(ip_str) || !isValidIPAddress(networkMask_str) || !isValidIPAddress(gateway_str) || !isValidIPAddress(dns_str)) {
      sendJsonResponse(400, "Invalid data format", false);
      return;
    }
    
    IPAddress ip, networkMask, gateway, dns;
    ip.fromString(ip_str);
    networkMask.fromString(networkMask_str);
    gateway.fromString(gateway_str);
    dns.fromString(dns_str);
    
    networkConfig.ip = ip;
    networkConfig.networkMask = networkMask;
    networkConfig.gateway = gateway;
    networkConfig.dns = dns;
  }
  
  saveNetworkConfig();
  updateIPWifiSettings();
  sendJsonResponse(200, "Network settings updated", true);
  delay(300);
  ESP.restart();
}

void getNetworkSettings() {
  extern NetworkConfig networkConfig;
  JsonDocument doc;
  doc["enable"] = networkConfig.enable;
  if (networkConfig.enable) {
    doc["ip"] = networkConfig.ip.toString();
    doc["networkMask"] = networkConfig.networkMask.toString();
    doc["gateway"] = networkConfig.gateway.toString();
    doc["dns"] = networkConfig.dns.toString();
  } else {
    doc["ip"] = WiFi.localIP().toString();
    doc["networkMask"] = WiFi.subnetMask().toString();
    doc["gateway"] = WiFi.gatewayIP().toString();
    doc["dns"] = WiFi.dnsIP().toString();
  }
  sendJsonResponse(200, doc);
}

void updateAuthenticationSettings() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  if (!doc.containsKey("enable") || !doc.containsKey("username") || !doc.containsKey("password")) {
    sendJsonResponse(400, "Missing required fields", false);
    return;
  }

  extern Authentication authentication;
  String username = doc["username"].as<String>();
  String password = doc["password"].as<String>();
  
  if (!doc["enable"].is<bool>()) {
    sendJsonResponse(400, "Invalid data format", false);
    return;
  }
  
  authentication.enable = doc["enable"];
  if (authentication.enable) {
    if (username.length() < 3 || !isValidPassword(password)) {
      sendJsonResponse(400, "Invalid data format", false);
      return;
    }
    authentication.username = username;
    authentication.password = password;
  }
  
  saveAuthentication();
  sendJsonResponse(200, "Authentication updated", true);
}

void getAuthenticationSettings() {
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
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

void handleAuthenticationSettings() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getAuthenticationSettings();
    } else if (server.method() == HTTP_PUT) {
      updateAuthenticationSettings();
    } else {
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

void handleGetAbout() {
  if (isAuthenticated()) {
    JsonDocument doc;
    doc["version"] = VERSION;
    doc["hostname"] = wifiManager.getWiFiHostname();
    sendJsonResponse(200, doc);
  }
}

void handleResetWiFiSettings() {
  if (isAuthenticated()) {
    sendJsonResponse(200, "WiFi settings have been reset successfully.", true);
    wifiManager.resetSettings();
    ESP.restart();
  }
}