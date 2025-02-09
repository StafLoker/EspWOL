#include "api.h"

// API: '/'
void handleRoot() {
  if (authentication.enable && !server.authenticate(authentication.username.c_str(), authentication.password.c_str())) {
    return server.requestAuthentication();
  }
  server.send_P(200, "text/html", htmlPage);
}

// API: GET '/hosts'
void getHostList() {
  String jsonResponse;
  StaticJsonDocument<1024> doc;
  JsonArray array = doc.to<JsonArray>();
  for (const Host& host : hosts) {
    JsonObject obj = array.createNestedObject();
    obj["name"] = host.name;
    obj["mac"] = host.mac;
    obj["ip"] = host.ip;
  }
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// API: GET '/hosts?id={index}'
void getHost(const String& id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    Host& host = hosts[index];
    String jsonResponse;
    StaticJsonDocument<256> doc;
    doc["name"] = host.name;
    doc["mac"] = host.mac;
    doc["ip"] = host.ip;
    serializeJson(doc, jsonResponse);
    server.send(200, "application/json", jsonResponse);
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: POST '/hosts'
void addHost() {
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  Host host;
  host.name = doc["name"].as<String>();
  host.mac = doc["mac"].as<String>();
  host.ip = doc["ip"].as<String>();
  hosts.push_back(host);
  saveHostsData();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host added\" }");
}

// API: PUT '/hosts?id={index}'
void editHost(const String& id) {
  int index = id.toInt();
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  if (index >= 0 && index < hosts.size()) {
    Host& host = hosts[index];
    host.name = doc["name"].as<String>();
    host.mac = doc["mac"].as<String>();
    host.ip = doc["ip"].as<String>();
    saveHostsData();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host updated\" }");
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: DELETE '/hosts?id={index}'
void deleteHost(const String& id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    hosts.erase(hosts.begin() + index);
    saveHostsData();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host deleted\" }");
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

void handleHosts() {
  if (!server.hasArg("id")) {
    if (server.method() == HTTP_GET) {
      getHostList();
    } else if (server.method() == HTTP_POST) {
      addHost();
    } else {
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
    }
  } else {
    if (server.method() == HTTP_GET) {
      getHost(server.arg("id"));
    } else if (server.method() == HTTP_PUT) {
      editHost(server.arg("id"));
    } else if (server.method() == HTTP_DELETE) {
      deleteHost(server.arg("id"));
    } else {
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
    }
  }
}

// API: POST '/ping?id={index}'
void handleWakeHost() {
  if (server.hasArg("id")) {
    int index = server.arg("id").toInt();
    if (index >= 0 && index < hosts.size()) {
      Host& host = hosts[index];
      if (WOL.sendMagicPacket(host.mac.c_str())) {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"WOL packet sent\" }");
      } else {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"Failed to send WOL packet\" }");
      }
    } else {
      server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
    }
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

// API: POST '/wake?id={index}'
void handlePingHost() {
  if (server.hasArg("id")) {
    int index = server.arg("id").toInt();
    if (index >= 0 && index < hosts.size()) {
      Host& host = hosts[index];
      IPAddress ip;
      ip.fromString(host.ip);
      if (Ping.ping(ip)) {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"Pinging\" }");
      } else {
        server.send(200, "application/json", "{ \"success\": false, \"message\": \"Failed ping\" }");
      }
    } else {
      server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
    }
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

// API: PUT '/networkSettings'
void updateNetworkSettings() {
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  networkConfig.enable = doc["enable"];
  if (networkConfig.enable) {
    IPAddress ip;
    IPAddress networkMask;
    IPAddress gateway;
    ip.fromString(doc["ip"].as<String>());
    networkMask.fromString(doc["networkMask"].as<String>());
    gateway.fromString(doc["gateway"].as<String>());
    networkConfig.ip = ip;
    networkConfig.networkMask = networkMask;
    networkConfig.gateway = gateway;
  }
  saveNetworkConfig();
  updateIPWifiSettings();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Network settings updated\" }");
  delay(100);
  ESP.restart();
}

// API: PUT '/authenticationSettings'
void updateAuthenticationSettings() {
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  authentication.enable = doc["enable"];
  if (authentication.enable) {
    authentication.username = doc["username"].as<String>();
    authentication.password = doc["password"].as<String>();
  }
  saveAuthentication();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Authentication updated\" }");
}

// API: GET '/networkSettings'
void getNetworkSettings() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["enable"] = networkConfig.enable;
  if (networkConfig.enable) {
    doc["ip"] = networkConfig.ip.toString();
    doc["networkMask"] = networkConfig.networkMask.toString();
    doc["gateway"] = networkConfig.gateway.toString();
  } else {
    doc["ip"] = WiFi.localIP().toString();
    doc["networkMask"] = WiFi.subnetMask().toString();
    doc["gateway"] = WiFi.gatewayIP().toString();
  }
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// API: GET '/authenticationSettings'
void getAuthenticationSettings() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["enable"] = authentication.enable;
  doc["username"] = authentication.username;
  doc["password"] = "************";
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

void handleNetworkSettings() {
  if (server.method() == HTTP_GET) {
    getNetworkSettings();
  } else if (server.method() == HTTP_PUT) {
    updateNetworkSettings();
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

void handleAuthenticationSettings() {
  if (server.method() == HTTP_GET) {
    getAuthenticationSettings();
  } else if (server.method() == HTTP_PUT) {
    updateAuthenticationSettings();
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

// API: GET '/about'
void handleGetAbout() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["version"] = VERSION;
  doc["hostname"] = wifiManager.getWiFiHostname();
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

void handleSetPeriodicPing() {
  int index = server.arg("id").toInt();
  unsigned long newPingInterval = server.arg("interval").toInt();

  if (index >= 0 && index < hosts.size()) {
    hosts[index].periodicPing = newPingInterval;
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Periodic ping updated\" }");
  } else {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid host ID\" }");
  }
}