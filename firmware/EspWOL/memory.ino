// Function to load PC data from a JSON file
void loadPCData() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(hostsFile, "r");
    if (file) {
      StaticJsonDocument<1024> doc;
      DeserializationError error = deserializeJson(doc, file);
      if (!error) {
        hosts.clear();  // Clear the existing list before loading new data
        for (JsonVariant v : doc.as<JsonArray>()) {
          Host host;
          host.name = v["name"].as<String>();
          host.mac = v["mac"].as<String>();
          host.ip = v["ip"].as<String>();
          hosts.push_back(host);
        }
      }
      file.close();
    }
    LittleFS.end();
  }
}

// Function to save PC data to a JSON file
void savePCData() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(hostsFile, "w");
    if (file) {
      StaticJsonDocument<1024> doc;
      JsonArray array = doc.to<JsonArray>();
      for (const PC& pc : hosts) {
        JsonObject obj = array.createNestedObject();
        obj["name"] = pc.name;
        obj["mac"] = pc.mac;
        obj["ip"] = pc.ip;  // Save IP
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
      StaticJsonDocument<256> doc;
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
        StaticJsonDocument<256> doc;
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
      StaticJsonDocument<256> doc;
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
        StaticJsonDocument<1024> doc;
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