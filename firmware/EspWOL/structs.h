#ifndef STRUCTS_H
#define STRUCTS_H

struct Host {
  String name;
  String mac;
  String ip;
  bool autoWake;
};

struct NetworkConfig {
  bool enable = false;
  IPAddress ip;
  IPAddress networkMask;
  IPAddress gateway;
  IPAddress dns;
};

struct User {
  String username;
  String password;
};

struct Settings {
  unsigned long pingPeriod;
  struct NetworkConfig networkConfig;
};

#endif
