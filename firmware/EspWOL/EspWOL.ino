/* 
  Project: EspWOL 
  Author: StafLoker
  Version: 3.0.0
  Refactored with functional approach instead of classes
*/

/* Network */
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiUdp.h>
#include <WakeOnLan.h>
#include <WiFiManager.h>
#include <ESP8266Ping.h>

#define ENABLE_mDNS 1  // Values: 1 to enable, != 1 to disable

#if ENABLE_mDNS == 1
#include <ESP8266mDNS.h>
#endif

/* Memory */
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <map>

/* OTA */
#define ENABLE_STANDARD_OTA 1  // Values: 1 to enable, != 1 to disable

#if ENABLE_STANDARD_OTA == 1
#include <ArduinoOTA.h>
#define ArduinoOTA_PORT 8266
#endif

/* Time */
#include <GTimer.h>

/* Project files */
#include "routes.h"
#include "auth_routes.h"
#include "host_routes.h"
#include "network_routes.h"
#include "settings_routes.h"
#include "web_routes.h"
#include "repository.h"
#include "validation.h"
#include "index.h"

#define VERSION "3.0.0"

ESP8266WebServer server(80);
WiFiUDP UDP;
WakeOnLan wol(UDP);
WiFiManager wifiManager;

const char* hostsFile = "/hosts.json";
const char* networkConfigFile = "/network.json";
const char* authenticationFile = "/authentication.json";
const char* settingsFile = "/settings.json";

const char* hostname = "wol";
const char* SSID = "WOL-ESP8266";

// Structure for PC data
struct Host {
  String name;
  String mac;
  String ip;
  bool autoWake;
};

// Structure for Network settings
struct NetworkConfig {
  bool enable = false;
  IPAddress ip;
  IPAddress networkMask;
  IPAddress gateway;
  IPAddress dns;
} networkConfig;

// Structure for Authentication settings
struct Authentication {
  bool enable = false;
  String username;
  String password;
} authentication;

struct Settings {
  unsigned long pingPeriod;
} settings;

// Map for storing hosts
std::map<int, Host> hosts;
// Map for storing hosts status like is online or not
std::map<int, boolean> hostsStatus;

GTimer timer;

#if ENABLE_STANDARD_OTA == 1
// Function to setup OTA
void setupOTA() {
  ArduinoOTA.setHostname(hostname);
  ArduinoOTA.setPassword((const char*)"ber#912NerYi");
  ArduinoOTA.setPort(ArduinoOTA_PORT);
  ArduinoOTA.begin(false);
}
#endif

// Function to update WiFi settings
void updateIPWifiSettings() {
  if (networkConfig.enable) {
    wifiManager.setSTAStaticIPConfig(networkConfig.ip, networkConfig.gateway, networkConfig.networkMask, networkConfig.dns);
  } else {
    wifi_station_dhcpc_start();
  }
}

// Function to ping all hosts periodically
void pingAllHosts() {
  for (const auto &pair : hosts) {
    int index = pair.first;
    const Host &host = pair.second;
    
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

// Server setup
void setup() {
  WiFi.hostname(hostname);

  // Initialize file system
  if (!LittleFS.begin()) {
    LittleFS.format();
    LittleFS.begin();
  }

#if ENABLE_STANDARD_OTA == 1
  setupOTA();
#endif

  // Load data at startup
  loadNetworkConfig();
  loadAuthentication();
  loadHostsData();
  loadSettings();

  updateIPWifiSettings();

  wifiManager.autoConnect(SSID);  // Auto connect

#if ENABLE_mDNS == 1
  // Set up mDNS responder
  //  the fully-qualified domain name is "wol.local"
  MDNS.begin(hostname);
  MDNS.addService("http", "tcp", 80);
#if ENABLE_STANDARD_OTA == 1
  MDNS.enableArduino(ArduinoOTA_PORT, true);
#endif
#endif

  // Setup all routes using the new functional approach
  setupRoutes();
  
  server.begin();

  // Setup timer for periodic ping (every 30 seconds)
  timer.setTime(30000, true);
  timer.start();
}

void loop() {

#if ENABLE_STANDARD_OTA == 1
  ArduinoOTA.handle();
#endif

#if ENABLE_mDNS == 1
  MDNS.update();
#endif

  server.handleClient();

  // Check if it's time to ping all hosts
  if (timer.isReady()) {
    pingAllHosts();
  }

  delay(1);  // Reduce power consumption by 60% with a delay https://hackaday.com/2022/10/28/esp8266-web-server-saves-60-power-with-a-1-ms-delay/
}