#include "api.h"

static bool isAuthenticated() {
  if (authentication.enable && !server.authenticate(authentication.username.c_str(), authentication.password.c_str())) {
    server.requestAuthentication();
    return false;
  }
  return true;
}

// API: '/'
void handleRoot() {
  if (isAuthenticated()) {
    server.send_P(200, "text/html", htmlPage);
  }
}

// API: GET '/hosts'
static void getHostList() {
  String jsonResponse;
  StaticJsonDocument<1024> doc;
  JsonArray array = doc.to<JsonArray>();
  for (const Host &host : hosts) {
    JsonObject obj = array.createNestedObject();
    obj["name"] = host.name;
    obj["ip"] = host.ip;
  }
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// API: GET '/hosts?id={index}'
static void getHost(const String &id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    Host &host = hosts[index];
    String jsonResponse;
    StaticJsonDocument<256> doc;
    doc["name"] = host.name;
    doc["mac"] = host.mac;
    doc["ip"] = host.ip;
    doc["periodicPing"] = host.periodicPing / 1000;
    doc["lastPing"] = (millis() - lastPings[index]) / 1000;
    serializeJson(doc, jsonResponse);
    server.send(200, "application/json", jsonResponse);
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: POST '/hosts'
static void addHost() {
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  Host host;
  host.name = doc["name"].as<String>();
  host.mac = doc["mac"].as<String>();
  host.ip = doc["ip"].as<String>();
  host.periodicPing = doc["periodicPing"].as<long>() * 1000;
  hosts[hosts.size()] = host;
  saveHostsData();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host added\" }");
}

// API: PUT '/hosts?id={index}'
static void editHost(const String &id) {
  int index = id.toInt();
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  if (index >= 0 && index < hosts.size()) {
    Host &host = hosts[index];
    host.name = doc["name"].as<String>();
    host.mac = doc["mac"].as<String>();
    host.ip = doc["ip"].as<String>();
    host.periodicPing = doc["periodicPing"].as<long>() * 1000;
    saveHostsData();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host updated\" }");
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: DELETE '/hosts?id={index}'
static void deleteHost(const String &id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    hosts.erase(index);
    saveHostsData();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host deleted\" }");
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

void handleHosts() {
  if (isAuthenticated()) {
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
}

// API: POST '/wake?id={index}'
void handleWakeHost() {
  if (isAuthenticated()) {
    if (server.hasArg("id")) {
      int index = server.arg("id").toInt();
      if (index >= 0 && index < hosts.size()) {
        Host &host = hosts[index];
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
}


// API: POST '/ping?id={index}'
void handlePingHost() {
  if (isAuthenticated()) {
    if (server.hasArg("id")) {
      int index = server.arg("id").toInt();
      if (index >= 0 && index < hosts.size()) {
        Host &host = hosts[index];
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
}

// API: PUT '/networkSettings'
static void updateNetworkSettings() {
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
static void updateAuthenticationSettings() {
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
static void getNetworkSettings() {
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
static void getAuthenticationSettings() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["enable"] = authentication.enable;
  doc["username"] = authentication.username;
  doc["password"] = "************";
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

void handleNetworkSettings() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getNetworkSettings();
    } else if (server.method() == HTTP_PUT) {
      updateNetworkSettings();
    } else {
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
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
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
    }
  }
}

// API: GET '/about'
void handleGetAbout() {
  if (isAuthenticated()) {
    String jsonResponse;
    StaticJsonDocument<256> doc;
    doc["version"] = ota.version();
    doc["lastVersion"] = ota.hasUpdate();
    doc["hostname"] = wifiManager.getWiFiHostname();
    serializeJson(doc, jsonResponse);
    server.send(200, "application/json", jsonResponse);
  }
}

// API: GET '/updateVersion'
static void getInformationToUpdate() {
  String lastVersion;
  String jsonResponse;
  StaticJsonDocument<256> doc;

  ota.checkUpdate(&lastVersion);

  doc["version"] = ota.version();
  doc["lastVersion"] = lastVersion;
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// API: POST '/updateVersion'
static void updateToLastVersion() {
  if (ota.hasUpdate()) {
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Update process will start in 1 second. Please wait for the update to complete.\" }");
    dalay(1000);
    ota.updateNow();
  }
}

void handleUpdateVersion() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getInformationToUpdate();
    } else if (server.method() == HTTP_POST) {
      updateToLastVersion();
    } else {
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
    }
  }
}
