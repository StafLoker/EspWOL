#ifndef CONSTS_H
#define CONSTS_H

#define VERSION "3.0.0"

#define ENABLE_mDNS 1  // Values: 1 to enable, != 1 to disable

#define ENABLE_STANDARD_OTA 1  // Values: 1 to enable, != 1 to disable

/* Repository */
const char* hostsFile = "/hosts.json";
const char* userFile = "/user.json";
const char* settingsFile = "/settings.json";

/* Network */
const char* hostname = "wol";
const char* SSID = "WOL-ESP8266";

/* OTA */
const char* otaPassword = "ber#912NerYi";

/* Initial user */
#define INIT_USER_USERNAME "glavniy"
#define INIT_USER_PASSWORD "Lep#Chick43"

#define SESSION_TIMEOUT 900000  // 30 min in ms

#endif