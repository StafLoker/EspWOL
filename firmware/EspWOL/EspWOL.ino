#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LittleFS.h>
#include <WiFiUdp.h>
#include <WakeOnLan.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <ESP8266Ping.h>

#include <ArduinoOTA.h>

#include "index.h"

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan WOL(UDP);
WiFiManager wifiManager;

const char* pcFile = "/pc_list.json";
const char* networkConfigFile = "/networkConfig.json";
const char* authenticationFile = "/authentication.json";

const char* hostname = "wol";
const char* SSID = "WOL-ESP8266";

// Структура для данных ПК
struct PC {
  String name;
  String mac;
  String ip;
};

// Структура для Сети
struct NetworkConfig {
  bool enable = false;
  IPAddress ip;
  IPAddress networkMask;
  IPAddress gateway;
} networkConfig;

// Структура для Аутентификации
struct Authentication {
  bool enable = false;
  String username;
  String password;
} authentication;

// Вектор для хранения списка ПК
std::vector<PC> pcList;

// Функция для настройки OTA
void setupOTA() {
  ArduinoOTA.setHostname(hostname);
  ArduinoOTA.setPassword((const char *)"ber#912NerYi");
  ArduinoOTA.begin();
}

// Функция для обновление настроек сети
void updateIPWifiSettings() {
  if (networkConfig.enable) {
    wifiManager.setSTAStaticIPConfig(networkConfig.ip, networkConfig.gateway, networkConfig.networkMask);
  } else {
    wifi_station_dhcpc_start();
  }
}

// Функция для сброса настроек Wi-Fi
void resetWiFiSettings() {
  wifiManager.resetSettings();  // Сбросить настройки WiFi
}

// Функция для загрузки данных ПК из JSON-файла
void loadPCData() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(pcFile, "r");
    if (file) {
      StaticJsonDocument<1024> doc;
      DeserializationError error = deserializeJson(doc, file);
      if (!error) {
        pcList.clear();  // Очистить существующий список перед загрузкой новых данных
        for (JsonVariant v : doc.as<JsonArray>()) {
          PC pc;
          pc.name = v["name"].as<String>();
          pc.mac = v["mac"].as<String>();
          pc.ip = v["ip"].as<String>();
          pcList.push_back(pc);
        }
      }
      file.close();
    }
    LittleFS.end();
  }
}

// Функция для сохранения данных ПК в JSON-файл
void savePCData() {
  if (LittleFS.begin()) {
    File file = LittleFS.open(pcFile, "w");
    if (file) {
      StaticJsonDocument<1024> doc;
      JsonArray array = doc.to<JsonArray>();
      for (const PC& pc : pcList) {
        JsonObject obj = array.createNestedObject();
        obj["name"] = pc.name;
        obj["mac"] = pc.mac;
        obj["ip"] = pc.ip;  // Сохранить IP
      }
      serializeJson(doc, file);
      file.close();
    }
    LittleFS.end();
  }
}

// Функция для сохранения конфигурации сети в JSON-файл
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

// Функция для загрузки конфигурации сети из JSON-файла
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

// Функция для сохранения конфигурации аутентификации в JSON-файл
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

// Функция для загрузки конфигурации аутентификации из JSON-файла
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


// Функция для обработки корневого запроса
void handleRoot() {
  if (authentication.enable && !server.authenticate(authentication.username.c_str(), authentication.password.c_str())) {
    return server.requestAuthentication();
  }
  server.send_P(200, "text/html", htmlPage);
}

