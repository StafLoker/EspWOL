#ifndef HOSTS_H
#define HOSTS_H

#define MAX_HOST_NAME_LENGTH 32

struct Host {
  String name;
  String mac;
  String ip;
  bool auto_wake = false;
  bool status = false;
};

const char HOSTS_FILE_PATH[] PROGMEM = "/hosts.json";

const char ROUTE_HOSTS[] PROGMEM = "/hosts";
const char ROUTE_HOSTS_IMPORT[] PROGMEM = "/hosts/import";
const char ROUTE_HOSTS_WAKE[] PROGMEM = "/hosts/wake";
const char ROUTE_HOSTS_PING[] PROGMEM = "/hosts/ping";

const char MSG_HOST_NOT_FOUND[] PROGMEM = "Host not found";
const char MSG_DUPLICATE_HOST[] PROGMEM = "Duplicate host";
const char MSG_MAX_HOSTS_REACHED[] PROGMEM = "Maximum number of hosts reached";

// Registers /hosts, /hosts/import, /hosts/wake and /hosts/ping.
void hosts_setup_routes();

// Reads the host map from flash. Call once at startup.
void hosts_load();

#endif
