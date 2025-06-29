#include "host_routes.h"

// =============================================================================
// HOST ROUTE CONFIGURATION
// =============================================================================

void setupHostRoutes() {
  server.on("/hosts", HTTP_ANY, []() {
    if (server.hasArg("id")) {
      handleHostsById();
    } else {
      handleHosts();
    }
  });

  server.on("/import", HTTP_POST, handleImportDatabase);
}

// =============================================================================
// AUXILIARY FUNCTIONS FOR HOSTS
// =============================================================================

bool validateHostData(const JsonDocument &doc, String &name, String &mac, String &ip, bool &autoWake) {
  if (!doc.containsKey(F("name")) || !doc.containsKey(F("mac")) || !doc.containsKey(F("ip")) || !doc.containsKey(F("autoWake"))) {
    sendJsonResponse(400, false, "Missing required fields");
    return false;
  }

  name = doc[F("name")].as<String>();
  mac = doc[F("mac")].as<String>();
  ip = doc[F("ip")].as<String>();
  autoWake = doc[F("autoWake")].as<bool>();

  if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
    sendJsonResponse(400, false, "Invalid data format");
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
  if (hostsStatus.find(id) != hostsStatus.end()) {
    obj[F("status")] = hostsStatus[id];
  } else {
    obj[F("status")] = false;
  }
  return obj;
}

bool isHostDuplicate(const Host &newHost) {
  for (const auto &pair : hosts) {
    const Host &existingHost = pair.second;

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
    if (hostsStatus.find(pair.first) != hostsStatus.end()) {
      obj[F("status")] = hostsStatus[pair.first];
    } else {
      obj[F("status")] = false;
    }
  }

  sendJsonResponse(200, true, "Your hosts", doc);
}

void getHost(int id) {
  if (hosts.find(id) != hosts.end()) {
    Host &host = hosts[id];
    JsonDocument doc;
    createHostJson(doc, id, host);
    sendJsonResponse(200, true, "Your host", doc);
  } else {
    sendJsonResponse(400, false, "Host not found");
  }
}

void addHost() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  String name, mac, ip;
  bool autoWake;
  if (!validateHostData(doc, name, mac, ip, autoWake)) return;

  Host host = { name, mac, ip, autoWake };

  if (isHostDuplicate(host)) {
    sendJsonResponse(409, false, "Duplicate host");
    return;
  }

  int id = hosts.size();
  hosts[id] = host;

  saveHosts();

  // Crear JSON con el host añadido
  JsonDocument responseDoc;
  createHostJson(responseDoc, id, host);
  sendJsonResponse(200, true, "Host added", responseDoc);
}

void editHost(int id) {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  if (hosts.find(id) == hosts.end()) {
    sendJsonResponse(400, false, "Host not found");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  String name, mac, ip;
  bool autoWake;
  if (!validateHostData(doc, name, mac, ip, autoWake)) return;

  Host &host = hosts[id];
  host.name = name;
  host.mac = mac;
  host.ip = ip;
  host.autoWake = autoWake;

  if (isHostDuplicate(host)) {
    sendJsonResponse(409, false, "Duplicate host");
    return;
  }

  saveHosts();

  // Crear JSON con el host editado
  JsonDocument responseDoc;
  createHostJson(responseDoc, id, host);
  sendJsonResponse(200, true, "Host updated", responseDoc);
}

void deleteHost(int id) {
  if (hosts.find(id) != hosts.end()) {
    hosts.erase(id);
    hostsStatus.erase(id);
    saveHosts();
    server.send(204);
  } else {
    sendJsonResponse(400, false, "Host not found");
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
    int id = server.arg("id").toInt();
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
    if (!server.hasArg("plain")) {
      sendJsonResponse(400, false, "Missing body");
      return;
    }

    JsonDocument doc;
    if (deserializeJson(doc, server.arg("plain"))) {
      sendJsonResponse(400, false, "Invalid JSON");
      return;
    }

    if (!doc.is<JsonArray>()) {
      sendJsonResponse(400, false, "Expected JSON array");
      return;
    }

    JsonArray arr = doc.as<JsonArray>();
    int importedCount = 0;
    int ignoredCount = 0;
    int id;

    extern std::map<int, Host> hosts;

    for (JsonVariant v : arr) {
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

      id = hosts.size();
      hosts[id] = host;
      importedCount++;
    }

    saveHosts();

    sendJsonResponse(200, true, String("Imported ") + importedCount + " hosts from " + arr.size() + ". " + ignoredCount + " hosts ignored. Hosts in database after import: " + hosts.size() + ".");
  }
}