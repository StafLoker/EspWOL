/* 
  Project: EspWOL 
  Author: StafLoker
  Version: 3.0.0
*/

#include <Arduino.h>
#include "consts.h"

/* Network */
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiUdp.h>
#include <WakeOnLan.h>
#include <WiFiManager.h>
#include <ESP8266Ping.h>

/* mDNS */
#if ENABLE_mDNS == 1
#include <ESP8266mDNS.h>
#endif

/* Memory */
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <map>

/* OTA */
#if ENABLE_STANDARD_OTA == 1
#include <ArduinoOTA.h>
#define ARDUINO_OTA_PORT 8266
#endif

/* Time */
#include <GTimer.h>

/* Project files */
#include "structs.h"
#include "routes.h"
#include "auth_routes.h"
#include "host_routes.h"
#include "settings_routes.h"
#include "web_routes.h"
#include "repository.h"
#include "validation.h"
#include "memory.h"
#include "index.h"
#include "404.h"

/* === LIB VARS === */

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan wol(UDP);
WiFiManager wifiManager;

/* === APP VARS === */

// Map for storing hosts
std::map<int, Host> hosts;
// Map for storing hosts status like is online or not
std::map<int, boolean> hostsStatus;

std::map<String, unsigned long> activeSessions;  // <session token, create at>

GTimer<millis> pingTimer;

struct Settings settings = {
  .pingPeriod = 60000,  // 1 min
  .networkConfig = {}
};

/* === FUNCTIONS === */

#if ENABLE_STANDARD_OTA == 1
// Function to setup OTA
void setupOTA() {
  ArduinoOTA.setHostname(HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.setPort(ARDUINO_OTA_PORT);
  ArduinoOTA.begin(false);
}
#endif

// Function to update WiFi settings
void updateIPWifiSettings() {
  if (settings.networkConfig.enable) {
    wifiManager.setSTAStaticIPConfig(settings.networkConfig.ip, settings.networkConfig.gateway, settings.networkConfig.networkMask, settings.networkConfig.dns);
  } else {
    wifi_station_dhcpc_start();
  }
}

// Function to ping all hosts periodically
void pingAllHosts() {
  for (const auto& pair : hosts) {
    int index = pair.first;
    const Host& host = pair.second;

    IPAddress ip;
    ip.fromString(host.ip);
    bool pingResult = Ping.ping(ip, 1);
    hostsStatus[index] = pingResult;

    // If host is offline and autoWake is enabled, send WOL packet
    if (!pingResult && host.autoWake) {
      wol.sendMagicPacket(host.mac.c_str());
    }
  }
}

/* === MAIN === */

// Server setup
void setup() {
  WiFi.hostname(FPSTR(HOSTNAME));

  // Initialize file system
  if (!LittleFS.begin()) {
    LittleFS.format();
    LittleFS.begin();
  }

#if ENABLE_STANDARD_OTA == 1
  setupOTA();
#endif

  // Load data at startup
  loadHosts();
  loadSettings();

  updateIPWifiSettings();

  wifiManager.autoConnect(SSID);  // Auto connect

#if ENABLE_mDNS == 1
  // Set up mDNS responder
  //  the fully-qualified domain name is "wol.local"
  MDNS.begin(FPSTR(HOSTNAME));
  MDNS.addService("http", "tcp", 80);
#if ENABLE_STANDARD_OTA == 1
  MDNS.enableArduino(ENABLE_STANDARD_OTA, true);
#endif
#endif

  setupHeaders();
  setupRoutes();

  server.begin();

  pingTimer.setTime(settings.pingPeriod);
  pingTimer.start();
}

void loop() {
  
#if ENABLE_STANDARD_OTA == 1
  ArduinoOTA.handle();
#endif

#if ENABLE_mDNS == 1
  MDNS.update();
#endif

  server.handleClient();

  if (pingTimer) {
    pingAllHosts();
  }

  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}