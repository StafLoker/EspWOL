#include "host_routes.h"

// =============================================================================
// HOST ROUTE CONFIGURATION
// =============================================================================

void setupHostRoutes() {
  server.on(FPSTR(ROUTE_HOSTS), HTTP_ANY, []() {
    if (server.hasArg(FPSTR(ARG_ID))) {
      handleHostsById();
    } else {
      handleHosts();
    }
  });

  server.on(FPSTR(ROUTE_HOSTS_IMPORT), HTTP_POST, handleImportDatabase);
  server.on(FPSTR(ROUTE_HOSTS_WAKE), HTTP_POST, handleWakeHost);
  server.on(FPSTR(ROUTE_HOSTS_PING), HTTP_POST, handlePingHost);
}

// =============================================================================
// AUXILIARY FUNCTIONS FOR HOSTS
// =============================================================================

int generateUniqueHostId() {
  int newId = 1;

  while (hosts.find(newId) != hosts.end()) {
    newId++;
  }

  return newId;
}

bool validateHostData(const JsonDocument &doc, String &name, String &mac, String &ip, bool &autoWake) {
  if (!doc.containsKey(F("name")) || !doc.containsKey(F("mac")) || !doc.containsKey(F("ip")) || !doc.containsKey(F("autoWake"))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_FIELDS));
    return false;
  }

  name = doc[F("name")].as<String>();
  mac = doc[F("mac")].as<String>();
  ip = doc[F("ip")].as<String>();
  autoWake = doc[F("autoWake")].as<bool>();

  if (name.isEmpty() || name.length() > MAX_HOST_NAME_LENGTH || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_FORMAT));
    return false;
  }

  return true;
}

JsonObject createHostJson(JsonDocument &doc, int id, const Host &host) {
  JsonObject obj = doc.to<JsonObject>();
  obj[F("id")] = id;
  obj[F("name")] = host.name;
  obj[F("mac")] = host.mac;
  obj[F("ip")] = host.ip;
  obj[F("autoWake")] = host.autoWake;
  obj[F("status")] = host.status;
  return obj;
}

bool isHostDuplicate(const Host &newHost, int excludeId) {
  for (const auto &pair : hosts) {
    const Host &existingHost = pair.second;
    int currentId = pair.first;

    if (currentId == excludeId) {
      continue;
    }

    if (existingHost.mac == newHost.mac || existingHost.ip == newHost.ip) {
      return true;
    }
  }
  return false;
}

void getHostList() {
  JsonDocument doc;
  JsonArray array = doc.to<JsonArray>();

  for (const auto &pair : hosts) {
    const Host &host = pair.second;

    JsonObject obj = array.createNestedObject();
    obj[F("id")] = pair.first;
    obj[F("name")] = host.name;
    obj[F("mac")] = host.mac;
    obj[F("ip")] = host.ip;
    obj[F("autoWake")] = host.autoWake;
    obj[F("status")] = host.status;
  }

  sendJsonResponse(200, true, "Your hosts", doc, true);
}

void getHost(int id) {
  if (hosts.find(id) != hosts.end()) {
    Host &host = hosts[id];
    JsonDocument doc;
    createHostJson(doc, id, host);
    sendJsonResponse(200, true, "Your host", doc);
  } else {
    sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
  }
}

void addHost() {
  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (!hasEnoughMemoryForHost()) {
    sendJsonResponse(507, false, FPSTR(MSG_MAX_HOSTS_REACHED));
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  String name, mac, ip;
  bool autoWake;
  if (!validateHostData(doc, name, mac, ip, autoWake))
    return;

  Host host = { name, mac, ip, autoWake, false };

  if (isHostDuplicate(host)) {
    sendJsonResponse(409, false, FPSTR(MSG_DUPLICATE_HOST));
    return;
  }

  IPAddress ipAddress;
  ipAddress.fromString(host.ip);
  host.status = Ping.ping(ipAddress, 1);

  int id = generateUniqueHostId();

  hosts[id] = host;

  saveHosts();

  JsonDocument responseDoc;
  createHostJson(responseDoc, id, host);
  sendJsonResponse(200, true, "Host added", responseDoc, true);
}

void editHost(int id) {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (hosts.find(id) == hosts.end()) {
    sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  String name, mac, ip;
  bool autoWake;
  if (!validateHostData(doc, name, mac, ip, autoWake))
    return;

  Host newHost = { name, mac, ip, autoWake, false };

  if (isHostDuplicate(newHost, id)) {
    sendJsonResponse(409, false, FPSTR(MSG_DUPLICATE_HOST));
    return;
  }

  IPAddress ipAddress;
  ipAddress.fromString(newHost.ip);
  newHost.status = Ping.ping(ipAddress, 1);

  hosts[id] = newHost;

  saveHosts();

  JsonDocument responseDoc;
  createHostJson(responseDoc, id, hosts[id]);
  sendJsonResponse(200, true, "Host updated", responseDoc, true);
}

void deleteHost(int id) {
  if (hosts.find(id) != hosts.end()) {
    hosts.erase(id);
    saveHosts();
    sendJsonResponse(204, true, "Host deleted", true);
  } else {
    sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
  }
}

// =============================================================================
// HOSTS ROUTES
// =============================================================================

void handleHosts() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getHostList();
    } else if (server.method() == HTTP_POST) {
      addHost();
    } else {
      sendJsonResponse(405, false, "HTTP Method Not Allowed");
    }
  }
}

