/*
  Project: EspWOL
  Author: StafLoker
  Author website: https://stafloker.name
  Project repo: https://github.com/StafLoker/EspWOL
  Version: 3.0.2
*/

#include <Arduino.h>

#define ENABLE_mDNS 1  // 1 to enable, != 1 to disable

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
#include "ping.h"

const char VERSION[] PROGMEM = "3.0.2";

const char HOSTNAME[] PROGMEM = "espwol";

const char AP_SSID[] = "EspWOL AP";
const char AP_PASSWORD[] = "wol#AP326s";

const char INIT_USER_USERNAME[] PROGMEM = "glavniy";
const char INIT_USER_PASSWORD[] PROGMEM = "Lep#Chick43";

/* === LIB VARS === */

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan wol(UDP);
WiFiManager wifi_manager;

/* === APP VARS === */

User user = { FPSTR(INIT_USER_USERNAME), FPSTR(INIT_USER_PASSWORD) };

// Map for storing hosts
std::map<int, Host> hosts;

struct Settings settings = {
  .ping_period_ms = 60000,  // 1 min
  .network_config = {}
};

/* === MAIN === */

// Server setup
void setup() {
  WiFi.hostname(FPSTR(HOSTNAME));

  LittleFS.begin();

  // Load data at startup
  hosts_load();
  settings_load();
  auth_load_user();

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

  ping_start_sweep();
}

void loop() {

#if ENABLE_mDNS == 1
  MDNS.update();
#endif

  server.handleClient();
  ota_loop();

  ping_service_tick();

  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}
