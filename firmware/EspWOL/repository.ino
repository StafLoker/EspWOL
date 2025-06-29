#include "repository.h"

void loadHosts() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(hostsFile, "r");
    if (file) {
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, file);
      if (!error) {
        hosts.clear();
        for (JsonVariant v : doc.as<JsonArray>()) {
          Host host;
          host.name = v["name"].as<String>();
          host.mac = v["mac"].as<String>();
          host.ip = v["ip"].as<String>();
          host.autoWake = v["autoWake"].as<bool>();
          hosts[v["id"].as<int>()] = host;
        }
      }
      file.close();
    }
    LittleFS.end();
  }
}

void saveHosts() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(hostsFile, "w");
    if (file) {
      JsonDocument doc;
      JsonArray array = doc.to<JsonArray>();
      for (const auto& pair : hosts) {
        const Host& host = pair.second;
        JsonObject obj = array.createNestedObject();
        obj["id"] = pair.first;
        obj["name"] = host.name;
        obj["mac"] = host.mac;
        obj["ip"] = host.ip;
        obj["autoWake"] = host.autoWake;
      }
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

void saveSettings() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(settingsFile, "w");
    if (file) {
      JsonDocument doc;
      doc["pingPeriod"] = settings.pingPeriod;
      doc["enable"] = settings.networkConfig.enable;
      doc["ip"] = settings.networkConfig.ip.toString();
      doc["networkMask"] = settings.networkConfig.networkMask.toString();
      doc["gateway"] = settings.networkConfig.gateway.toString();
      doc["dns"] = settings.networkConfig.dns.toString();
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

void loadSettings() {
  if (LittleFS.begin()) {
    if (LittleFS.exists(settingsFile)) {
      File file = LittleFS.open(settingsFile, "r");
      if (file) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (!error) {
          settings.pingPeriod = doc["pingPeriod"].as<unsigned long>();
          settings.networkConfig.enable = doc["enable"];
          IPAddress ip;
          IPAddress networkMask;
          IPAddress gateway;
          IPAddress dns;
          ip.fromString(doc["ip"].as<String>());
          networkMask.fromString(doc["networkMask"].as<String>());
          gateway.fromString(doc["gateway"].as<String>());
          dns.fromString(doc["dns"].as<String>());
          settings.networkConfig.ip = ip;
          settings.networkConfig.networkMask = networkMask;
          settings.networkConfig.gateway = gateway;
          settings.networkConfig.dns = dns;
        }
        file.close();
      }
    } else {
      saveSettings();
    }
    LittleFS.end();
  }
}

void saveUser(User& user) {
  if (LittleFS.begin()) {
    File file = LittleFS.open(userFile, "w");
    if (file) {
      JsonDocument doc;
      doc["username"] = user.username;
      doc["password"] = user.password;
      serializeJson(doc, file);
      file.close();
    }
  }
  LittleFS.end();
}

User loadUser() {
  User user = { INIT_USER_USERNAME, INIT_USER_PASSWORD };
  if (LittleFS.begin()) {
    if (LittleFS.exists(userFile)) {
      File file = LittleFS.open(userFile, "r");
      if (file) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (!error) {
          user.username = doc["username"].as<String>();
          user.password = doc["password"].as<String>();
        }
        file.close();
      }
    }
    LittleFS.end();
  }
  return user;
}