void handleHostsById() {
  if (isAuthenticated()) {
    int id = server.arg(FPSTR(ARG_ID)).toInt();
    if (server.method() == HTTP_GET) {
      getHost(id);
    } else if (server.method() == HTTP_PUT) {
      editHost(id);
    } else if (server.method() == HTTP_DELETE) {
      deleteHost(id);
    } else {
      sendJsonResponse(405, false, "HTTP Method Not Allowed");
    }
  }
}

void handleImportDatabase() {
  if (isAuthenticated()) {
    if (!server.hasArg(FPSTR(ARG_PLAIN))) {
      sendJsonResponse(400, false, FPSTR(MSG_MISSING_BODY));
      return;
    }

    JsonDocument doc;
    if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
      sendJsonResponse(400, false, FPSTR(MSG_INVALID_JSON));
      return;
    }

    if (!doc.is<JsonArray>()) {
      sendJsonResponse(400, false, "Expected JSON array");
      return;
    }

    JsonArray arr = doc.as<JsonArray>();
    int importedCount = 0;
    int ignoredCount = 0;

    if (arr.size() > 0 && !hasEnoughMemoryForHost()) {
      sendJsonResponse(507, false, FPSTR(MSG_MAX_HOSTS_REACHED));
      return;
    }

    for (JsonVariant v : arr) {
      if (!hasEnoughMemoryForHost()) {
        ignoredCount++;
        continue;
      }

      if (!v.containsKey(F("name")) || !v.containsKey(F("mac")) || !v.containsKey(F("ip"))) {
        ignoredCount++;
        continue;
      }

      String name = v[F("name")].as<String>();
      String mac = v[F("mac")].as<String>();
      String ip = v[F("ip")].as<String>();

      if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
        ignoredCount++;
        continue;
      }

      bool autoWake = v.containsKey(F("autoWake")) ? v[F("autoWake")].as<bool>() : false;

      Host host = { name, mac, ip, autoWake };

      if (isHostDuplicate(host)) {
        ignoredCount++;
        continue;
      }

      hosts[generateUniqueHostId()] = host;
      importedCount++;
    }

    if (importedCount > 0) {
      saveHosts();
    }

    JsonDocument responseDoc;
    responseDoc[F("imported_count")] = importedCount;
    responseDoc[F("ignored_count")] = ignoredCount;
    responseDoc[F("input_size")] = arr.size();
    responseDoc[F("current_host_count")] = hosts.size();

    if (importedCount > 0) {
      sendJsonResponse(200, true, "Import successful", responseDoc, true);
    } else {
      sendJsonResponse(200, false, "No hosts were imported", responseDoc, true);
    }
  }
}

void handleWakeHost() {
  if (isAuthenticated()) {
    if (server.hasArg(FPSTR(ARG_ID))) {
      int id = server.arg(FPSTR(ARG_ID)).toInt();
      if (id >= 0 && id < hosts.size()) {
        Host &host = hosts[id];
        if (wol.sendMagicPacket(host.mac.c_str())) {
          sendJsonResponse(200, true, "WOL packet sent");
        } else {
          sendJsonResponse(200, false, "Failed to send WOL packet");
        }
      } else {
        sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
      }
    } else {
      sendJsonResponse(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

void handlePingHost() {
  if (isAuthenticated()) {
    if (server.hasArg("id")) {
      int id = server.arg("id").toInt();

      if (hosts.find(id) != hosts.end()) {
        Host &host = hosts[id];
        IPAddress ip;
        ip.fromString(host.ip);
        bool pingResult = Ping.ping(ip, 3);
        host.status = pingResult;

        if (pingResult) {
          sendJsonResponse(200, true, "Host is online");
        } else {
          sendJsonResponse(200, false, "Host is offline");
        }
      } else {
        sendJsonResponse(400, false, FPSTR(MSG_HOST_NOT_FOUND));
      }
    } else {
      sendJsonResponse(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}
