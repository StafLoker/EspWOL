#ifndef SETTINGS_H
#define SETTINGS_H

#include <unordered_set>

#define PING_COUNT_QUICK 2  // status probe on add/edit and the periodic sweep
#define PING_COUNT_CHECK 3  // explicit "ping this host" from the UI

const char VERSION[] PROGMEM = "3.0.0";
const char SETTINS_FILE_PATH[] PROGMEM = "/settings.json";

const char ROUTE_SETTINGS[] PROGMEM = "/api/settings";
const char ROUTE_SETTINGS_NETWORK[] PROGMEM = "/api/settings/network";
const char ROUTE_SETTINGS_ABOUT[] PROGMEM = "/api/settings/about";
const char ROUTE_SETTINGS_PING[] PROGMEM = "/api/settings/ping_period";
const char ROUTE_SETTINGS_RESET_WIFI[] PROGMEM = "/api/settings/reset_wifi";

const std::unordered_set<unsigned long> VALID_PING_VALUES = {
  0, 60000, 300000, 600000, 900000, 1800000, 2700000, 3600000, 10800000, 21600000, 43200000, 86400000
};  // in ms


struct NetworkConfig {
  bool enable = false;
  IPAddress ip;
  IPAddress network_mask;
  IPAddress gateway;
  IPAddress dns;
};

struct Settings {
  unsigned long ping_period_ms;
  struct NetworkConfig network_config;
};

// Registers /settings and its sub-routes.
void settings_setup_routes();

// Reads settings from flash, writing defaults first if the file is missing.
void settings_load();

#endif
