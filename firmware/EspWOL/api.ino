#include "api.h"
#include "validation.h"
#include "memory.h"

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
  DynamicJsonDocument doc(1024);
  JsonArray array = doc.to<JsonArray>();
  for (const auto &pair : hosts) {
    const Host &host = pair.second;

    JsonObject obj = array.createNestedObject();
    obj["name"] = host.name;
    obj["mac"] = host.mac;
    obj["ip"] = host.ip;
    obj["periodicPing"] = host.periodicPing / 1000;
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
    if (lastPings.find(index) != lastPings.end()) {
      doc["lastPing"] = (millis() - lastPings[index]) / 1000;
    } else {
      doc["lastPing"] = -1;
    }
    serializeJson(doc, jsonResponse);
    server.send(200, "application/json", jsonResponse);
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: POST '/hosts'
static void addHost() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing body\" }");
    return;
  }
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  if (deserializeJson(doc, body)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid JSON\" }");
    return;
  }

  if (!doc.containsKey("name") || !doc.containsKey("mac") || !doc.containsKey("ip") || !doc.containsKey("periodicPing")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing required fields\" }");
    return;
  }
  String name = doc["name"].as<String>();
  String mac = doc["mac"].as<String>();
  String ip = doc["ip"].as<String>();
  if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid data format\" }");
    return;
  }
  long periodicPing = doc["periodicPing"].as<long>();
  if (!isValidPeriodicPing(periodicPing)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid periodicPing value\" }");
    return;
  }
  Host host;
  host.name = name;
  host.mac = mac;
  host.ip = ip;
  host.periodicPing = periodicPing * 1000;
  if (isHostDuplicate(host)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Is duplicated host.\" }");
    return;
  }
  int id = hosts.size();
  hosts[id] = host;
  timers[id] = GTimer<millis>(host.periodicPing, true);
  saveHostsData();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host added\" }");
}

// API: PUT '/hosts?id={index}'
static void editHost(const String &id) {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing body\" }");
    return;
  }
  int index = id.toInt();
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  if (deserializeJson(doc, body)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid JSON\" }");
    return;
  }

  if (!doc.containsKey("name") || !doc.containsKey("mac") || !doc.containsKey("ip") || !doc.containsKey("periodicPing")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing required fields\" }");
    return;
  }

  String name = doc["name"].as<String>();
  String mac = doc["mac"].as<String>();
  String ip = doc["ip"].as<String>();
  if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid data format\" }");
    return;
  }
  long periodicPing = doc["periodicPing"].as<long>();
  if (!isValidPeriodicPing(periodicPing)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid periodicPing value\" }");
    return;
  }

  if (index >= 0 && index < hosts.size()) {
    Host &host = hosts[index];
    host.name = name;
    host.mac = mac;
    host.ip = ip;
    host.periodicPing = periodicPing * 1000;
    if (isHostDuplicate(host)) {
      server.send(400, "application/json", "{ \"success\": false, \"message\": \"Is duplicated host.\" }");
      return;
    }
    if (host.periodicPing) {
      GTimer<millis> &timer = timers[index];
      timer.setTime(host.periodicPing);
      timer.start();
    } else {
      timers.erase(index);
    }
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
    timers.erase(index);
    lastPings.erase(index);
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
          server.send(200, "application/json", "{ \"success\": false, \"message\": \"Failed to send WOL packet\" }");
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
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing body\" }");
    return;
  }
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  if (deserializeJson(doc, body)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid JSON\" }");
    return;
  }
  if (!doc.containsKey("enable") || !doc.containsKey("ip") || !doc.containsKey("networkMask") || !doc.containsKey("gateway")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing required fields\" }");
    return;
  }
  String ip_str = doc["ip"].as<String>();
  String networkMask_str = doc["networkMask"].as<String>();
  String gateway_str = doc["gateway"].as<String>();
  if (!doc["enable"].is<bool>() || !isValidIPAddress(ip_str) || !isValidIPAddress(networkMask_str) || !isValidIPAddress(gateway_str)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid data format\" }");
    return;
  }
  networkConfig.enable = doc["enable"];
  if (networkConfig.enable) {
    IPAddress ip;
    IPAddress networkMask;
    IPAddress gateway;
    ip.fromString(ip_str);
    networkMask.fromString(networkMask_str);
    gateway.fromString(gateway_str);
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
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing body\" }");
    return;
  }
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  if (deserializeJson(doc, body)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid JSON\" }");
    return;
  }
  if (!doc.containsKey("enable") || !doc.containsKey("username") || !doc.containsKey("password")) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing required fields\" }");
    return;
  }
  String username = doc["username"].as<String>();
  String password = doc["password"].as<String>();
  if (!doc["enable"].is<bool>() || username.length() < 3 || !isValidPassword(password)) {
    server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid data format\" }");
    return;
  }
  authentication.enable = doc["enable"];
  if (authentication.enable) {
    authentication.username = username;
    authentication.password = password;
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
    delay(1000);
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

// API: POST '/import'
void handleImportDatabase() {
  if (isAuthenticated()) {
    if (!server.hasArg("plain")) {
      server.send(400, "application/json", "{ \"success\": false, \"message\": \"Missing body\" }");
      return;
    }

    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);

    if (deserializeJson(doc, body)) {
      server.send(400, "application/json", "{ \"success\": false, \"message\": \"Invalid JSON\" }");
      return;
    }

    if (!doc.is<JsonArray>()) {
      server.send(400, "application/json", "{ \"success\": false, \"message\": \"Expected JSON array\" }");
      return;
    }

    JsonArray arr = doc.as<JsonArray>();
    int importedCount = 0;
    int ignoredCount = 0;
    int id;

    for (JsonVariant v : arr) {
      if (!v.containsKey("name") || !v.containsKey("mac") || !v.containsKey("ip")) {
        ignoredCount++;
        continue;
      }

      String name = v["name"].as<String>();
      String mac = v["mac"].as<String>();
      String ip = v["ip"].as<String>();

      if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
        ignoredCount++;
        continue;
      }

      long periodicPing = 0;
      if (v.containsKey("periodicPing")) {
        periodicPing = v["periodicPing"].as<long>();
        if (!isValidPeriodicPing(periodicPing)) {
          periodicPing = 0;
        }
      }

      Host host;
      host.name = name;
      host.mac = mac;
      host.ip = ip;
      host.periodicPing = periodicPing * 1000;

      if (isHostDuplicate(host)) {
        ignoredCount++;
        continue;
      }
      id = hosts.size();
      hosts[id] = host;
      timers[id] = GTimer<millis>(host.periodicPing, true);

      importedCount++;
    }

    saveHostsData();

    char response[256];
    snprintf(response, sizeof(response),
             "{ \"success\": true, \"message\": \"Imported %d hosts from %d. %d hosts ignored. Hosts in database after import: %d.\" }",
             importedCount, arr.size(), ignoredCount, hosts.size());
    server.send(200, "application/json", response);
  }
}
