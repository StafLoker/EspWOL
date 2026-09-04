#include "settings.h"

// =============================================================================
// INPUT VALIDATION
// =============================================================================

static bool is_valid_ping_period(unsigned long value) {
  return VALID_PING_VALUES.find(value) != VALID_PING_VALUES.end();
}

static bool is_valid_network_ip(const String &ip) {
  IPAddress parsed;
  return parsed.fromString(ip);
}

// =============================================================================
// PERSISTENCE
// =============================================================================

static void settings_save() {
  File file = LittleFS.open(FPSTR(SETTINS_FILE_PATH), "w");
  JsonDocument doc;

  if (file) {
    doc[F("pingPeriod")] = settings.ping_period_ms;
    doc[F("enable")] = settings.network_config.enable;
    doc[F("ip")] = settings.network_config.ip.toString();
    doc[F("networkMask")] = settings.network_config.network_mask.toString();
    doc[F("gateway")] = settings.network_config.gateway.toString();
    doc[F("dns")] = settings.network_config.dns.toString();
    serializeJson(doc, file);
    file.close();
  }
}

void settings_load() {
  JsonDocument doc;
  IPAddress ip, network_mask, gateway, dns;

  if (LittleFS.exists(FPSTR(SETTINS_FILE_PATH))) {
    File file = LittleFS.open(FPSTR(SETTINS_FILE_PATH), "r");

    if (file) {
      DeserializationError error = deserializeJson(doc, file);

      if (!error) {
        settings.ping_period_ms = doc[F("pingPeriod")].as<unsigned long>();

        ip.fromString(doc[F("ip")].as<String>());
        network_mask.fromString(doc[F("networkMask")].as<String>());
        gateway.fromString(doc[F("gateway")].as<String>());
        dns.fromString(doc[F("dns")].as<String>());

        settings.network_config.enable = doc[F("enable")];
        settings.network_config.ip = ip;
        settings.network_config.network_mask = network_mask;
        settings.network_config.gateway = gateway;
        settings.network_config.dns = dns;
      }
      file.close();
    }
  } else {
    settings_save();
  }
}

// =============================================================================
// GENERAL / ABOUT
// =============================================================================

static void settings_get_all() {
  JsonDocument doc;
  JsonObject about, network;

  about = doc[F("about")].to<JsonObject>();
  network = doc[F("network")].to<JsonObject>();

  about[F("version")] = FPSTR(VERSION);
  about[F("hostname")] = wifi_manager.getWiFiHostname();

  doc[F("pingPeriod")] = settings.ping_period_ms;

  network[F("enable")] = settings.network_config.enable;
  if (settings.network_config.enable) {
    network[F("ip")] = settings.network_config.ip.toString();
    network[F("networkMask")] = settings.network_config.network_mask.toString();
    network[F("gateway")] = settings.network_config.gateway.toString();
    network[F("dns")] = settings.network_config.dns.toString();
  } else {
    network[F("ip")] = WiFi.localIP().toString();
    network[F("networkMask")] = WiFi.subnetMask().toString();
    network[F("gateway")] = WiFi.gatewayIP().toString();
    network[F("dns")] = WiFi.dnsIP().toString();
  }

  server_send_json(200, true, F("Settings"), doc);
}

// =============================================================================
// PING PERIOD
// =============================================================================

static void settings_get_ping_period() {
  JsonDocument doc;
  doc[F("pingPeriod")] = settings.ping_period_ms;
  server_send_json(200, true, F("Ping period"), doc);
}