// Функция для обработки запроса списка ПК
void handlePCList() {
  String jsonResponse;
  StaticJsonDocument<1024> doc;
  JsonArray array = doc.to<JsonArray>();
  for (const PC& pc : pcList) {
    JsonObject obj = array.createNestedObject();
    obj["name"] = pc.name;
    obj["mac"] = pc.mac;
    obj["ip"] = pc.ip;
  }
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// Функция для добавления нового ПК
void handleAddPC() {
  if (server.method() == HTTP_POST) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    PC pc;
    pc.name = doc["name"].as<String>();
    pc.mac = doc["mac"].as<String>();
    pc.ip = doc["ip"].as<String>();
    pcList.push_back(pc);
    savePCData();
    server.send(200, "text/plain", "PC added");
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для редактирования ПК
void handleEditPC() {
  if (server.method() == HTTP_POST) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    int index = doc["index"];
    if (index >= 0 && index < pcList.size()) {
      PC& pc = pcList[index];
      pc.name = doc["name"].as<String>();
      pc.mac = doc["mac"].as<String>();
      pc.ip = doc["ip"].as<String>();
      savePCData();
      server.send(200, "text/plain", "PC updated");
    } else {
      server.send(404, "text/plain", "PC not found");
    }
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для удаления ПК
void handleDeletePC() {
  if (server.method() == HTTP_POST) {
    int index = server.arg("index").toInt();
    if (index >= 0 && index < pcList.size()) {
      pcList.erase(pcList.begin() + index);
      savePCData();
      server.send(200, "text/plain", "PC deleted");
    } else {
      server.send(404, "text/plain", "PC not found");
    }
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для пробуждения ПК
void handleWakePC() {
  if (server.method() == HTTP_POST) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    String mac = doc["mac"].as<String>();
    if (WOL.sendMagicPacket(mac.c_str())) {
      server.send(200, "text/plain", "WOL packet sent");
    } else {
      server.send(400, "text/plain", "Failed to send WOL packet");
    }
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для ping ПК
void handlePingPC() {
  if (server.method() == HTTP_POST) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    IPAddress ip;
    ip.fromString(doc["ip"].as<String>());
    if (Ping.ping(ip)) {
      server.send(200, "text/plain", "Pinging");
    } else {
      server.send(400, "text/plain", "Failed ping");
    }
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для обновления настроек сети
void handleUpdateNetworkSettings() {
  if (server.method() == HTTP_POST) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    networkConfig.enable = doc["enable"];
    if (networkConfig.enable) {
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
    saveNetworkConfig();
    updateIPWifiSettings();
    server.send(200, "text/plain", "Network settings updated");
    delay(100);
    ESP.restart();
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для обновления настроек аутентификации
void handleUpdateAuthentication() {
  if (server.method() == HTTP_POST) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, body);
    authentication.enable = doc["enable"];
    if (authentication.enable) {
      authentication.username = doc["username"].as<String>();
      authentication.password = doc["password"].as<String>();
    }
    saveAuthentication();
    server.send(200, "text/plain", "Authentication updated");
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

// Функция для отправки настроек сети
void handleGetNetworkSettings() {
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

// Функция для отправки настроек аутентификации
void handleGetAuthentication() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["enable"] = authentication.enable;
  doc["username"] = authentication.username;
  doc["password"] = "************";
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// Настройка сервера
void setup() {
  WiFi.hostname(hostname);

  setupOTA();

  // Загрузить данные при старте
  LittleFS.begin();
  loadNetworkConfig();
  loadAuthentication();
  loadPCData();

  updateIPWifiSettings();

  wifiManager.autoConnect(SSID);  // Авто подключение

  server.on("/", handleRoot);
  server.on("/pc_list", handlePCList);
  server.on("/add", handleAddPC);
  server.on("/edit", handleEditPC);
  server.on("/delete", handleDeletePC);
  server.on("/wake", handleWakePC);
  server.on("/ping", handlePingPC);
  server.on("/network_settings", handleGetNetworkSettings);
  server.on("/authentication", handleGetAuthentication);
  server.on("/update_network_settings", handleUpdateNetworkSettings);
  server.on("/reset_wifi", []() {
    resetWiFiSettings();
    server.send(200, "text/plain", "WiFi settings reset");
  });
  server.on("/update_authentication", handleUpdateAuthentication);
  server.begin();
}

void loop() {
  server.handleClient();
  ArduinoOTA.handle();
  delay(1);  // Уменьшим потребление на 60% добавив делей https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}