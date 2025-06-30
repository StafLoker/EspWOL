#ifndef CONSTS_H
#define CONSTS_H

#include <unordered_set>

const char VERSION[] PROGMEM = "3.0.0";

#define ENABLE_mDNS 1  // Values: 1 to enable, != 1 to disable

// OTA has bugs, chip hace infinite reload.
#define ENABLE_OTA 0  // Values: 1 to enable, != 1 to disable

/* Repository */
const char HOSTS_FILE_PATH[] PROGMEM = "/hosts.json";
const char USER_FILE_PATH[] PROGMEM = "/user.json";
const char SETTINS_FILE_PATH[] PROGMEM = "/settings.json";

/* Network */
const char HOSTNAME[] PROGMEM = "wol";
const char* SSID = "WOL-ESP8266";

/* OTA */
const char OTA_PASSWORD[] PROGMEM = "ber#912NerYi";

/* Initial user */
const char INIT_USER_USERNAME[] PROGMEM = "glavniy";
const char INIT_USER_PASSWORD[] PROGMEM = "Lep#Chick43";

#define SESSION_TIMEOUT 900000  // 30 min in ms

/* HTTP Content Types */
const char CONTENT_TYPE_JSON[] PROGMEM = "application/json";
const char CONTENT_TYPE_HTML[] PROGMEM = "text/html";

/* Common HTTP Headers */
const char HEADER_SESSION_TOKEN[] PROGMEM = "X-Session-Token";

/* Common Messages */
const char MSG_MISSING_BODY[] PROGMEM = "Missing body";
const char MSG_INVALID_JSON[] PROGMEM = "Invalid JSON";
const char MSG_MISSING_FIELDS[] PROGMEM = "Missing required fields";
const char MSG_INVALID_FORMAT[] PROGMEM = "Invalid data format";
const char MSG_METHOD_NOT_ALLOWED[] PROGMEM = "HTTP Method Not Allowed";
const char MSG_NOT_FOUND[] PROGMEM = "Not found";
const char MSG_AUTH_REQUIRED[] PROGMEM = "Authentication required";
const char MSG_HOST_NOT_FOUND[] PROGMEM = "Host not found";
const char MSG_DUPLICATE_HOST[] PROGMEM = "Duplicate host";
const char MSG_SUCCESS[] PROGMEM = "Success";

/* Server Routes */
const char ROUTE_LOGIN[] PROGMEM = "/login";
const char ROUTE_LOGOUT[] PROGMEM = "/logout";
const char ROUTE_HOSTS[] PROGMEM = "/hosts";
const char ROUTE_IMPORT[] PROGMEM = "/import";
const char ROUTE_WAKE[] PROGMEM = "/wake";
const char ROUTE_PING[] PROGMEM = "/ping";
const char ROUTE_SETTINGS[] PROGMEM = "/settings";
const char ROUTE_SETTINGS_NETWORK[] PROGMEM = "/settings/network";
const char ROUTE_SETTINGS_AUTH[] PROGMEM = "/settings/auth";
const char ROUTE_SETTINGS_ABOUT[] PROGMEM = "/settings/about";
const char ROUTE_SETTINGS_PING[] PROGMEM = "/settings/ping_period";
const char ROUTE_SETTINGS_RESET_WIFI[] PROGMEM = "/settings/reset_wifi";
const char ROUTE_ROOT[] PROGMEM = "/";

/* Server Arguments */
const char ARG_PLAIN[] PROGMEM = "plain";
const char ARG_ID[] PROGMEM = "id";

/* Validation */
const std::unordered_set< unsigned long> VALID_PING_VALUES = {
  0, 60, 300, 600, 900, 1800, 2700, 3600, 10800, 21600, 43200, 86400
}; // in sec

#endif