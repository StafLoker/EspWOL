#include "hosts.h"

// =============================================================================
// INPUT VALIDATION
// =============================================================================

static bool is_valid_host_ip(const String &ip) {
  IPAddress parsed;
  return parsed.fromString(ip);
}

static bool is_valid_mac(const String &mac) {
  if (mac.length() != 17)
    return false;

  for (int i = 0; i < mac.length(); i++) {
    if (i % 3 == 2) {
      if (mac[i] != ':')
        return false;
    } else if (!isHexadecimalDigit(mac[i])) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// HELPERS
// =============================================================================

static int hosts_generate_id() {
  int new_id = 1;

  while (hosts.find(new_id) != hosts.end()) {
    new_id++;
  }

  return new_id;
}

static bool hosts_is_duplicate(const Host &new_host, int exclude_id = -1) {
  for (const auto &pair : hosts) {
    const Host &existing_host = pair.second;
    const int current_id = pair.first;

    if (current_id == exclude_id) {
      continue;
    }

    if (existing_host.mac == new_host.mac || existing_host.ip == new_host.ip) {
      return true;
    }
  }
  return false;
}

// Fills name/mac/ip/auto_wake from the request body. On any problem it answers
// the client and returns false, so callers just `if (!...) return;`.
static bool hosts_validate_data(const JsonDocument &doc, String &name, String &mac, String &ip, bool &auto_wake) {
  if (doc[F("name")].isNull() || doc[F("mac")].isNull() || doc[F("ip")].isNull() || doc[F("autoWake")].isNull()) {
    server_send_json(400, false, FPSTR(MSG_MISSING_FIELDS));
    return false;
  }

  name = doc[F("name")].as<String>();
  mac = doc[F("mac")].as<String>();
  ip = doc[F("ip")].as<String>();
  auto_wake = doc[F("autoWake")].as<bool>();

  if (name.isEmpty() || name.length() > MAX_HOST_NAME_LENGTH || !is_valid_mac(mac) || !is_valid_host_ip(ip)) {
    server_send_json(400, false, FPSTR(MSG_INVALID_FORMAT));
    return false;
  }

  return true;
}

static JsonObject hosts_to_json(JsonDocument &doc, int id, const Host &host) {
  JsonObject obj = doc.to<JsonObject>();
  obj[F("id")] = id;
  obj[F("name")] = host.name;
  obj[F("mac")] = host.mac;
  obj[F("ip")] = host.ip;
  obj[F("autoWake")] = host.auto_wake;
  obj[F("status")] = host.status;
  return obj;
}

// =============================================================================
// PERSISTENCE
// =============================================================================

void hosts_load() {
  JsonDocument doc;
  File file = LittleFS.open(FPSTR(HOSTS_FILE_PATH), "r");

  if (file) {
    DeserializationError error = deserializeJson(doc, file);

    if (!error) {
      hosts.clear();
      for (JsonVariant v : doc.as<JsonArray>()) {
        Host host;
        host.name = v[F("name")].as<String>();
        host.mac = v[F("mac")].as<String>();
        host.ip = v[F("ip")].as<String>();
        host.auto_wake = v[F("autoWake")].as<bool>();
        hosts[v[F("id")].as<int>()] = host;
      }
    }
    file.close();
  }
}

static void hosts_save() {
  JsonDocument doc;
  JsonArray array;
  JsonObject obj;
  File file = LittleFS.open(FPSTR(HOSTS_FILE_PATH), "w");

  if (file) {
    array = doc.to<JsonArray>();

    for (const auto &pair : hosts) {
      const Host &host = pair.second;

      obj = array.add<JsonObject>();
      obj[F("id")] = pair.first;
      obj[F("name")] = host.name;
      obj[F("mac")] = host.mac;
      obj[F("ip")] = host.ip;
      obj[F("autoWake")] = host.auto_wake;
    }
    serializeJson(doc, file);
    file.close();
  }
}

// =============================================================================
// SERVICE
// =============================================================================

// Create

static void hosts_add() {
  JsonDocument doc, response_doc;
  String name, mac, ip;
  IPAddress ip_address;
  bool auto_wake;
  int id;

  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    server_send_json(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (!memory_can_add_host()) {
    server_send_json(507, false, FPSTR(MSG_MAX_HOSTS_REACHED));
    return;
  }

  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    server_send_json(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (!hosts_validate_data(doc, name, mac, ip, auto_wake))
    return;

  Host host = { name, mac, ip, auto_wake, false };

  if (hosts_is_duplicate(host)) {
    server_send_json(409, false, FPSTR(MSG_DUPLICATE_HOST));
    return;
  }

  ip_address.fromString(host.ip);
  host.status = Ping.ping(ip_address, PING_COUNT_QUICK);

  id = hosts_generate_id();
  hosts[id] = host;

  hosts_save();

  hosts_to_json(response_doc, id, host);
  server_send_json(200, true, F("Host added"), response_doc, true);
}

// Read

static void hosts_get_list() {
  JsonDocument doc;
  JsonArray array;
  JsonObject obj;

  array = doc.to<JsonArray>();

  for (const auto &pair : hosts) {
    const Host &host = pair.second;

    obj = array.add<JsonObject>();
    obj[F("id")] = pair.first;
    obj[F("name")] = host.name;
    obj[F("mac")] = host.mac;
    obj[F("ip")] = host.ip;
    obj[F("autoWake")] = host.auto_wake;
    obj[F("status")] = host.status;
  }

  server_send_json(200, true, F("Your hosts"), doc, true);
}

static void hosts_get_one(int id) {
  auto it = hosts.find(id);
  JsonDocument doc;

  if (it != hosts.end()) {
    Host &host = it->second;

    hosts_to_json(doc, id, host);
    server_send_json(200, true, F("Your host"), doc);
  } else {
    server_send_json(400, false, FPSTR(MSG_HOST_NOT_FOUND));
  }
}

// Update

static void hosts_edit(int id) {
  JsonDocument doc, response_doc;
  String name, mac, ip;
  IPAddress ip_address;
  bool auto_wake;

  if (!server.hasArg(FPSTR(ARG_PLAIN))) {
    server_send_json(400, false, FPSTR(MSG_MISSING_BODY));
    return;
  }

  if (hosts.find(id) == hosts.end()) {
    server_send_json(400, false, FPSTR(MSG_HOST_NOT_FOUND));
    return;
  }

  if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
    server_send_json(400, false, FPSTR(MSG_INVALID_JSON));
    return;
  }

  if (!hosts_validate_data(doc, name, mac, ip, auto_wake))
    return;

  Host new_host = { name, mac, ip, auto_wake, false };

  if (hosts_is_duplicate(new_host, id)) {
    server_send_json(409, false, FPSTR(MSG_DUPLICATE_HOST));
    return;
  }

  ip_address.fromString(new_host.ip);
  new_host.status = Ping.ping(ip_address, PING_COUNT_QUICK);

  hosts[id] = new_host;

  hosts_save();

  hosts_to_json(response_doc, id, hosts[id]);
  server_send_json(200, true, F("Host updated"), response_doc, true);
}

// Delete

static void hosts_delete(int id) {
  if (hosts.find(id) != hosts.end()) {
    hosts.erase(id);
    hosts_save();
    server_send_json(200, true, F("Host deleted"), true);
  } else {
    server_send_json(400, false, FPSTR(MSG_HOST_NOT_FOUND));
  }
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

static void hosts_handle_collection() {
  if (auth_ok()) {
    if (server.method() == HTTP_GET) {
      hosts_get_list();
    } else if (server.method() == HTTP_POST) {
      hosts_add();
    } else {
      server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

static void hosts_handle_by_id() {
  if (auth_ok()) {
    const int id = server.arg(FPSTR(ARG_ID)).toInt();

    if (server.method() == HTTP_GET) {
      hosts_get_one(id);
    } else if (server.method() == HTTP_PUT) {
      hosts_edit(id);
    } else if (server.method() == HTTP_DELETE) {
      hosts_delete(id);
    } else {
      server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    }
  }
}

static void hosts_handle_import() {
  JsonDocument doc, response_doc;
  JsonArray arr;
  int imported_count = 0, ignored_count = 0;

  if (auth_ok()) {
    if (!server.hasArg(FPSTR(ARG_PLAIN))) {
      server_send_json(400, false, FPSTR(MSG_MISSING_BODY));
      return;
    }

    if (deserializeJson(doc, server.arg(FPSTR(ARG_PLAIN)))) {
      server_send_json(400, false, FPSTR(MSG_INVALID_JSON));
      return;
    }

    if (!doc.is<JsonArray>()) {
      server_send_json(400, false, F("Expected JSON array"));
      return;
    }

    arr = doc.as<JsonArray>();

    for (JsonVariant v : arr) {
      String name, mac, ip;
      bool auto_wake;

      if (!memory_can_add_host() || v[F("name")].isNull() || v[F("mac")].isNull() || v[F("ip")].isNull()) {
        ignored_count++;
        continue;
      }

      name = v[F("name")].as<String>();
      mac = v[F("mac")].as<String>();
      ip = v[F("ip")].as<String>();

      if (name.isEmpty() || name.length() > MAX_HOST_NAME_LENGTH || !is_valid_mac(mac) || !is_valid_host_ip(ip)) {
        ignored_count++;
        continue;
      }

      auto_wake = v[F("autoWake")] | false;

      Host host = { name, mac, ip, auto_wake, false };

      if (hosts_is_duplicate(host)) {
        ignored_count++;
        continue;
      }

      hosts[hosts_generate_id()] = host;
      imported_count++;
    }

    if (imported_count > 0) {
      hosts_save();
    }

    response_doc[F("imported_count")] = imported_count;
    response_doc[F("ignored_count")] = ignored_count;
    response_doc[F("input_size")] = arr.size();
    response_doc[F("current_host_count")] = hosts.size();

    if (imported_count > 0) {
      server_send_json(200, true, F("Import successful"), response_doc, true);
    } else {
      server_send_json(200, false, F("No hosts were imported"), response_doc, true);
    }
  }
}

static void hosts_handle_wake() {
  if (!auth_ok()) return;

  if (!server.hasArg(FPSTR(ARG_ID))) {
    server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    return;
  }

  auto it = hosts.find(server.arg(FPSTR(ARG_ID)).toInt());
  if (it == hosts.end()) {
    server_send_json(400, false, FPSTR(MSG_HOST_NOT_FOUND));
    return;
  }

  bool sent = wol.sendMagicPacket(it->second.mac.c_str());
  server_send_json(200, sent, sent ? F("WOL packet sent") : F("Failed to send WOL packet"));
}

static void hosts_handle_ping() {
  if (!auth_ok()) return;

  if (!server.hasArg(FPSTR(ARG_ID))) {
    server_send_json(405, false, FPSTR(MSG_METHOD_NOT_ALLOWED));
    return;
  }

  auto it = hosts.find(server.arg(FPSTR(ARG_ID)).toInt());
  if (it == hosts.end()) {
    server_send_json(400, false, FPSTR(MSG_HOST_NOT_FOUND));
    return;
  }

  Host &host = it->second;
  IPAddress ip;
  ip.fromString(host.ip);

  host.status = Ping.ping(ip, PING_COUNT_CHECK);
  server_send_json(200, host.status, host.status ? F("Host is online") : F("Host is offline"));
}

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

void hosts_setup_routes() {
  server.on(FPSTR(ROUTE_HOSTS), HTTP_ANY, []() {
    if (server.hasArg(FPSTR(ARG_ID))) {
      hosts_handle_by_id();
    } else {
      hosts_handle_collection();
    }
  });

  server.on(FPSTR(ROUTE_HOSTS_IMPORT), HTTP_POST, hosts_handle_import);
  server.on(FPSTR(ROUTE_HOSTS_WAKE), HTTP_POST, hosts_handle_wake);
  server.on(FPSTR(ROUTE_HOSTS_PING), HTTP_POST, hosts_handle_ping);
}