static void settings_update_ping_period() {
  JsonDocument doc, response_doc;
  unsigned long ping_period_ms;

  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    server_send_json(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    server_send_json(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (doc[F("pingPeriod")].isNull()) {
    server_send_json(400, false, FPSTR(MSG_MISSING_FIELDS));
    return;
  }

  ping_period_ms = doc[F("pingPeriod")].as<unsigned long>();

  if (!is_valid_ping_period(ping_period_ms)) {
    server_send_json(400, false, F("Invalid ping period value"));
    return;
  }

  settings.ping_period_ms = ping_period_ms;
  settings_save();

  ping_apply_period_config();

  response_doc[F("pingPeriod")] = settings.ping_period_ms;
  server_send_json(200, true, F("Ping period updated"), response_doc);
}

// =============================================================================
// NETWORK
// =============================================================================

static void settings_get_network() {
  JsonDocument doc;
  doc[F("enable")] = settings.network_config.enable;
  if (settings.network_config.enable) {
    doc[F("ip")] = settings.network_config.ip.toString();
    doc[F("networkMask")] = settings.network_config.network_mask.toString();
    doc[F("gateway")] = settings.network_config.gateway.toString();
    doc[F("dns")] = settings.network_config.dns.toString();
  } else {
    doc[F("ip")] = WiFi.localIP().toString();
    doc[F("networkMask")] = WiFi.subnetMask().toString();
    doc[F("gateway")] = WiFi.gatewayIP().toString();
    doc[F("dns")] = WiFi.dnsIP().toString();
  }
  server_send_json(200, true, F("Network settings"), doc);
}

static void settings_update_network() {
  JsonDocument doc, response_doc;
  String ip_str, networkMask_str, gateway_str, dns_str;
  IPAddress ip, network_mask, gateway, dns;

  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    server_send_json(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    server_send_json(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (doc[F("enable")].isNull() || doc[F("ip")].isNull() || doc[F("networkMask")].isNull() || doc[F("gateway")].isNull() || doc[F("dns")].isNull()) {
    server_send_json(400, false, FPSTR(MSG_MISSING_FIELDS));
    return;
  }

  if (!doc[F("enable")].is<bool>()) {
    server_send_json(400, false, FPSTR(MSG_INVALID_FORMAT));
    return;
  }

  settings.network_config.enable = doc[F("enable")];
  if (settings.network_config.enable) {
    ip_str = doc[F("ip")].as<String>();
    networkMask_str = doc[F("networkMask")].as<String>();
    gateway_str = doc[F("gateway")].as<String>();
    dns_str = doc[F("dns")].as<String>();

    if (!is_valid_network_ip(ip_str) || !is_valid_network_ip(networkMask_str) || !is_valid_network_ip(gateway_str) || !is_valid_network_ip(dns_str)) {
      server_send_json(400, false, FPSTR(MSG_INVALID_FORMAT));
      return;
    }

    ip.fromString(ip_str);
    network_mask.fromString(networkMask_str);
    gateway.fromString(gateway_str);
    dns.fromString(dns_str);

    settings.network_config.ip = ip;
    settings.network_config.network_mask = network_mask;
    settings.network_config.gateway = gateway;
    settings.network_config.dns = dns;
  } else {
    settings.network_config.ip = IPAddress();
    settings.network_config.network_mask = IPAddress();
    settings.network_config.gateway = IPAddress();
    settings.network_config.dns = IPAddress();
  }

  settings_save();
  wifi_apply_ip_config();

  response_doc[F("enable")] = settings.network_config.enable;
  if (settings.network_config.enable) {
    response_doc[F("ip")] = settings.network_config.ip.toString();
    response_doc[F("networkMask")] = settings.network_config.network_mask.toString();
    response_doc[F("gateway")] = settings.network_config.gateway.toString();
    response_doc[F("dns")] = settings.network_config.dns.toString();
  } else {
    response_doc[F("ip")] = WiFi.localIP().toString();
    response_doc[F("networkMask")] = WiFi.subnetMask().toString();
    response_doc[F("gateway")] = WiFi.gatewayIP().toString();
    response_doc[F("dns")] = WiFi.dnsIP().toString();
  }

  server_send_json(200, true, F("Network settings updated"), response_doc);
  delay(300);
  ESP.restart();
}

// =============================================================================
// WIFI RESET
// =============================================================================

static void settings_reset_wifi() {
  server_send_json(200, true, F("WiFi settings have been reset successfully."));
  delay(300);
  wifi_manager.resetSettings();
  ESP.restart();
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

static void settings_handle_get() {
  if (auth_ok()) {
    settings_get_all();
  }
}

static void settings_handle_about() {
  JsonDocument doc;

  if (auth_ok()) {
    doc[F("version")] = FPSTR(VERSION);
    doc[F("hostname")] = wifi_manager.getWiFiHostname();
    server_send_json(200, true, F("App general information"), doc);
  }
}

static void settings_handle_ping_period() {
  if (auth_ok()) {
    if (server.method() == HTTP_GET) {
      settings_get_ping_period();
    } else if (server.method() == HTTP_PUT) {
      settings_update_ping_period();
    } else {
      server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

static void settings_handle_network() {
  if (auth_ok()) {
    if (server.method() == HTTP_GET) {
      settings_get_network();
    } else if (server.method() == HTTP_PUT) {
      settings_update_network();
    } else {
      server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

static void settings_handle_reset_wifi() {
  if (auth_ok()) {
    settings_reset_wifi();
  }
}

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

void settings_setup_routes() {
  server.on(FPSTR(ROUTE_SETTINGS), HTTP_GET, settings_handle_get);
  server.on(FPSTR(ROUTE_SETTINGS_NETWORK), HTTP_ANY, settings_handle_network);
  server.on(FPSTR(ROUTE_SETTINGS_ABOUT), HTTP_GET, settings_handle_about);
  server.on(FPSTR(ROUTE_SETTINGS_PING), HTTP_ANY, settings_handle_ping_period);
  server.on(FPSTR(ROUTE_SETTINGS_RESET_WIFI), HTTP_POST, settings_handle_reset_wifi);
}
