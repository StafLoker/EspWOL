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

// Structure for PC data
struct Host {
  String name;
  String mac;
  String ip;
};

// Structure for Network settings
struct NetworkConfig {
  bool enable = false;
  IPAddress ip;
  IPAddress networkMask;
  IPAddress gateway;
} networkConfig;

// Structure for Authentication settings
struct Authentication {
  bool enable = false;
  String username;
  String password;
} authentication;

// Vector for storing the list of PCs
std::vector<Host> hosts;

// Function to setup OTA
void setupOTA() {
  ArduinoOTA.setHostname(hostname);
  ArduinoOTA.setPassword((const char*)"ber#912NerYi");
  ArduinoOTA.begin();
}

// Function to update WiFi settings
void updateIPWifiSettings() {
  if (networkConfig.enable) {
    wifiManager.setSTAStaticIPConfig(networkConfig.ip, networkConfig.gateway, networkConfig.networkMask);
  } else {
    wifi_station_dhcpc_start();
  }
}

// Function to reset WiFi settings
void resetWiFiSettings() {
  wifiManager.resetSettings();  // Reset WiFi settings
}


// API: '/'
void handleRoot() {
  if (authentication.enable && !server.authenticate(authentication.username.c_str(), authentication.password.c_str())) {
    return server.requestAuthentication();
  }
  server.send_P(200, "text/html", htmlPage);
}

// API: GET '/hosts'
void getHostList() {
  String jsonResponse;
  StaticJsonDocument<1024> doc;
  JsonArray array = doc.to<JsonArray>();
  for (const Host& host : hosts) {
    JsonObject obj = array.createNestedObject();
    obj["name"] = host.name;
    obj["mac"] = host.mac;
    obj["ip"] = host.ip;
  }
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// API: GET '/hosts?id={index}'
void getHost(const String& id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    Host& host = hosts[index];
    String jsonResponse;
    StaticJsonDocument<256> doc;
    doc["name"] = host.name;
    doc["mac"] = host.mac;
    doc["ip"] = host.ip;
    serializeJson(doc, jsonResponse);
    server.send(200, "application/json", jsonResponse);
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: POST '/hosts'
void addHost() {
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  Host host;
  host.name = doc["name"].as<String>();
  host.mac = doc["mac"].as<String>();
  host.ip = doc["ip"].as<String>();
  hosts.push_back(host);
  saveHostsData();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host added\" }");
}

// API: PUT '/hosts?id={index}'
void editHost(const String& id) {
  int index = id.toInt();
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  if (index >= 0 && index < hosts.size()) {
    Host& host = hosts[index];
    host.name = doc["name"].as<String>();
    host.mac = doc["mac"].as<String>();
    host.ip = doc["ip"].as<String>();
    saveHostsData();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host updated\" }");
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

// API: DELETE '/hosts?id={index}'
void deleteHost(const String& id) {
  int index = id.toInt();
  if (index >= 0 && index < hosts.size()) {
    hosts.erase(hosts.begin() + index);
    saveHostsData();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"Host deleted\" }");
  } else {
    server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
  }
}

void handleHosts() {
  int totalArgs = server.args();
  if (totalArgs < 4) {
    if (server.method() == HTTP_GET) {
      getHostList();
    } else if (server.method() == HTTP_POST) {
      addHost();
    } else {
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
    }
  } else {
    if (server.hasArg("id") && server.method() == HTTP_GET) {
      getHost(server.arg("id"));
    } else if (server.hasArg("id") && server.method() == HTTP_PUT) {
      editHost(server.arg("id"));
    } else if (server.hasArg("id") && server.method() == HTTP_DELETE) {
      deleteHost(server.arg("id"));
    } else {
      server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
    }
  }
}

// API: POST '/ping?id={index}'
void handleWakeHost() {
  if (server.hasArg("id")) {
    int index = server.arg("id").toInt();
    if (index >= 0 && index < hosts.size()) {
      Host& host = hosts[index];
      if (WOL.sendMagicPacket(host.mac.c_str())) {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"WOL packet sent\" }");
      } else {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"Failed to send WOL packet\" }");
      }
    } else {
      server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
    }
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

// API: POST '/wake?id={index}'
void handlePingHost() {
  if (server.hasArg("id")) {
    int index = server.arg("id").toInt();
    if (index >= 0 && index < hosts.size()) {
      Host& host = hosts[index];
      IPAddress ip;
      ip.fromString(host.ip);
      if (Ping.ping(ip)) {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"Pinging\" }");
      } else {
        server.send(200, "application/json", "{ \"success\": true, \"message\": \"Failed ping\" }");
      }
    } else {
      server.send(200, "application/json", "{ \"success\": false, \"message\": \"Host not found\" }");
    }
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

// API: PUT '/networkSettings'
void updateNetworkSettings() {
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
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Network settings updated\" }");
  delay(100);
  ESP.restart();
}

// API: PUT '/authenticationSettings'
void updateAuthenticationSettings() {
  String body = server.arg("plain");
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, body);
  authentication.enable = doc["enable"];
  if (authentication.enable) {
    authentication.username = doc["username"].as<String>();
    authentication.password = doc["password"].as<String>();
  }
  saveAuthentication();
  server.send(200, "application/json", "{ \"success\": true, \"message\": \"Authentication updated\" }");
}

// API: GET '/networkSettings'
void getNetworkSettings() {
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

// API: GET '/authenticationSettings'
void getAuthenticationSettings() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["enable"] = authentication.enable;
  doc["username"] = authentication.username;
  doc["password"] = "************";
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

void handleNetworkSettings() {
  if (server.method() == HTTP_GET) {
    getNetworkSettings();
  } else if (server.method() == HTTP_PUT) {
    updateNetworkSettings();
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

void handleAuthenticationSettings() {
  if (server.method() == HTTP_GET) {
    getAuthenticationSettings();
  } else if (server.method() == HTTP_PUT) {
    updateAuthenticationSettings();
  } else {
    server.send(405, "application/json", "{ \"success\": false, \"message\": \"HTTP Method Not Allowed\" }");
  }
}

// API: GET '/about'
void handleGetAbout() {
  String jsonResponse;
  StaticJsonDocument<256> doc;
  doc["version"] = VERSION;
  doc["hostname"] = wifiManager.getWiFiHostname();
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// Server setup
void setup() {
  WiFi.hostname(hostname);

  setupOTA();

  // Load data at startup
  LittleFS.begin();
  loadNetworkConfig();
  loadAuthentication();
  loadHostsData();

  updateIPWifiSettings();

  wifiManager.autoConnect(SSID);  // Auto connect

  server.on("/", HTTP_GET, handleRoot);
  server.on("/hosts", HTTP_ANY, handleHosts);
  server.on("/ping", HTTP_POST, handlePingHost);
  server.on("/wake", HTTP_POST, handleWakeHost);
  server.on("/about", HTTP_GET, handleGetAbout);
  server.on("/networkSettings", HTTP_ANY, handleNetworkSettings);
  server.on("/authenticationSettings", HTTP_ANY, handleAuthenticationSettings);
  server.on("/resetWifi", HTTP_POST, []() {
    resetWiFiSettings();
    server.send(200, "application/json", "{ \"success\": true, \"message\": \"WiFi settings reset\" }");
  });
  server.onNotFound([]() {
    server.send(404, "text/plain", "404: Not found");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  ArduinoOTA.handle();
  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}