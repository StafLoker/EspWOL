#include "host_routes.h"
#include "routes.h"
#include "repository.h"
#include "validation.h"

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
  if (!doc.containsKey("name") || !doc.containsKey("mac") || !doc.containsKey("ip") || !doc.containsKey("autoWake")) {
    sendJsonResponse(400, "Missing required fields", false);
    return false;
  }

  name = doc["name"].as<String>();
  mac = doc["mac"].as<String>();
  ip = doc["ip"].as<String>();
  autoWake = doc["autoWake"].as<bool>();

  if (name.isEmpty() || !isValidMACAddress(mac) || !isValidIPAddress(ip)) {
    sendJsonResponse(400, false, "Invalid data format");
    return false;
  }

  return true;
}

JsonObject createHostJson(JsonDocument &doc, int id, const Host &host) {
  JsonObject obj = doc.to<JsonObject>();
  obj["id"] = id;
  obj["name"] = host.name;
  obj["mac"] = host.mac;
  obj["ip"] = host.ip;
  obj["autoWake"] = host.autoWake;
  if (hostsStatus.find(id) != hostsStatus.end()) {
    obj["status"] = hostsStatus[id];
  } else {
    obj["status"] = false;
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
    obj["id"] = pair.first;
    obj["name"] = host.name;
    obj["mac"] = host.mac;
    obj["ip"] = host.ip;
    obj["autoWake"] = host.autoWake;
    if (hostsStatus.find(pair.first) != hostsStatus.end()) {
      obj["status"] = hostsStatus[pair.first];
    } else {
      obj["status"] = false;
    }
  }

  sendJsonResponse(200, true, "Your hosts", doc);
}

void getHost(int id) {
  if (id >= 0 && id < hosts.size()) {
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
    sendJsonResponse(400, "Duplicate host", false);
    return;
  }

  int id = hosts.size();
  hosts[id] = host;

  saveHosts();

  // Crear JSON con el host añadido
  JsonDocument responseDoc;
  createHostJson(responseDoc, id, host);
  sendJsonResponse(200, "Host added", true, responseDoc);
}

void editHost(int id) {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, false, "Missing body");
    return;
  }

  if (id < 0 || id >= hosts.size()) {
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

  saveHosts();

  // Crear JSON con el host editado
  JsonDocument responseDoc;
  createHostJson(responseDoc, id, host);
  sendJsonResponse(200, true, "Host updated", responseDoc);
}

void deleteHost(int id) {
  if (id >= 0 && id < hosts.size()) {
    hosts.erase(id);
    hostsStatus.erase(id);
    saveHosts();
    sendJsonResponse(200, true, "Host deleted");
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

      bool autoWake = v.containsKey("autoWake") ? v["autoWake"].as<bool>() : false;

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