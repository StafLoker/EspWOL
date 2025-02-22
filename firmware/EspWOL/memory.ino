#include "memory.h"

// Function to load hosts data from a JSON file
void loadHostsData() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(hostsFile, "r");
    if (file) {
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, file);
      if (!error) {
        hosts.clear();  // Clear the existing list before loading new data
        for (JsonVariant v : doc.as<JsonArray>()) {
          Host host;
          host.name = v["name"].as<String>();
          host.mac = v["mac"].as<String>();
          host.ip = v["ip"].as<String>();
          host.periodicPing = v["periodicPing"].as<long>();
          hosts[hosts.size()] = host;
        }
      }
      file.close();
    }
    LittleFS.end();
  }
}

// Function to save hosts data to a JSON file
void saveHostsData() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(hostsFile, "w");
    if (file) {
      JsonDocument doc;
      JsonArray array = doc.to<JsonArray>();
      for (const auto& pair : hosts) {
        const Host& host = pair.second;
        JsonObject obj = array.createNestedObject();
        obj["name"] = host.name;
        obj["mac"] = host.mac;
        obj["ip"] = host.ip;
        obj["periodicPing"] = host.periodicPing;
      }
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

// Function to save network configuration to a JSON file
void saveNetworkConfig() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(networkConfigFile, "w");
    if (file) {
      JsonDocument doc;
      doc["enable"] = networkConfig.enable;
      doc["ip"] = networkConfig.ip.toString();
      doc["networkMask"] = networkConfig.networkMask.toString();
      doc["gateway"] = networkConfig.gateway.toString();
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

// Function to load network configuration from a JSON file
void loadNetworkConfig() {
  if (LittleFS.begin()) {
    if (LittleFS.exists(networkConfigFile)) {
      File file = LittleFS.open(networkConfigFile, "r");
      if (file) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (!error) {
          networkConfig.enable = doc["enable"];
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
        file.close();
      }
    } else {
      saveNetworkConfig();
    }
    LittleFS.end();
  }
}

// Function to save authentication configuration to a JSON file
void saveAuthentication() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(authenticationFile, "w");
    if (file) {
      JsonDocument doc;
      doc["enable"] = authentication.enable;
      doc["username"] = authentication.username;
      doc["password"] = authentication.password;
      serializeJson(doc, file);
      file.close();
    }
  }
  LittleFS.end();
}

// Function to load authentication configuration from a JSON file
void loadAuthentication() {
  if (LittleFS.begin()) {
    if (LittleFS.exists(authenticationFile)) {
      File file = LittleFS.open(authenticationFile, "r");
      if (file) {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, file);
        if (!error) {
          authentication.enable = doc["enable"];
          authentication.username = doc["username"].as<String>();
          authentication.password = doc["password"].as<String>();
        }
        file.close();
      }
    } else {
      saveAuthentication();
    }
    LittleFS.end();
  }
}