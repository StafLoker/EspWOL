#include "repository.h"

void loadHosts() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(FPSTR(HOSTS_FILE_PATH), "r");
    if (file) {
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, file);
      if (!error) {
        hosts.clear();
        for (JsonVariant v : doc.as<JsonArray>()) {
          Host host;
          host.name = v[F("name")].as<String>();
          host.mac = v[F("mac")].as<String>();
          host.ip = v[F("ip")].as<String>();
          host.autoWake = v[F("autoWake")].as<bool>();
          hosts[v[F("id")].as<int>()] = host;
        }
      }
      file.close();
    }
    LittleFS.end();
  }
}

void saveHosts() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(FPSTR(HOSTS_FILE_PATH), "w");
    if (file) {
      JsonDocument doc;
      JsonArray array = doc.to<JsonArray>();
      for (const auto& pair : hosts) {
        const Host& host = pair.second;
        JsonObject obj = array.createNestedObject();
        obj[F("id")] = pair.first;
        obj[F("name")] = host.name;
        obj[F("mac")] = host.mac;
        obj[F("ip")] = host.ip;
        obj[F("autoWake")] = host.autoWake;
      }
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

void saveSettings() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(FPSTR(SETTINS_FILE_PATH), "w");
    if (file) {
      JsonDocument doc;
      doc[F("pingPeriod")] = settings.pingPeriod;
      doc[F("enable")] = settings.networkConfig.enable;
      doc[F("ip")] = settings.networkConfig.ip.toString();
      doc[F("networkMask")] = settings.networkConfig.networkMask.toString();
      doc[F("gateway")] = settings.networkConfig.gateway.toString();
      doc[F("dns")] = settings.networkConfig.dns.toString();
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

void loadSettings() {
  if (LittleFS.begin()) {
    if (LittleFS.exists(FPSTR(SETTINS_FILE_PATH))) {
      File file = LittleFS.open(FPSTR(SETTINS_FILE_PATH), "r");
      if (file) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (!error) {
          settings.pingPeriod = doc[F("pingPeriod")].as<unsigned long>();
          settings.networkConfig.enable = doc[F("enable")];
          IPAddress ip;
          IPAddress networkMask;
          IPAddress gateway;
          IPAddress dns;
          ip.fromString(doc[F("ip")].as<String>());
          networkMask.fromString(doc[F("networkMask")].as<String>());
          gateway.fromString(doc[F("gateway")].as<String>());
          dns.fromString(doc[F("dns")].as<String>());
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
    File file = LittleFS.open(FPSTR(USER_FILE_PATH), "w");
    if (file) {
      JsonDocument doc;
      doc[F("username")] = user.username;
      doc[F("password")] = user.password;
      serializeJson(doc, file);
      file.close();
    }
  }
  LittleFS.end();
}

User loadUser() {
  User user = { FPSTR(INIT_USER_USERNAME), FPSTR(INIT_USER_PASSWORD) };
  if (LittleFS.begin()) {
    if (LittleFS.exists(FPSTR(USER_FILE_PATH))) {
      File file = LittleFS.open(FPSTR(USER_FILE_PATH), "r");
      if (file) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (!error) {
          user.username = doc[F("username")].as<String>();
          user.password = doc[F("password")].as<String>();
        }
        file.close();
      }
    }
    LittleFS.end();
  }
  return user;
}