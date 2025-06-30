#include "settings_routes.h"

// =============================================================================
// CONFIGURATION OF CONFIGURATION PATHS
// =============================================================================

void setupSettingsRoutes() {
  server.on(FPSTR(ROUTE_SETTINGS), HTTP_GET, handleGetSettings);
  server.on(FPSTR(ROUTE_SETTINGS_NETWORK), HTTP_ANY, handleNetworkSettings);
  server.on(FPSTR(ROUTE_SETTINGS_AUTH), HTTP_ANY, handleUser);
  server.on(FPSTR(ROUTE_SETTINGS_ABOUT), HTTP_GET, handleGetAbout);
  server.on(FPSTR(ROUTE_SETTINGS_PING), HTTP_ANY, handlePingPeriod);
  server.on(FPSTR(ROUTE_SETTINGS_RESET_WIFI), HTTP_POST, handleResetWiFiSettings);
}

// =============================================================================
// AUXILIARY CONFIGURATION FUNCTIONS
// =============================================================================

void getSettings() {
  JsonDocument doc;
  
  // About information
  JsonObject about = doc.createNestedObject(F("about"));
  about[F("version")] = FPSTR(VERSION);
  about[F("hostname")] = wifiManager.getWiFiHostname();
  
  // Ping period
  doc[F("pingPeriod")] = settings.pingPeriod;
  
  // Network settings
  JsonObject network = doc.createNestedObject(F("network"));
  network[F("enable")] = settings.networkConfig.enable;
  if (settings.networkConfig.enable) {
    network[F("ip")] = settings.networkConfig.ip.toString();
    network[F("networkMask")] = settings.networkConfig.networkMask.toString();
    network[F("gateway")] = settings.networkConfig.gateway.toString();
    network[F("dns")] = settings.networkConfig.dns.toString();
  } else {
    network[F("ip")] = WiFi.localIP().toString();
    network[F("networkMask")] = WiFi.subnetMask().toString();
    network[F("gateway")] = WiFi.gatewayIP().toString();
    network[F("dns")] = WiFi.dnsIP().toString();
  }
  
  sendJsonResponse(200, true, "Settings", doc);
}

void getPingPeriod() {
  JsonDocument doc;
  doc[F("pingPeriod")] = settings.pingPeriod;
  sendJsonResponse(200, true, "Ping period", doc);
}

void updatePingPeriod() {
  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (!doc.containsKey(F("pingPeriod"))) {
    sendJsonResponse(400, false, "Missing pingPeriod field");
    return;
  }

  long pingPeriod = doc[F("pingPeriod")].as<unsigned long>();
  
  if (!isValidPeriodicPing(pingPeriod)) {
    sendJsonResponse(400, false, "Invalid ping period value");
    return;
  }

  settings.pingPeriod = pingPeriod * 1000;
  saveSettings();
  
  pingTimer.setTime(settings.pingPeriod);
  pingTimer.start();

  JsonDocument responseDoc;
  responseDoc[F("pingPeriod")] = settings.pingPeriod;
  sendJsonResponse(200, true, "Ping period updated", responseDoc);
}

void updateNetworkSettings() {
  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (!doc.containsKey(F("enable")) || !doc.containsKey(F("ip")) || !doc.containsKey(F("networkMask")) || !doc.containsKey(F("gateway")) || !doc.containsKey(F("dns"))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_FIELDS));
    return;
  }

  String ip_str = doc[F("ip")].as<String>();
  String networkMask_str = doc[F("networkMask")].as<String>();
  String gateway_str = doc[F("gateway")].as<String>();
  String dns_str = doc[F("dns")].as<String>();

  if (!doc[F("enable")].is<bool>()) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_FORMAT));
    return;
  }

  settings.networkConfig.enable = doc[F("enable")];
  if (settings.networkConfig.enable) {
    if (!isValidIPAddress(ip_str) || !isValidIPAddress(networkMask_str) || !isValidIPAddress(gateway_str) || !isValidIPAddress(dns_str)) {
      sendJsonResponse(400, false, FPSTR(MSG_INVALID_FORMAT));
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
  responseDoc[F("enable")] = settings.networkConfig.enable;
  if (settings.networkConfig.enable) {
    responseDoc[F("ip")] = settings.networkConfig.ip.toString();
    responseDoc[F("networkMask")] = settings.networkConfig.networkMask.toString();
    responseDoc[F("gateway")] = settings.networkConfig.gateway.toString();
    responseDoc[F("dns")] = settings.networkConfig.dns.toString();
  } else {
    responseDoc[F("ip")] = WiFi.localIP().toString();
    responseDoc[F("networkMask")] = WiFi.subnetMask().toString();
    responseDoc[F("gateway")] = WiFi.gatewayIP().toString();
    responseDoc[F("dns")] = WiFi.dnsIP().toString();
  }
  
  sendJsonResponse(200, true, "Network settings updated", responseDoc);
  delay(300);
  ESP.restart();
}

void getNetworkSettings() {
  JsonDocument doc;
  doc[F("enable")] = settings.networkConfig.enable;
  if (settings.networkConfig.enable) {
    doc[F("ip")] = settings.networkConfig.ip.toString();
    doc[F("networkMask")] = settings.networkConfig.networkMask.toString();
    doc[F("gateway")] = settings.networkConfig.gateway.toString();
    doc[F("dns")] = settings.networkConfig.dns.toString();
  } else {
    doc[F("ip")] = WiFi.localIP().toString();
    doc[F("networkMask")] = WiFi.subnetMask().toString();
    doc[F("gateway")] = WiFi.gatewayIP().toString();
    doc[F("dns")] = WiFi.dnsIP().toString();
  }
  sendJsonResponse(200, true, "Network settings", doc);
}

void updateUser() {
  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (!doc.containsKey(F("username")) || !doc.containsKey(F("password"))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_FIELDS));
    return;
  }

  String username = doc[F("username")].as<String>();
  String password = doc[F("password")].as<String>();

  if (username.length() < 3 || !isValidPassword(password)) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_FORMAT));
    return;
  }

  User user = { username, password };
  saveUser(user);

  JsonDocument responseDoc;
  responseDoc[F("username")] = username;
  sendJsonResponse(200, true, "User updated", responseDoc);
}

void getUser() {
  User user = loadUser();
  JsonDocument doc;
  doc[F("username")] = user.username;
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
    doc[F("version")] = FPSTR(VERSION);
    doc[F("hostname")] = wifiManager.getWiFiHostname();
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