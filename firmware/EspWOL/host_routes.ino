#include "host_routes.h"
#include "routes.h"
#include "repository.h"
#include "validation.h"

// =============================================================================
// CONFIGURACIÓN DE RUTAS DE HOSTS
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
// FUNCIONES AUXILIARES PARA HOSTS
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
    sendJsonResponse(400, "Invalid data format", false);
    return false;
  }

  return true;
}

void getHostList() {
  extern std::map<int, Host> hosts;
  
  JsonDocument doc;
  JsonArray array = doc.to<JsonArray>();
  for (const auto &pair : hosts) {
    const Host &host = pair.second;

    JsonObject obj = array.createNestedObject();
    obj["name"] = host.name;
    obj["mac"] = host.mac;
    obj["ip"] = host.ip;
    obj["autoWake"] = host.autoWake;
  }
  sendJsonResponse(200, doc);
}

void getHost(const String &id) {
  extern std::map<int, Host> hosts;
  extern std::map<int, boolean> hostsStatus;
  
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    Host &host = hosts[index];
    JsonDocument doc;
    doc["name"] = host.name;
    doc["mac"] = host.mac;
    doc["ip"] = host.ip;
    doc["autoWake"] = host.autoWake;
    if (hostsStatus.find(index) != hostsStatus.end()) {
      doc["status"] = hostsStatus[index];
    } else {
      doc["status"] = false;
    }
    sendJsonResponse(200, doc);
  } else {
    sendJsonResponse(400, "Host not found", false);
  }
}

void addHost() {
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
  bool autoWake;
  if (!validateHostData(doc, name, mac, ip, autoWake)) return;

  Host host = { name, mac, ip, autoWake };

  if (isHostDuplicate(host)) {
    sendJsonResponse(400, "Duplicate host", false);
    return;
  }

  extern std::map<int, Host> hosts;
  int id = hosts.size();
  hosts[id] = host;

  saveHostsData();
  sendJsonResponse(200, "Host added", true);
}

void editHost(const String &id) {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "Missing body", false);
    return;
  }

  extern std::map<int, Host> hosts;
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
  bool autoWake;
  if (!validateHostData(doc, name, mac, ip, autoWake)) return;

  Host &host = hosts[index];
  host.name = name;
  host.mac = mac;
  host.ip = ip;
  host.autoWake = autoWake;

  saveHostsData();
  sendJsonResponse(200, "Host updated", true);
}

void deleteHost(const String &id) {
  extern std::map<int, Host> hosts;
  extern std::map<int, boolean> hostsStatus;
  
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    hosts.erase(index);
    hostsStatus.erase(index);
    saveHostsData();
    sendJsonResponse(200, "Host deleted", true);
  } else {
    sendJsonResponse(400, "Host not found", false);
  }
}

// =============================================================================
// RUTAS DE HOSTS
// =============================================================================

void handleHosts() {
  if (isAuthenticated()) {
    if (server.method() == HTTP_GET) {
      getHostList();
    } else if (server.method() == HTTP_POST) {
      addHost();
    } else {
      sendJsonResponse(405, "HTTP Method Not Allowed", false);
    }
  }
}

void handleHostsById() {
  if (isAuthenticated()) {
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

    saveHostsData();

    sendJsonResponse(200, String("Imported ") + importedCount + " hosts from " + arr.size() + ". " + ignoredCount + " hosts ignored. Hosts in database after import: " + hosts.size() + ".", true);
  }
}