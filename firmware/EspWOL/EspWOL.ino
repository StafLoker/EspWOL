/* 
  Project: EspWOL 
  Author: StafLoker
*/

/* Network */
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiUdp.h>
#include <WakeOnLan.h>
#include <WiFiManager.h>
#include <ESP8266Ping.h>

/* Memory */
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <map>

/* OTA */
#define ENABLE_STANDARD_OTA 1  // Values: 1 to enable, != 1 to disable

#if ENABLE_STANDARD_OTA == 1
#include <ArduinoOTA.h>
#endif

#include <AutoOTA.h>

/* Time */
#include <GTimer.h>

/* Project */
#include "index.h"
#include "memory.h"
#include "api.h"

#define VERSION "2.0.0"

AutoOTA ota(VERSION, "StafLoker/EspWOL");

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
  unsigned long periodicPing = 0;
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

// Map for storing hosts
std::map<int, Host> hosts;
// Map for storing lastPings
std::map<int, unsigned long> lastPings;
// Map for storing Timers
std::map<int, GTimer<millis>> timers;

#if ENABLE_STANDARD_OTA == 1
// Function to setup OTA
void setupOTA() {
  ArduinoOTA.setHostname(hostname);
  ArduinoOTA.setPassword((const char*)"ber#912NerYi");
  ArduinoOTA.begin();
}
#endif

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

void setupPeriodicPingToHosts() {
  for (const auto& pair : hosts) {
    int id = pair.first;
    const Host& host = pair.second;
    if (host.periodicPing) {
      timers[id] = GTimer<millis>(host.periodicPing, true);
    }
  }
}

void checkTimers() {
  for (auto& pair : timers) {
    int id = pair.first;
    GTimer<millis>& timer = pair.second;
    if (timer.tick()) {
      Host& host = hosts[id];
      IPAddress ip;
      ip.fromString(host.ip);
      lastPings[id] = millis();
      if (!Ping.ping(ip)) {
        WOL.sendMagicPacket(host.mac.c_str());
      }
    }
  }
}

// Server setup
void setup() {
  WiFi.hostname(hostname);

#if ENABLE_STANDARD_OTA == 1
  setupOTA();
#endif

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
  server.on("/updateVersion", HTTP_ANY, handleUpdateVersion);
  server.on("/import", HTTP_POST, handleImportDatabase);
  server.onNotFound([]() {
    server.send(404, "text/plain", "404: Not found");
  });
  server.begin();

  setupPeriodicPingToHosts();
}

void loop() {
  server.handleClient();
#if ENABLE_STANDARD_OTA == 1
  ArduinoOTA.handle();
#endif
  checkTimers();
  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}