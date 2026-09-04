/*
  Project: EspWOL
  Author: StafLoker
  Author website: https://stafloker.name
  Project repo: https://github.com/StafLoker/EspWOL
  Version: 3.0.0
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

const char HOSTNAME[] PROGMEM = "espwol";

const char AP_SSID[] = "EspWOL AP";
const char AP_PASSWORD[] = "wol#AP326s";

/* === LIB VARS === */

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan wol(UDP);
WiFiManager wifi_manager;

/* === APP VARS === */

User user = { FPSTR(INIT_USER_USERNAME), FPSTR(INIT_USER_PASSWORD) };

// Map for storing hosts
std::map<int, Host> hosts;

GTimer<millis> ping_timer;

struct Settings settings = {
  .ping_period_ms = 60000,  // 1 min
  .network_config = {}
};

// A sweep in progress, and the last host it handled. Tracking the id rather
// than an iterator keeps this valid when a host is added or deleted mid-sweep.
static bool ping_sweep_active = false;
static int ping_next_id = 0;


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

// Pings one host, updating its status and waking it when it is due.
static void ping_one(Host &host) {
  IPAddress ip;

  ip.fromString(host.ip);
  host.status = Ping.ping(ip, PING_COUNT_QUICK);

  // If host is offline and auto_wake is enabled, send WOL packet
  if (!host.status && host.auto_wake) {
    wol.sendMagicPacket(host.mac.c_str());
  }
}

static void ping_step() {
  if (ping_sweep_active) {
    auto it = hosts.upper_bound(ping_next_id);

    if (it == hosts.end()) {
      ping_sweep_active = false;
    } else {
      ping_next_id = it->first;
      ping_one(it->second);
    }
  }
}

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

  ping_sweep_active = true;
  ping_next_id = 0;
}

void loop() {

#if ENABLE_mDNS == 1
  MDNS.update();
#endif

  server.handleClient();
  ota_loop();

  if (ping_timer) {
    ping_sweep_active = true;
    ping_next_id = 0;  // ids start at 1, so this restarts the sweep
  }

  ping_step();

  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}
