/*
  Project: EspWOL
  Author: StafLoker
  Author website: https://stafloker.name
  Project repo: https://github.com/StafLoker/EspWOL
  Version: 3.0.0
*/

#include <Arduino.h>

#define ENABLE_mDNS 1  // 1 to enable, != 1 to disable

const char HOSTNAME[] PROGMEM = "espwol";

const char AP_SSID[] = "EspWOL AP";
const char AP_PASSWORD[] = "wol#AP326s";

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

/* OTA (web upload) */
#include <StreamString.h>

/* Time */
#include <GTimer.h>

/* Project files */
#include "hosts.h"
#include "auth.h"
#include "settings.h"
#include "server.h"
#include "ota_handler.h"
#include "wifi.h"
#include "memory.h"

/* === LIB VARS === */

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan wol(UDP);
WiFiManager wifi_manager;

/* === APP VARS === */

// Map for storing hosts
std::map<int, Host> hosts;

GTimer<millis> ping_timer;

struct Settings settings = {
  .ping_period_ms = 60000,  // 1 min
  .network_config = {}
};

/* === FUNCTIONS === */

// A period of 0 means "disabled". GTimer fires on every tick() when its period
// is 0, so the timer has to be stopped rather than just given a 0 period.
void ping_apply_period_config() {
  if (settings.ping_period_ms == 0) {
    ping_timer.stop();
  } else {
    ping_timer.setTime(settings.ping_period_ms);
    ping_timer.start();
  }
}

// Function to ping all hosts periodically
void ping_all_hosts() {
  IPAddress ip;
  bool ping_result;

  for (auto &pair : hosts) {
    int index = pair.first;
    Host &host = pair.second;

    ip.fromString(host.ip);
    ping_result = Ping.ping(ip, PING_COUNT_QUICK);
    hosts[index].status = ping_result;

    // If host is offline and auto_wake is enabled, send WOL packet
    if (!ping_result && host.auto_wake) {
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

  // Load data at startup
  hosts_load();
  settings_load();

  wifi_apply_ip_config();

  wifi_setup_portal();
  wifi_manager.autoConnect(AP_SSID, AP_PASSWORD);  // Auto connect

#if ENABLE_mDNS == 1
  // Set up mDNS responder
  //  the fully-qualified domain name is "wol.local"
  MDNS.begin(FPSTR(HOSTNAME));
  MDNS.addService("http", "tcp", 80);
#endif

  ping_apply_period_config();

  server_setup();

  server.begin();

  ping_all_hosts();
}

void loop() {

#if ENABLE_mDNS == 1
  MDNS.update();
#endif

  server.handleClient();
  ota_loop();

  if (ping_timer) {
    ping_all_hosts();
  }

  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}
