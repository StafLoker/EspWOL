#include "api.h"
#include "validation.h"
#include "memory.h"

static void sendJsonResponse(int statusCode, const String &message, bool success) {
  String jsonResponse;
  jsonResponse = String("{\"success\":") + (success ? "true" : "false") + ",\"message\":\"" + message + "\"}";
  server.send(statusCode, "application/json", jsonResponse);
}

static void sendJsonResponse(int statusCode, const JsonDocument &doc) {
  String jsonResponse;
  serializeJson(doc, jsonResponse);
  server.send(statusCode, "application/json", jsonResponse);
}

static bool validateHostData(const JsonDocument &doc, String &name, String &mac, String &ip, long &periodicPing) {
  if (!doc.containsKey("name") || !doc.containsKey("mac") || !doc.containsKey("ip") || !doc.containsKey("periodicPing")) {
    sendJsonResponse(400, "Missing required fields", false);
    return false;
  }

  name = doc["name"].as<String>();
  mac = doc["mac"].as<String>();
  ip = doc["ip"].as<String>();
  periodicPing = doc["periodicPing"].as<long>();

  if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip) || !isValidPeriodicPing(periodicPing)) {
    sendJsonResponse(400, "Invalid data format", false);
    return false;
  }

  return true;
}

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
  JsonDocument doc;
  JsonArray array = doc.to<JsonArray>();
  for (const auto &pair : hosts) {
    const Host &host = pair.second;

    JsonObject obj = array.createNestedObject();
    obj["name"] = host.name;
    obj["mac"] = host.mac;
    obj["ip"] = host.ip;
    obj["periodicPing"] = host.periodicPing / 1000;
  }
  sendJsonResponse(200, doc);
}

// API: GET '/hosts?id={index}'
static void getHost(const String &id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    Host &host = hosts[index];
    JsonDocument doc;
    doc["name"] = host.name;
    doc["mac"] = host.mac;
    doc["ip"] = host.ip;
    doc["periodicPing"] = host.periodicPing / 1000;
    if (lastPings.find(index) != lastPings.end()) {
      doc["lastPing"] = (millis() - lastPings[index]) / 1000;
    } else {
      doc["lastPing"] = -1;
    }
    sendJsonResponse(200, doc);
  } else {
    sendJsonResponse(400, "Host not found", false);
  }
}

// API: POST '/hosts'
static void addHost() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  String name, mac, ip;
  long periodicPing;
  if (!validateHostData(doc, name, mac, ip, periodicPing)) return;

  Host host = { name, mac, ip, periodicPing * 1000 };

  if (isHostDuplicate(host)) {
    sendJsonResponse(400, "Duplicate host", false);
    return;
  }

  int id = hosts.size();
  hosts[id] = host;
  if (host.periodicPing) {
    timers[id] = GTimer<millis>(host.periodicPing, true);
  }

  saveHostsData();
  sendJsonResponse(200, "Host added", true);
}

// API: PUT '/hosts?id={index}'
static void editHost(const String &id) {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  int index = id.toInt();
  if (index < 0 || index >= hosts.size()) {
    sendJsonResponse(400, "Host not found", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  String name, mac, ip;
  long periodicPing;
  if (!validateHostData(doc, name, mac, ip, periodicPing)) return;

  Host &host = hosts[index];
  host.name = name;
  host.mac = mac;
  host.ip = ip;
  host.periodicPing = periodicPing * 1000;

  if (host.periodicPing) {
    GTimer<millis> &timer = timers[index];
    timer.setTime(host.periodicPing);
    timer.start();
  } else {
    timers.erase(index);
  }

  saveHostsData();
  sendJsonResponse(200, "Host updated", true);
}

// API: DELETE '/hosts?id={index}'
static void deleteHost(const String &id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    hosts.erase(index);
    timers.erase(index);
    lastPings.erase(index);
    saveHostsData();
    sendJsonResponse(200, "Host deleted", true);
  } else {
    sendJsonResponse(400, "Host not found", false);
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
        sendJsonResponse(405, "HTTP Method Not Allowed", false);
      }
    } else {
      if (server.method() == HTTP_GET) {
        getHost(server.arg("id"));
      } else if (server.method() == HTTP_PUT) {
        editHost(server.arg("id"));
      } else if (server.method() == HTTP_DELETE) {
        deleteHost(server.arg("id"));
      } else {
        sendJsonResponse(405, "HTTP Method Not Allowed", false);
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
        if (wol.sendMagicPacket(host.mac.c_str())) {
          sendJsonResponse(200, "WOL packet sent", true);
        } else {
          sendJsonResponse(200, "Failed to send WOL packet", false);
        }
      } else {
        sendJsonResponse(400, "Host not found", false);
      }
    } else {
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
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
        if (Ping.ping(ip, 3)) {
          sendJsonResponse(200, "Pinging", true);
        } else {
          sendJsonResponse(200, "Failed ping", false);
        }
      } else {
        sendJsonResponse(400, "Host not found", false);
      }
    } else {
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

// API: PUT '/networkSettings'
static void updateNetworkSettings() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "Invalid JSON", false);
    return;
  }

  if (!doc.containsKey("enable") || !doc.containsKey("ip") || !doc.containsKey("networkMask") || !doc.containsKey("gateway")) {
    sendJsonResponse(400, "Missing required fields", false);
    return;
  }
  String ip_str = doc["ip"].as<String>();
  String networkMask_str = doc["networkMask"].as<String>();
  String gateway_str = doc["gateway"].as<String>();

  if (!doc["enable"].is<bool>()) {
    sendJsonResponse(400, "Invalid data format", false);
    return;
  }
  networkConfig.enable = doc["enable"];
  if (networkConfig.enable) {
    if (!isValidIPAddress(ip_str) || !isValidIPAddress(networkMask_str) || !isValidIPAddress(gateway_str)) {
      sendJsonResponse(400, "Invalid data format", false);
      return;
    }
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
  sendJsonResponse(200, "Network settings updated", true);
  delay(300);
  ESP.restart();
}

