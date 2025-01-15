#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LittleFS.h>
#include <WiFiUdp.h>
#include <WakeOnLan.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>

#include "html.h"

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan WOL(UDP);

const char* pcFile = "/pc_list.json";
String Hostname = "wol";

// Структура для данных ПК
struct PC {
  String name;
  String mac;
  String ip;
};

// Структура для Сети
struct NetworkConfig {
  IPAddress staticIP;
  IPAddress staticNetworkMask;
  IPAddress staticGateway;
} networkConfig = {.staticIP = IPAddress(192, 168, 1, 5), .staticNetworkMask = IPAddress(255, 255, 255, 0), .staticGateway = IPAddress(192, 168, 1, 1)};

// Структура для Аутентификации
struct Authentication {
  String username;
  String password;
} authentication = {.username = "wake", .password = "funNy@Sheep"};

// Вектор для хранения списка ПК
std::vector<PC> pcList;

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

// Функция для обработки корневого запроса
void handleRoot() {
  if (!server.authenticate("wake", "funNy@Sheep")) {
    return server.requestAuthentication();
  }
  server.send(200, "text/html", htmlPage);
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

// Функция для сброса настроек Wi-Fi
void resetWiFiSettings() {
  WiFiManager wifiManager;
  wifiManager.resetSettings();  // Сбросить настройки WiFi
}

// Настройка сервера
void setup() {
  Serial.begin(115200);
  WiFi.hostname(Hostname.c_str());
  LittleFS.begin();
  loadPCData();  // Загрузить данные ПК при старте
  WiFiManager wifiManager;
  wifiManager.setSTAStaticIPConfig(IPAddress(networkConfig.staticIP[0], networkConfig.staticIP[1], networkConfig.staticIP[2], networkConfig.staticIP[3]), IPAddress(networkConfig.staticGateway[0], networkConfig.staticGateway[1], networkConfig.staticGateway[2], networkConfig.staticGateway[3]), IPAddress(networkConfig.staticNetworkMask[0], networkConfig.staticNetworkMask[1], networkConfig.staticNetworkMask[2], networkConfig.staticNetworkMask[3]));
  wifiManager.autoConnect("WOL-ESP8266");  // Авто подключение
  server.on("/", handleRoot);
  server.on("/pc_list", handlePCList);
  server.on("/add", handleAddPC);
  server.on("/edit", handleEditPC);
  server.on("/delete", handleDeletePC);
  server.on("/wake", handleWakePC);
  server.on("/reset_wifi", []() {
    resetWiFiSettings();
    server.send(200, "text/plain", "WiFi settings reset");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  delay(1);  // Уменьшим потребление на 60% добавив делей https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}