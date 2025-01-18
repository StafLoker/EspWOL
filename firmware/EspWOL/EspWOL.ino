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
#include "memory.h"

#define VERSION "2.0.0"

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan WOL(UDP);
WiFiManager wifiManager;

const char* hostsFile = "/hosts.json";
const char* networkConfigFile = "/networkConfig.json";
const char* authenticationFile = "/authentication.json";

const char* hostname = "wol";
const char* SSID = "WOL-ESP8266";

// Структура для данных ПК
struct Host {
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
std::vector<Host> hosts;

// Функция для настройки OTA
void setupOTA() {
  ArduinoOTA.setHostname(hostname);
  ArduinoOTA.setPassword((const char*)"ber#912NerYi");
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
  for (const PC& pc : hosts) {
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
    hosts.push_back(pc);
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
    if (index >= 0 && index < hosts.size()) {
      PC& pc = hosts[index];
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
    if (index >= 0 && index < hosts.size()) {
      hosts.erase(hosts.begin() + index);
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

void handleGetAbout() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["version"] = VERSION;
  doc["hostname"] = wifiManager.getWiFiHostname();
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
  server.on("/about", handleGetAbout);
  server.begin();
}

void loop() {
  server.handleClient();
  ArduinoOTA.handle();
  delay(1);  // Уменьшим потребление на 60% добавив делей https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}