// API: PUT '/authenticationSettings'
static void updateAuthenticationSettings() {
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

// API: GET '/networkSettings'
static void getNetworkSettings() {
  JsonDocument doc;
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
  sendJsonResponse(200, doc);
}

// API: GET '/authenticationSettings'
static void getAuthenticationSettings() {
  JsonDocument doc;
  doc["enable"] = authentication.enable;
  doc["username"] = authentication.username;
  sendJsonResponse(200, doc);
}

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

static const char *errorToString(AutoOTA::Error error) {
  switch (error) {
    case AutoOTA::Error::None: return "No error";
    case AutoOTA::Error::Connect: return "Connection failed";
    case AutoOTA::Error::Timeout: return "Timeout";
    case AutoOTA::Error::HTTP: return "HTTP error";
    case AutoOTA::Error::NoVersion: return "No version found";
    case AutoOTA::Error::NoPlatform: return "Platform not supported";
    case AutoOTA::Error::NoPath: return "No path found";
    case AutoOTA::Error::NoUpdates: return "No updates available";
    case AutoOTA::Error::NoFile: return "File not found";
    case AutoOTA::Error::OtaStart: return "OTA start failed";
    case AutoOTA::Error::OtaEnd: return "OTA end failed";
    case AutoOTA::Error::PathError: return "Invalid path";
    case AutoOTA::Error::NoPort: return "No port specified";
    default: return "Unknown error";
  }
}

static bool checkUpdate(String *version = nullptr, String *notes = nullptr, String *bin = nullptr) {
  ota.checkUpdate(version, notes, bin);
  if (ota.hasError() && ota.getError() != AutoOTA::Error::NoUpdates) {
    sendJsonResponse(400, String("Check update error: ") + errorToString(ota.getError()), false);
    return false;
  }
  return true;
}

// API: GET '/about'
void handleGetAbout() {
  if (isAuthenticated()) {
    JsonDocument doc;

    if (!checkUpdate()) {
      return;
    }

    doc["version"] = ota.version();
    doc["lastVersion"] = !ota.hasUpdate();
    doc["hostname"] = wifiManager.getWiFiHostname();

    sendJsonResponse(200, doc);
  }
}

// API: GET '/updateVersion'
static void getInformationToUpdate() {
  JsonDocument doc;

  String lastVersion;
  if (!checkUpdate(&lastVersion)) {
    return;
  }

  doc["version"] = ota.version();
  doc["lastVersion"] = lastVersion;
  sendJsonResponse(200, doc);
}

// API: POST '/updateVersion'
static void updateToLastVersion() {
  if (!checkUpdate()) {
    return;
  }
  if (ota.hasUpdate()) {
    sendJsonResponse(200, "Update process will start in 1 second. Please wait for the update to complete.", true);
    delay(500);
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
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

// API: POST '/import'
void handleImportDatabase() {
  if (isAuthenticated()) {
    if (!server.hasArg("plain")) {
      sendJsonResponse(400, "Missing body", false);
      return;
    }

    JsonDocument doc;
    if (deserializeJson(doc, server.arg("plain"))) {
      sendJsonResponse(400, "Invalid JSON", false);
      return;
    }

    if (!doc.is<JsonArray>()) {
      sendJsonResponse(400, "Expected JSON array", false);
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

      long periodicPing = v.containsKey("periodicPing") ? v["periodicPing"].as<long>() : 0;
      if (!isValidPeriodicPing(periodicPing)) periodicPing = 0;

      Host host = { name, mac, ip, periodicPing * 1000 };
      if (isHostDuplicate(host)) {
        ignoredCount++;
        continue;
      }

      id = hosts.size();
      hosts[id] = host;
      if (host.periodicPing) {
        timers[id] = GTimer<millis>(host.periodicPing, true);
      }

      importedCount++;
    }

    saveHostsData();

    sendJsonResponse(200, String("Imported ") + importedCount + " hosts from " + arr.size() + ". " + ignoredCount + " hosts ignored. Hosts in database after import: " + hosts.size() + ".", true);
  }
}
